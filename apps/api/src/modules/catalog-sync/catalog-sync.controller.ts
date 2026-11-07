import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { requirePermission } from "../admin/admin-permissions";
import { CatalogSyncService, type ApplyChoice } from "./catalog-sync.service";

/**
 * Administrator-only catalogue synchronisation. Reads need `commerce.view`; anything that changes data needs
 * `commerce.manage`. Nothing here runs on a schedule.
 */
@Controller("catalog-sync")
@UseGuards(JwtAuthGuard)
export class CatalogSyncController {
  constructor(private readonly sync: CatalogSyncService) {}

  @Get("overview")
  overview(@CurrentUser() user: JwtPayload) {
    requirePermission(user, "commerce.view");
    return this.sync.overview();
  }

  @Get("stats")
  stats(@CurrentUser() user: JwtPayload) {
    requirePermission(user, "commerce.view");
    return this.sync.stats();
  }

  @Get("ranges")
  ranges(@CurrentUser() user: JwtPayload) {
    requirePermission(user, "commerce.view");
    return this.sync.listRanges();
  }

  @Get("runs")
  history(@CurrentUser() user: JwtPayload, @Query("limit") limit?: string) {
    requirePermission(user, "commerce.view");
    return this.sync.history(limit ? Number(limit) : 30);
  }

  @Get("runs/:id")
  run(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    requirePermission(user, "commerce.view");
    return this.sync.getRun(id);
  }

  @Get("runs/:id/report.csv")
  @Header("Content-Type", "text/csv; charset=utf-8")
  report(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    requirePermission(user, "commerce.view");
    return this.sync.reportCsv(id);
  }

  @Post("preview")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  preview(
    @CurrentUser() user: JwtPayload,
    @Body() body: { mode?: "file" | "live"; json?: unknown; full?: boolean },
  ) {
    requirePermission(user, "commerce.manage");
    return this.sync.preview(
      { mode: body.mode === "live" ? "live" : "file", json: body.json, full: body.full },
      { id: user.sub, email: user.email },
    );
  }

  @Post("runs/:id/apply")
  apply(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body()
    body: {
      items?: string[];
      choices?: Record<string, ApplyChoice>;
      autoPublish?: boolean;
    },
  ) {
    requirePermission(user, "commerce.manage");
    return this.sync.apply(id, body, { id: user.sub, email: user.email });
  }

  @Post("runs/:id/rollback")
  rollback(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    requirePermission(user, "commerce.manage");
    return this.sync.rollback(id, { id: user.sub, email: user.email });
  }
}
