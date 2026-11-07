import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CatalogService } from "./catalog.service";
import { QueryProductsDto } from "./dto/query-products.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RequireProfessional } from "../../common/guards/auth.decorators";
import { ProfessionalApprovedGuard } from "../../common/guards/professional-approved.guard";

@ApiTags("catalog")
@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("product-ranges")
  listRanges() {
    return this.catalogService.listRanges();
  }

  @Get("categories")
  listCategories() {
    return this.catalogService.listCategories();
  }

  @Get("skin-concerns")
  listConcerns() {
    return this.catalogService.listConcerns();
  }

  @Get("skin-types")
  listSkinTypes() {
    return this.catalogService.listSkinTypes();
  }

  @Get("product-types")
  listProductTypes() {
    return this.catalogService.listProductTypes();
  }

  @Get("products")
  listProducts(@Query() query: QueryProductsDto) {
    return this.catalogService.listProducts(query);
  }

  @Get("products/:slug")
  getProduct(@Param("slug") slug: string) {
    return this.catalogService.getProductBySlug(slug);
  }

  @Get("pro/catalog")
  @UseGuards(JwtAuthGuard, ProfessionalApprovedGuard)
  @RequireProfessional()
  listB2BProducts(@Query() query: QueryProductsDto) {
    return this.catalogService.listB2BProducts(query);
  }
}
