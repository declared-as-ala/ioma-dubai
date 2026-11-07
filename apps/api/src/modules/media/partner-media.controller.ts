import {
  BadRequestException,
  Controller,
  Get,
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
import { Types } from "mongoose";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { requirePermission } from "../admin/admin-permissions";
import { AuditService } from "../audit/audit.service";
import { StorageService } from "../../common/storage/storage.service";
import { PRODUCT_IMAGE_LIMIT, processProductImage } from "./product-media.service";

const VARIANTS = ["main", "card"] as const;

/** Public, immutable partner photos: /api/media/partners/:id/(main|card). */
@Controller("media/partners")
export class PartnerMediaController {
  constructor(private readonly storage: StorageService) {}
  @Get(":id/:variant")
  @SkipThrottle()
  async image(
    @Param("id") id: string,
    @Param("variant") variant: string,
    @Res() response: Response,
  ) {
    if (!/^[a-f\d]{24}$/i.test(id) || !(VARIANTS as readonly string[]).includes(variant))
      throw new NotFoundException();
    let bytes: Buffer;
    try {
      bytes = await this.storage.getObject("public", `partners/${id}/${variant}.webp`);
    } catch {
      throw new NotFoundException();
    }
    response
      .set({
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      })
      .send(bytes);
  }
}

@Controller("admin/partners")
@UseGuards(JwtAuthGuard)
export class AdminPartnerMediaController {
  constructor(
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  /** Uploaded before the partner exists (create drawer), so it is not tied to a partner id. */
  @Post("media")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: PRODUCT_IMAGE_LIMIT, files: 1 } }),
  )
  async upload(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    requirePermission(user, "partners.manage");
    if (!file) throw new BadRequestException("Choose an image to upload.");
    const processed = await processProductImage(file);
    const id = new Types.ObjectId().toString();
    try {
      await this.storage.upload(
        "public",
        `partners/${id}/main.webp`,
        processed.main.data,
        "image/webp",
      );
      await this.storage.upload(
        "public",
        `partners/${id}/card.webp`,
        processed.card,
        "image/webp",
      );
    } catch {
      await Promise.allSettled([
        this.storage.delete("public", `partners/${id}/main.webp`),
        this.storage.delete("public", `partners/${id}/card.webp`),
      ]);
      throw new ServiceUnavailableException(
        "Image storage is unavailable. Retry this image.",
      );
    }
    await this.audit.recordEvent({
      actorId: user.sub,
      actorEmail: user.email,
      action: "admin.partner.image.uploaded",
      resource: "partners",
      resourceId: id,
      details: {},
    });
    return {
      id,
      url: `/api/media/partners/${id}/main`,
      cardUrl: `/api/media/partners/${id}/card`,
      width: processed.main.info.width,
      height: processed.main.info.height,
    };
  }
}
