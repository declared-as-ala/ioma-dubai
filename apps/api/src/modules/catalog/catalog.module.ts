import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ProductRange, ProductRangeSchema } from "./schemas/product-range.schema";
import { Category, CategorySchema } from "./schemas/category.schema";
import { SkinConcern, SkinConcernSchema } from "./schemas/skin-concern.schema";
import { Product, ProductSchema } from "./schemas/product.schema";
import { ProductVariant, ProductVariantSchema } from "./schemas/product-variant.schema";
import { SkinType, SkinTypeSchema } from "./schemas/skin-type.schema";
import { ProductType, ProductTypeSchema } from "./schemas/product-type.schema";
import { NavigationMenu, NavigationMenuSchema } from "./schemas/navigation-menu.schema";
import { CatalogService } from "./catalog.service";
import { CatalogController } from "./catalog.controller";
import { NavigationService } from "./navigation.service";
import { NavigationController } from "./navigation.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductRange.name, schema: ProductRangeSchema },
      { name: Category.name, schema: CategorySchema },
      { name: SkinConcern.name, schema: SkinConcernSchema },
      { name: SkinType.name, schema: SkinTypeSchema },
      { name: ProductType.name, schema: ProductTypeSchema },
      { name: Product.name, schema: ProductSchema },
      { name: ProductVariant.name, schema: ProductVariantSchema },
      { name: NavigationMenu.name, schema: NavigationMenuSchema },
    ]),
  ],
  controllers: [CatalogController, NavigationController],
  providers: [CatalogService, NavigationService],
  exports: [MongooseModule, CatalogService, NavigationService],
})
export class CatalogModule {}
