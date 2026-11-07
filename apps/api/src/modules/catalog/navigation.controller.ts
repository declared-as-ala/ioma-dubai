import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";
import { NavigationService } from "./navigation.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { requireAdmin, requirePermission } from "../admin/admin-permissions";

@Controller()
export class NavigationController {
  constructor(private readonly navService: NavigationService) {}

  /**
   * Public Navigation endpoint (unauthenticated, cached)
   */
  @Get("navigation/public")
  getPublicNavigation(@Query("locale") locale?: string) {
    const validLocale = ["en", "fr", "ar"].includes(locale || "")
      ? (locale as "en" | "fr" | "ar")
      : "en";
    return this.navService.getPublicNavigation(validLocale);
  }

  /**
   * Admin Navigation configuration (draft, published, health)
   */
  @Get("admin/navigation")
  @UseGuards(JwtAuthGuard)
  getAdminNavigation(@CurrentUser() user: JwtPayload) {
    requireAdmin(user);
    return this.navService.getAdminNavigation();
  }

  /**
   * Admin Save Draft Navigation
   */
  @Put("admin/navigation/draft")
  @UseGuards(JwtAuthGuard)
  saveDraft(@CurrentUser() user: JwtPayload, @Body() body: { items: any[] }) {
    requirePermission(user, "content.manage");
    return this.navService.saveDraft(user, body.items);
  }

  /**
   * Admin Publish Navigation to Live Website
   */
  @Post("admin/navigation/publish")
  @UseGuards(JwtAuthGuard)
  publishNavigation(@CurrentUser() user: JwtPayload) {
    requirePermission(user, "content.manage");
    return this.navService.publishNavigation(user);
  }

  /**
   * Admin Live Navigation Health
   */
  @Get("admin/navigation/health")
  @UseGuards(JwtAuthGuard)
  async getNavigationHealth(@CurrentUser() user: JwtPayload) {
    requireAdmin(user);
    const nav = await this.navService.getAdminNavigation();
    return nav.health;
  }

  /**
   * Admin Category Hierarchy Tree
   */
  @Get("admin/categories/tree")
  @UseGuards(JwtAuthGuard)
  getCategoryTree(@CurrentUser() user: JwtPayload) {
    requireAdmin(user);
    return this.navService.getCategoryTree();
  }

  /**
   * Admin Validate Category Parent (Circular Ancestry Guard)
   */
  @Post("admin/categories/validate-parent")
  @UseGuards(JwtAuthGuard)
  validateCategoryParent(
    @CurrentUser() user: JwtPayload,
    @Body() body: { categoryId?: string | null; parentId?: string | null },
  ) {
    requireAdmin(user);
    return this.navService.validateCategoryParent(
      body.categoryId || null,
      body.parentId || null,
    );
  }
}
