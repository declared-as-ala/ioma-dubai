import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { BadRequestException } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { requirePermission } from "../admin/admin-permissions";
import { ProfessionalHubService } from "./professional-hub.service";

const parse = <T>(schema: z.ZodType<T>, body: unknown): T => {
  const r = schema.safeParse(body);
  if (!r.success) throw new BadRequestException("Invalid request.");
  return r.data;
};
const id = z.string().regex(/^[a-f\d]{24}$/i);

/** Unified Professional / Partner management. Admin only; reads need b2b.view, writes b2b.manage. */
@ApiTags("professional-hub")
@UseGuards(JwtAuthGuard)
@Controller("admin/hub")
export class ProfessionalHubController {
  constructor(private readonly hub: ProfessionalHubService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query() q: Record<string, string | undefined>) {
    requirePermission(user, "b2b.view");
    return this.hub.list({
      q: q.q,
      b2b: q.b2b,
      visibility: q.visibility,
      type: q.type,
      page: q.page ? Number(q.page) : undefined,
      limit: q.limit ? Number(q.limit) : undefined,
    });
  }

  @Get("unlinked-partners")
  unlinked(@CurrentUser() user: JwtPayload) {
    requirePermission(user, "b2b.view");
    return this.hub.unlinkedPartners();
  }

  @Get(":key")
  detail(@CurrentUser() user: JwtPayload, @Param("key") key: string) {
    requirePermission(user, "b2b.view");
    return this.hub.detail(key);
  }

  @Post("link")
  link(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    requirePermission(user, "b2b.manage");
    const b = parse(z.object({ profileId: id, partnerId: id }).strict(), body);
    return this.hub.link(user, b.profileId, b.partnerId);
  }

  @Post("unlink")
  unlink(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    requirePermission(user, "b2b.manage");
    const b = parse(z.object({ profileId: id }).strict(), body);
    return this.hub.unlink(user, b.profileId);
  }

  @Post("visibility")
  visibility(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    requirePermission(user, "b2b.manage");
    const b = parse(
      z.object({ partnerId: id, status: z.enum(["active", "inactive"]) }).strict(),
      body,
    );
    return this.hub.setVisibility(user, b.partnerId, b.status);
  }

  @Post("reactivate")
  reactivate(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    requirePermission(user, "b2b.manage");
    const b = parse(z.object({ profileId: id }).strict(), body);
    return this.hub.reactivate(user, b.profileId);
  }

  @Post("price-list")
  priceList(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    requirePermission(user, "b2b.manage");
    const b = parse(
      z.object({ profileId: id, priceListId: id.nullable() }).strict(),
      body,
    );
    return this.hub.assignPriceList(user, b.profileId, b.priceListId);
  }
}
