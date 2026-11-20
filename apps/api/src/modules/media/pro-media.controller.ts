import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Res,
  ServiceUnavailableException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { SkipThrottle } from "@nestjs/throttler";
import type { Response } from "express";
import { diskStorage } from "multer";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { extname } from "node:path";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { requirePermission } from "../admin/admin-permissions";
import { AuditService } from "../audit/audit.service";
import { StorageService } from "../../common/storage/storage.service";
import { processProductImage } from "./product-media.service";

export const PRO_IMAGE_LIMIT = 15 * 1024 * 1024;
export const PRO_VIDEO_LIMIT = 200 * 1024 * 1024;
const VIDEO_TYPES: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
};
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const UUID = /^[a-f\d-]{36}$/i;

/** Public, immutable pro-space media: images as WebP variants, videos with Range support. */
@Controller("media/pro")
export class ProMediaController {
  constructor(private readonly storage: StorageService) {}

  @Get("video/:id")
  @SkipThrottle()
  async video(
    @Param("id") id: string,
    @Headers("range") range: string | undefined,
    @Res() res: Response,
  ) {
    if (!UUID.test(id)) throw new NotFoundException();
    const found = await this.storage.findByPrefix("public", `pro-video/${id}.`);
    if (!found) throw new NotFoundException();
    const total = found.size;
    const mime = found.key.endsWith(".webm") ? "video/webm" : "video/mp4";
    const base = {
      "Content-Type": mime,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    };
    const m = /^bytes=(\d*)-(\d*)$/.exec(range ?? "");
    if (!m) {
      res.status(200).set({ ...base, "Content-Length": String(total) });
      (await this.storage.getStream("public", found.key)).pipe(res);
      return;
    }
    let start = m[1] === "" ? Math.max(total - Number(m[2]), 0) : Number(m[1]);
    let end = m[1] === "" || m[2] === "" ? total - 1 : Math.min(Number(m[2]), total - 1);
    if (start > end || start >= total) {
      res
        .status(416)
        .set({ "Content-Range": `bytes */${total}` })
        .end();
      return;
    }
    start = Math.max(start, 0);
    end = Math.min(end, total - 1);
    res.status(206).set({
      ...base,
      "Content-Range": `bytes ${start}-${end}/${total}`,
      "Content-Length": String(end - start + 1),
    });
    (await this.storage.getRangeStream("public", found.key, start, end - start + 1)).pipe(
      res,
    );
  }

  @Get(":id/:variant")
  @SkipThrottle()
  async image(
    @Param("id") id: string,
    @Param("variant") variant: string,
    @Res() res: Response,
  ) {
    if (!UUID.test(id) || !["main", "card"].includes(variant))
      throw new NotFoundException();
    let bytes: Buffer;
    try {
      bytes = await this.storage.getObject("public", `pro/${id}/${variant}.webp`);
    } catch {
      throw new NotFoundException();
    }
    res
      .set({
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      })
      .send(bytes);
  }
}

@Controller("admin/pro-media")
@UseGuards(JwtAuthGuard)
export class AdminProMediaController {
  constructor(
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  /**
   * One endpoint for the admin media field. Images become optimised WebP (main + card);
   * videos (MP4/WebM) are streamed from a temp file to object storage, never held in memory
   * or in MongoDB. Type and size are validated here, on the server.
   */
  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: PRO_VIDEO_LIMIT, files: 1 },
      storage: diskStorage({
        destination: tmpdir(),
        filename: (_req, _file, cb) => cb(null, `ioma-upload-${randomUUID()}`),
      }),
    }),
  )
  async upload(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    requirePermission(user, "b2b.manage");
    if (!file) throw new BadRequestException("Choose a file to upload.");
    const tmp = file.path;
    try {
      const id = randomUUID();
      if (IMAGE_TYPES.has(file.mimetype)) {
        if (file.size > PRO_IMAGE_LIMIT)
          throw new BadRequestException("Images can be up to 15 MB.");
        const processed = await processProductImage({
          ...file,
          buffer: await fs.readFile(tmp),
        } as Express.Multer.File);
        try {
          await this.storage.upload(
            "public",
            `pro/${id}/main.webp`,
            processed.main.data,
            "image/webp",
          );
          await this.storage.upload(
            "public",
            `pro/${id}/card.webp`,
            processed.card,
            "image/webp",
          );
        } catch {
          await Promise.allSettled([
            this.storage.delete("public", `pro/${id}/main.webp`),
            this.storage.delete("public", `pro/${id}/card.webp`),
          ]);
          throw new ServiceUnavailableException("Image storage is unavailable. Retry.");
        }
        await this.record(user, "image", id, file);
        return {
          kind: "image" as const,
          id,
          url: `/api/media/pro/${id}/main`,
          cardUrl: `/api/media/pro/${id}/card`,
          width: processed.main.info.width,
          height: processed.main.info.height,
        };
      }
      const ext = VIDEO_TYPES[file.mimetype];
      if (ext) {
        const key = `pro-video/${id}${ext || extname(file.originalname)}`;
        try {
          await this.storage.uploadFile("public", key, tmp, file.mimetype);
        } catch {
          throw new ServiceUnavailableException("Video storage is unavailable. Retry.");
        }
        await this.record(user, "video", id, file);
        return {
          kind: "video" as const,
          id,
          url: `/api/media/pro/video/${id}`,
          size: file.size,
        };
      }
      throw new BadRequestException(
        "Upload a JPG, PNG, WebP, AVIF image or an MP4/WebM video.",
      );
    } finally {
      await fs.rm(tmp, { force: true });
    }
  }

  private record(user: JwtPayload, kind: string, id: string, file: Express.Multer.File) {
    return this.audit.recordEvent({
      actorId: user.sub,
      actorEmail: user.email,
      action: `admin.pro-media.${kind}.uploaded`,
      resource: "pro-media",
      resourceId: id,
      details: { size: file.size, mime: file.mimetype },
    });
  }
}
