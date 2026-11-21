import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { BadRequestException } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { requirePermission } from "../admin/admin-permissions";
import { ProfessionalHubService } from "./professional-hub.service";
import { ProfessionalPricingService } from "./professional-pricing.service";

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

  @Post("pending-change")
  pending(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    requirePermission(user, "b2b.manage");
    const b = parse(
      z.object({ partnerId: id, action: z.enum(["approve", "reject"]) }).strict(),
      body,
    );
    return this.hub.resolvePendingChange(user, b.partnerId, b.action);
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

const local = z
  .object({
    en: z.string().trim().max(3000),
    fr: z.string().trim().max(3000).optional(),
    ar: z.string().trim().max(3000),
  })
  .strict();
const opt = (max: number) => z.union([z.literal(""), z.string().trim().max(max)]);

/** A professional managing their own public profile (IOMA PRO portal). */
@ApiTags("professional-business")
@UseGuards(JwtAuthGuard)
@Controller("professional/me/business")
export class ProfessionalBusinessController {
  constructor(private readonly hub: ProfessionalHubService) {}

  @Get()
  get(@CurrentUser() user: JwtPayload) {
    return this.hub.getMyBusiness(user.sub, user.roles);
  }

  @Patch()
  update(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const input = parse(
      z
        .object({
          description: local.optional(),
          openingHours: opt(300).nullable().optional(),
          phone: z.string().trim().min(5).max(40).optional(),
          whatsapp: opt(40).nullable().optional(),
          email: z
            .union([z.literal(""), z.string().trim().email()])
            .nullable()
            .optional(),
          website: opt(200).nullable().optional(),
          name: z.string().trim().min(1).max(120).optional(),
          address: z.string().trim().min(1).max(250).optional(),
          city: z.string().trim().min(1).max(80).optional(),
          emirate: z.string().trim().min(1).max(40).optional(),
          type: z
            .enum([
              "spa",
              "clinic",
              "beauty_institute",
              "hotel",
              "retail",
              "diagnostic_center",
              "distributor",
            ])
            .optional(),
          coordinates: z
            .object({
              lat: z.number().min(-90).max(90),
              lng: z.number().min(-180).max(180),
            })
            .optional(),
        })
        .strict(),
      body,
    );
    return this.hub.updateMyBusiness(user.sub, user.roles, input);
  }
}

/** Professional pricing management (prices, recommended retail, minimum quantities). */
@ApiTags("professional-pricing")
@UseGuards(JwtAuthGuard)
@Controller("admin/pro-pricing")
export class ProfessionalPricingController {
  constructor(private readonly pricing: ProfessionalPricingService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query() q: Record<string, string | undefined>) {
    requirePermission(user, "b2b.view");
    return this.pricing.list({
      q: q.q,
      visibility: q.visibility,
      page: q.page ? Number(q.page) : undefined,
      limit: q.limit ? Number(q.limit) : undefined,
    });
  }

  @Get("history")
  history(
    @CurrentUser() user: JwtPayload,
    @Query() q: Record<string, string | undefined>,
  ) {
    requirePermission(user, "b2b.view");
    return this.pricing.history({
      sku: q.sku,
      page: q.page ? Number(q.page) : undefined,
      limit: q.limit ? Number(q.limit) : undefined,
    });
  }

  @Patch()
  change(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    requirePermission(user, "b2b.manage");
    return this.pricing.change(user, body);
  }
}
