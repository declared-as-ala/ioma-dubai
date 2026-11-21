import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Product, ProductSchema } from "../catalog/schemas/product.schema";
import {
  ProductVariant,
  ProductVariantSchema,
} from "../catalog/schemas/product-variant.schema";
import {
  ProductRange,
  ProductRangeSchema,
} from "../catalog/schemas/product-range.schema";
import { AuditModule } from "../audit/audit.module";
import { ImportRun, ImportRunSchema } from "./import-run.schema";
import { CatalogSyncService } from "./catalog-sync.service";
import { CatalogSyncController } from "./catalog-sync.controller";
import { CatalogIntegrityService } from "./catalog-integrity.service";
import { TranslationReviewService } from "./translation-review.service";
import { TranslationBulkService } from "./translation-bulk.service";

@Module({
  imports: [
    AuditModule,
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ProductVariant.name, schema: ProductVariantSchema },
      { name: ProductRange.name, schema: ProductRangeSchema },
      { name: ImportRun.name, schema: ImportRunSchema },
    ]),
  ],
  controllers: [CatalogSyncController],
  providers: [
    CatalogSyncService,
    CatalogIntegrityService,
    TranslationReviewService,
    TranslationBulkService,
  ],
})
export class CatalogSyncModule {}
