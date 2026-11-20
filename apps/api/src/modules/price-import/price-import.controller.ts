import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { requirePermission } from "../admin/admin-permissions";
import { PriceImportService } from "./price-import.service";
import type { PriceKind } from "./price-import.util";

const kindSchema = z.enum(["retail", "b2b", "cabin"]);

/** Owner price lists: preview, explicit approval, history. Retail prices need commerce rights, trade prices b2b rights. */
@ApiTags("price-import")
@UseGuards(JwtAuthGuard)
@Controller("admin/price-import")
export class PriceImportController {
  constructor(private readonly imports: PriceImportService) {}

  private need(user: JwtPayload, kind: PriceKind, write: boolean) {
    requirePermission(
      user,
      `${kind === "retail" ? "commerce" : "b2b"}.${write ? "manage" : "view"}`,
    );
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    requirePermission(user, "commerce.view");
    return this.imports.list();
  }

  @Get(":id")
  get(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    requirePermission(user, "commerce.view");
    return this.imports.get(id);
  }

  @Post("preview")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }),
  )
  preview(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Body("kind") kindRaw: string,
  ) {
    const kind = kindSchema.safeParse(kindRaw);
    if (!kind.success) throw new BadRequestException("Choose the price list type.");
    this.need(user, kind.data, true);
    if (!file) throw new BadRequestException("Choose a file to upload.");
    if (!/\.(xlsx|xls|csv)$/i.test(file.originalname))
      throw new BadRequestException("Upload an XLSX or CSV file.");
    return this.imports.preview(user, file, kind.data);
  }

  @Post(":id/apply")
  async apply(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const b = z
      .object({
        skus: z.array(z.string().min(1)).min(1).max(1000),
        sizes: z.array(z.string().min(1)).max(1000).optional(),
      })
      .strict()
      .safeParse(body);
    if (!b.success) throw new BadRequestException("Select the rows to apply.");
    const doc = await this.imports.get(id);
    this.need(user, doc.kind as PriceKind, true);
    return this.imports.apply(user, id, b.data.skus, b.data.sizes ?? []);
  }

  @Post(":id/revert")
  async revert(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    const doc = await this.imports.get(id);
    this.need(user, doc.kind as PriceKind, true);
    return this.imports.revert(user, id);
  }
}
