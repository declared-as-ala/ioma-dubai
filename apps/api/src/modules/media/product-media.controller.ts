import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { SkipThrottle } from "@nestjs/throttler";
import type { Response } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { requirePermission } from "../admin/admin-permissions";
import { AuditService } from "../audit/audit.service";
import { PRODUCT_IMAGE_LIMIT, ProductMediaService } from "./product-media.service";

@Controller("media/products")
export class ProductMediaController {
  constructor(private readonly media: ProductMediaService) {}
  @Get(":id/:variant")
  @SkipThrottle()
  async image(
    @Param("id") id: string,
    @Param("variant") variant: string,
    @Res() response: Response,
  ) {
    const bytes = await this.media.bytes(id, variant);
    response
      .set({
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      })
      .send(bytes);
  }
}

@Controller("admin/products")
@UseGuards(JwtAuthGuard)
export class AdminProductMediaController {
  constructor(
    private readonly media: ProductMediaService,
    private readonly audit: AuditService,
  ) {}
  @Post(":id/media")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: PRODUCT_IMAGE_LIMIT, files: 1 } }),
  )
  async upload(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    requirePermission(user, "commerce.manage");
    const asset = await this.media.upload(id, file, user.sub);
    await this.audit.recordEvent({
      actorId: user.sub,
      actorEmail: user.email,
      action: "admin.product.image.uploaded",
      resource: "products",
      resourceId: id,
      details: { assetId: asset.id },
    });
    return asset;
  }
  @Put(":id/media")
  async save(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    requirePermission(user, "commerce.manage");
    const result = await this.media.saveGallery(id, body);
    await this.audit.recordEvent({
      actorId: user.sub,
      actorEmail: user.email,
      action: "admin.product.gallery.updated",
      resource: "products",
      resourceId: id,
      details: {
        assetIds: result.media?.map((m) => m.id),
        revision: result.mediaRevision,
      },
    });
    return result;
  }
}
