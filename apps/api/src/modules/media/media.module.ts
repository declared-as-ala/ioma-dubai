import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MediaAsset, MediaAssetSchema } from "./media-asset.schema";
import { Product, ProductSchema } from "../catalog/schemas/product.schema";
import { ProductMediaService } from "./product-media.service";
import { AuditModule } from "../audit/audit.module";
import {
  ProductMediaController,
  AdminProductMediaController,
} from "./product-media.controller";
import {
  AdminPartnerMediaController,
  PartnerMediaController,
} from "./partner-media.controller";

@Global()
@Module({
  imports: [
    AuditModule,
    MongooseModule.forFeature([
      { name: MediaAsset.name, schema: MediaAssetSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  providers: [ProductMediaService],
  controllers: [
    ProductMediaController,
    AdminProductMediaController,
    PartnerMediaController,
    AdminPartnerMediaController,
  ],
  exports: [ProductMediaService],
})
export class MediaModule {}
