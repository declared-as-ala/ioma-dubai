import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";
import { requirePermission } from "../admin/admin-permissions";
import { PortalContentService } from "./portal-content.service";
import { ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { ProContentService } from "./pro-content.service";

@ApiTags("pro-content")
@UseGuards(JwtAuthGuard)
@Controller("pro")
export class ProContentController {
  constructor(
    private readonly content: ProContentService,
    private readonly portal: PortalContentService,
  ) {}

  @Get("home")
  home(@CurrentUser() user: JwtPayload) {
    return this.portal.home(user.sub, user.roles);
  }

  @Put("videos/:id/progress")
  progress(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const r = z
      .object({
        positionSeconds: z.number().min(0).max(86400),
        completed: z.boolean().optional(),
      })
      .strict()
      .safeParse(body);
    if (!r.success) throw new BadRequestException("Invalid progress.");
    return this.content.saveProgress(user.sub, user.roles, id, r.data);
  }

  @Get("videos")
  videos(@CurrentUser() user: JwtPayload) {
    return this.content.videos(user.sub, user.roles);
  }

  @Get("gallery")
  gallery(@CurrentUser() user: JwtPayload) {
    return this.content.gallery(user.sub, user.roles);
  }

  @Get("benefits")
  benefits(@CurrentUser() user: JwtPayload) {
    return this.content.benefits(user.sub, user.roles);
  }

  @Get("documents")
  documents(@CurrentUser() user: JwtPayload) {
    return this.content.documentsList(user.sub, user.roles);
  }

  @Get("documents/:id/url")
  documentUrl(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.content.documentUrl(user.sub, user.roles, id);
  }
}

/** Admin side of the portal home content (hero, announcements, sections, featured items, contact). */
@ApiTags("pro-content")
@UseGuards(JwtAuthGuard)
@Controller("admin/portal-content")
export class AdminPortalContentController {
  constructor(private readonly portal: PortalContentService) {}

  @Get()
  get(@CurrentUser() user: JwtPayload) {
    requirePermission(user, "b2b.view");
    return this.portal.getAdmin();
  }

  @Patch()
  update(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    requirePermission(user, "b2b.manage");
    return this.portal.update(user, body);
  }
}
