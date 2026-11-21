import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../../auth/strategies/jwt.strategy";
import { requirePermission } from "../../admin/admin-permissions";
import { MailOutboxService } from "../../../common/mail/mail-outbox.service";
import { OrderNotificationsService } from "./order-notifications.service";

/** Back-office view of every email the platform queued: what was sent, what failed and why, and retry. */
@Controller("admin/notifications")
@UseGuards(JwtAuthGuard)
export class OrderNotificationsController {
  constructor(
    private readonly outbox: MailOutboxService,
    private readonly notifications: OrderNotificationsService,
  ) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query("status") status?: string,
    @Query("q") q?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    requirePermission(user, "commerce.view");
    const p = Math.max(1, parseInt(page ?? "1", 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit ?? "25", 10) || 25));
    return this.outbox.list({ status, q: q?.trim().slice(0, 80), page: p, limit: l });
  }

  @Get("summary")
  async summary(@CurrentUser() user: JwtPayload) {
    requirePermission(user, "commerce.view");
    const [counts, config] = await Promise.all([
      this.outbox.counts(),
      this.notifications.diagnostics(),
    ]);
    return { counts, config };
  }

  @Get(":id/preview")
  async preview(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    requirePermission(user, "commerce.view");
    const row = await this.outbox.preview(id).catch(() => null);
    if (!row) throw new NotFoundException("Notification not found.");
    return row;
  }

  @Post(":id/retry")
  async retry(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    requirePermission(user, "commerce.manage");
    const ok = await this.outbox.retry(id).catch(() => false);
    if (!ok) throw new NotFoundException("Notification not found or already sent.");
    return { retried: true };
  }
}
