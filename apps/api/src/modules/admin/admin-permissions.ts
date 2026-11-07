import { ForbiddenException } from "@nestjs/common";
import { adminPermissions, type AdminPermission } from "@ioma/config";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";

export function requirePermission(user: JwtPayload, permission: AdminPermission) {
  if (!adminPermissions(user.roles).includes(permission))
    throw new ForbiddenException("Administrative permission required.");
}

export function requireAdmin(user: JwtPayload) {
  const permissions = adminPermissions(user.roles);
  if (!permissions.length)
    throw new ForbiddenException("Administrative access required.");
  return permissions;
}
