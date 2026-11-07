import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PartnersService } from "./partners.service";
import { QueryPartnersDto } from "./dto/query-partners.dto";

@ApiTags("partners")
@Controller()
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get("partners")
  listPartners(@Query() query: QueryPartnersDto) {
    return this.partnersService.listPartners(query);
  }

  @Get("partners/:slug")
  getPartner(@Param("slug") slug: string) {
    return this.partnersService.getPartnerBySlug(slug);
  }

  @Get("services")
  listServices() {
    return this.partnersService.listServices();
  }

  @Get("services/:slug")
  getService(@Param("slug") slug: string) {
    return this.partnersService.getServiceBySlug(slug);
  }

  @Get("treatments")
  listTreatments() {
    return this.partnersService.listTreatments();
  }

  @Get("treatments/:slug")
  getTreatment(@Param("slug") slug: string) {
    return this.partnersService.getTreatmentBySlug(slug);
  }
}
