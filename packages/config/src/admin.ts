/** Shared vocabulary only. The API resolves these against current database roles. */
export const ADMIN_DOMAINS = [
  "commerce",
  "customers",
  "b2b",
  "partners",
  "training",
  "content",
  "ai",
  "audit",
  "system",
] as const;
export type AdminDomain = (typeof ADMIN_DOMAINS)[number];
export type AdminPermission = `${AdminDomain}.${"view" | "manage"}`;
export const ADMIN_ROLE_PERMISSIONS: Record<string, readonly AdminPermission[]> = {
  super_administrator: ADMIN_DOMAINS.flatMap(
    (d) => [`${d}.view`, `${d}.manage`] as AdminPermission[],
  ),
  administrator: ADMIN_DOMAINS.filter((d) => d !== "system")
    .flatMap((d) => [`${d}.view`, `${d}.manage`] as AdminPermission[])
    .concat("system.view"),
  order_manager: ["commerce.view", "commerce.manage", "customers.view"],
  customer_support: ["commerce.view", "customers.view", "partners.view"],
  partner_manager: ["partners.view", "partners.manage"],
  training_manager: ["training.view", "training.manage"],
  content_editor: ["content.view", "content.manage"],
};
export function adminPermissions(roles: readonly string[]): AdminPermission[] {
  return [...new Set(roles.flatMap((role) => ADMIN_ROLE_PERMISSIONS[role] ?? []))];
}
