import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ForbiddenException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import {
  ADMIN_RESOURCES,
  ADMIN_ROLE_PERMISSIONS,
  adminPermissions,
  adminResource,
} from "@ioma/config";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { AdminDashboardService } from "./admin-dashboard.service";
import { AdminResourcesService } from "./admin-resources.service";
import { AdminActionsService } from "./admin-actions.service";
import { requireAdmin, requirePermission } from "./admin-permissions";

@Controller("admin")
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(
    private readonly dashboard: AdminDashboardService,
    private readonly resources: AdminResourcesService,
    private readonly actions: AdminActionsService,
    private readonly config: ConfigService,
  ) {}
  @Get("access")
  access(@CurrentUser() user: JwtPayload) {
    const permissions = adminPermissions(user.roles);
    return {
      user: { id: user.sub, email: user.email, roles: user.roles },
      canAccess: permissions.length > 0,
      permissions,
      resources: ADMIN_RESOURCES.filter((r) =>
        permissions.includes(`${r.domain}.view`),
      ).map(
        ({ collection: _collection, filter: _filter, search: _search, ...resource }) =>
          resource,
      ),
    };
  }
  @Get("dashboard/overview")
  overview(
    @CurrentUser() user: JwtPayload,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.dashboard.overview(user, from, to);
  }
  @Get("search")
  search(@CurrentUser() user: JwtPayload, @Query("q") q = "") {
    return this.resources.search(user, q);
  }
  @Get("roles")
  roles(@CurrentUser() user: JwtPayload) {
    requirePermission(user, "system.view");
    return ADMIN_ROLE_PERMISSIONS;
  }
  @Post("users/roles")
  changeRoles(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    return this.actions.roles(user, body);
  }
  @Get("settings")
  settings(@CurrentUser() user: JwtPayload) {
    requirePermission(user, "system.view");
    return {
      currency: "AED",
      timezone: "Asia/Dubai",
      paymentProvider: this.config.get("PAYMENT_PROVIDER") ?? "mock",
      aiProvider: this.config.get("AI_PROVIDER") ?? "mock",
      credentials: Object.fromEntries(
        [
          "AI_PROVIDER_API_KEY",
          "GEMINI_API_KEY",
          "ELEVENLABS_API_KEY",
          "HEYGEN_API_KEY",
          "DID_API_KEY",
          "TAVUS_API_KEY",
          "SMTP_HOST",
        ].map((key) => [key, !!(this.config.get(key) || process.env[key])]),
      ),
    };
  }
  @Get("references/:key")
  async references(
    @CurrentUser() user: JwtPayload,
    @Param("key") rawKey: string,
  ): Promise<Record<string, any>[]> {
    const aliasMap: Record<string, string> = {
      "product-ranges": "ranges",
      "skin-concerns": "concerns",
      "skin-types": "skin-types",
      "product-types": "product-types",
    };
    const key = aliasMap[rawKey] ?? rawKey;
    const permissions = requireAdmin(user);
    const resource = adminResource(key);
    const trainingReferences =
      permissions.includes("training.manage") &&
      ["products", "ranges", "admin-users"].includes(key);
    if (key === "ranges") {
      if (!permissions.includes("commerce.view") && !trainingReferences)
        throw new ForbiddenException();
      return this.resources.db
        .collection("productranges")
        .find({}, { projection: { _id: 1, name: 1, slug: 1 } })
        .toArray();
    }
    if (key === "skin-types") {
      if (!permissions.includes("commerce.view")) throw new ForbiddenException();
      return this.resources.db
        .collection("skintypes")
        .find({}, { projection: { _id: 1, name: 1, slug: 1 } })
        .sort({ sortOrder: 1, "name.fr": 1 })
        .toArray();
    }
    if (key === "product-types") {
      if (!permissions.includes("commerce.view")) throw new ForbiddenException();
      return this.resources.db
        .collection("producttypes")
        .find({}, { projection: { _id: 1, name: 1, slug: 1 } })
        .sort({ sortOrder: 1, "name.fr": 1 })
        .toArray();
    }
    if (
      !resource ||
      (!permissions.includes(`${resource.domain}.view`) && !trainingReferences)
    )
      throw new ForbiddenException();
    return this.resources.db
      .collection(resource.collection)
      .find(
        { ...resource.filter, ...(key === "products" ? { deletedAt: null } : {}) },
        {
          projection: {
            _id: 1,
            name: 1,
            title: 1,
            firstName: 1,
            lastName: 1,
            slug: 1,
            sku: 1,
            originalName: 1,
          },
        },
      )
      .limit(100)
      .toArray();
  }
  @Get("resources/:key")
  list(
    @CurrentUser() user: JwtPayload,
    @Param("key") key: string,
    @Query() query: Record<string, string>,
  ) {
    return this.resources.list(user, key, query);
  }
  @Get("resources/:key/:id")
  detail(
    @CurrentUser() user: JwtPayload,
    @Param("key") key: string,
    @Param("id") id: string,
  ) {
    return this.resources.detail(user, key, id);
  }
  @Post("resources/:key")
  create(
    @CurrentUser() user: JwtPayload,
    @Param("key") key: string,
    @Body() body: unknown,
  ) {
    return this.resources.save(user, key, body);
  }
  @Post("products/:id/duplicate")
  duplicateProduct(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.resources.duplicateProduct(user, id);
  }
  @Post("products/bulk-delete")
  deleteProducts(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    return this.resources.deleteProducts(user, body);
  }
  @Post("orders/bulk-delete")
  deleteOrders(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    return this.resources.deleteProducts(user, body, "orders");
  }
  @Delete("orders/:id")
  deleteOrder(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.resources.deleteProducts(user, { ids: [id] }, "orders");
  }
  @Patch("resources/:key/:id")
  update(
    @CurrentUser() user: JwtPayload,
    @Param("key") key: string,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.resources.save(user, key, body, id);
  }
  @Post("inventory/:id/adjust")
  stock(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() body: unknown) {
    return this.actions.stock(user, id, body);
  }
  @Post("orders")
  createOrder(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    return this.actions.createOrder(user, body);
  }
  @Patch("orders/:id")
  order(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() body: unknown) {
    return this.actions.order(user, id, body);
  }
  @Patch("appointments/:id")
  appointment(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.actions.appointment(user, id, body);
  }
  @Patch("training-bookings/:id")
  attendance(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.actions.attendance(user, id, body);
  }
  @Post("ai-analyses/:id/action")
  analysis(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.actions.analysis(user, id, body);
  }
  @Post("diagnoses/:id/action")
  diagnosesAction(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.actions.analysis(user, id, body);
  }
  @Post("documents/upload")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 10 * 1024 * 1024 } }))
  upload(
    @CurrentUser() user: JwtPayload,
    @Body() body: unknown,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.actions.upload(user, body, file);
  }
  @Get("documents/:id/url")
  document(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.actions.document(user, id);
  }
  @Get("diagnoses/metrics")
  diagnosesMetrics(@CurrentUser() user: JwtPayload) {
    return this.actions.diagnosesMetrics(user);
  }
  @Get("orders/metrics")
  orderMetrics(@CurrentUser() user: JwtPayload) {
    return this.actions.orderMetrics(user);
  }
  @Get("customers/metrics")
  customerMetrics(@CurrentUser() user: JwtPayload) {
    return this.actions.customerMetrics(user);
  }
  @Post("customers")
  createCustomer(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    return this.actions.createCustomer(user, body);
  }
  @Patch("customers/:id")
  updateCustomer(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.actions.updateCustomer(user, id, body);
  }
  @Patch("customers/:id/status")
  updateCustomerStatus(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.actions.updateCustomerStatus(user, id, body);
  }
  @Post("customers/:id/notes")
  addCustomerNote(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.actions.addCustomerNote(user, id, body);
  }
  @Post("customers/:id/reset-password")
  resetCustomerPassword(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.actions.resetCustomerPassword(user, id);
  }
  @Post("customers/:id/addresses")
  createCustomerAddress(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.actions.createCustomerAddress(user, id, body);
  }
  @Patch("customers/:id/addresses/:addressId")
  updateCustomerAddress(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Param("addressId") addressId: string,
    @Body() body: unknown,
  ) {
    return this.actions.updateCustomerAddress(user, id, addressId, body);
  }
  @Delete("customers/:id/addresses/:addressId")
  deleteCustomerAddress(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Param("addressId") addressId: string,
  ) {
    return this.actions.deleteCustomerAddress(user, id, addressId);
  }
  @Post("customers/:id/addresses/:addressId/default")
  setCustomerDefaultAddress(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Param("addressId") addressId: string,
  ) {
    return this.actions.setCustomerDefaultAddress(user, id, addressId);
  }
}
