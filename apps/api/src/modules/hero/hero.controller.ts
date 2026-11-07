import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  ServiceUnavailableException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import type { Response } from "express";
import { Types } from "mongoose";
import sharp from "sharp";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../../common/guards/auth.decorators";
import { RolesGuard } from "../../common/guards/roles.guard";
import { StorageService } from "../../common/storage/storage.service";
import { processProductImage } from "../media/product-media.service";
import { HeroService } from "./hero.service";

const VIDEO_LIMIT = 80 * 1024 * 1024;

/** mp4 ("ftyp" box at byte 4) or webm (EBML header) - the declared type is not trusted. */
function videoKind(buf: Buffer): "mp4" | "webm" | null {
  if (buf.length > 12 && buf.subarray(4, 8).toString("latin1") === "ftyp") return "mp4";
  if (
    buf.length > 4 &&
    buf[0] === 0x1a &&
    buf[1] === 0x45 &&
    buf[2] === 0xdf &&
    buf[3] === 0xa3
  )
    return "webm";
  return null;
}

@ApiTags("hero")
@Controller()
export class HeroController {
  constructor(
    private readonly hero: HeroService,
    private readonly storage: StorageService,
  ) {}

  @Get("hero/slides")
  @SkipThrottle()
  publicSlides(@Res({ passthrough: true }) res: Response) {
    res.set("Cache-Control", "public, max-age=60");
    return this.hero.publicSlides();
  }

  /** Public media with HTTP Range support so browsers can stream and seek the video. */
  @Get("media/hero/:id/:file")
  @SkipThrottle()
  async media(
    @Param("id") id: string,
    @Param("file") file: string,
    @Headers("range") range: string | undefined,
    @Res() res: Response,
  ) {
    if (file !== "video" && file !== "poster") return res.status(404).end();
    const { bytes, type } = await this.hero.stored(id, file);
    res.set({
      "Content-Type": type,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    });
    const m = range ? /^bytes=(\d*)-(\d*)$/.exec(range) : null;
    if (m) {
      const start = m[1] ? parseInt(m[1], 10) : 0;
      const end = m[2]
        ? Math.min(parseInt(m[2], 10), bytes.length - 1)
        : bytes.length - 1;
      if (start > end || start >= bytes.length) {
        return res.status(416).set("Content-Range", `bytes */${bytes.length}`).end();
      }
      res
        .status(206)
        .set({
          "Content-Range": `bytes ${start}-${end}/${bytes.length}`,
          "Content-Length": String(end - start + 1),
        });
      return res.end(bytes.subarray(start, end + 1));
    }
    res.set("Content-Length", String(bytes.length));
    return res.end(bytes);
  }

  @Get("admin/hero/slides")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("administrator", "super_administrator")
  list() {
    return this.hero.list();
  }

  @Post("admin/hero/slides")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("administrator", "super_administrator")
  create(@Body() body: unknown) {
    return this.hero.create(body);
  }

  @Put("admin/hero/slides/order")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("administrator", "super_administrator")
  reorder(@Body() body: unknown) {
    return this.hero.reorder(body);
  }

  @Patch("admin/hero/slides/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("administrator", "super_administrator")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.hero.update(id, body);
  }

  @Delete("admin/hero/slides/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("administrator", "super_administrator")
  remove(@Param("id") id: string) {
    return this.hero.remove(id);
  }

  /** Upload a clip (mp4/webm, up to 80 MB) or a poster image. Returns the URL to save on the slide. */
  @Post("admin/hero/media")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("administrator", "super_administrator")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: VIDEO_LIMIT, files: 1 } }),
  )
  async upload(@Query("kind") kind: string, @UploadedFile() file: Express.Multer.File) {
    if (!file?.buffer?.length) throw new BadRequestException("Choose a file to upload.");
    const id = new Types.ObjectId().toString();
    try {
      if (kind === "video") {
        const ext = videoKind(file.buffer);
        if (!ext) throw new BadRequestException("Use an MP4 or WebM video.");
        await this.storage.upload(
          "public",
          `hero/${id}/video.${ext}`,
          file.buffer,
          ext === "mp4" ? "video/mp4" : "video/webm",
        );
        return { url: `/api/media/hero/${id}/video`, size: file.buffer.length };
      }
      if (kind === "poster") {
        const processed = await processProductImage(file);
        const out = await sharp(processed.main.data)
          .resize(1920, 1080, { fit: "cover" })
          .webp({ quality: 85 })
          .toBuffer();
        await this.storage.upload("public", `hero/${id}/poster.webp`, out, "image/webp");
        return { url: `/api/media/hero/${id}/poster`, size: out.length };
      }
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new ServiceUnavailableException(
        "File storage is unavailable. Retry the upload.",
      );
    }
    throw new BadRequestException("Unknown upload kind.");
  }
}
