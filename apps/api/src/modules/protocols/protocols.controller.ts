import { RequireProfessional } from "../../common/guards/auth.decorators";
import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ProfessionalApprovedGuard } from "../../common/guards/professional-approved.guard";
import { ProtocolsService, type ProtocolResponse } from "./protocols.service";

@Controller("protocols")
@UseGuards(JwtAuthGuard, ProfessionalApprovedGuard)
@RequireProfessional()
@UseGuards(JwtAuthGuard, ProfessionalApprovedGuard)
export class ProtocolsController {
  constructor(private readonly protocolsService: ProtocolsService) {}

  @Get()
  async listProtocols(
    @Query("category") category?: string,
    @Query("rangeKey") rangeKey?: string,
  ): Promise<ProtocolResponse[]> {
    return this.protocolsService.listProtocols(category, rangeKey);
  }

  @Get(":slug")
  async getProtocolBySlug(@Param("slug") slug: string): Promise<ProtocolResponse> {
    return this.protocolsService.getProtocolBySlug(slug);
  }
}
