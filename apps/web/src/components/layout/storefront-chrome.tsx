"use client";

import { usePathname } from "@/i18n/navigation";

// The pro space (/portal) has its own header, menu and footer (see components/pro), so the
// storefront chrome (site header, footer, bottom tab bar, cart drawer) is not rendered there.
export function StorefrontChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return path === "/portal" || path.startsWith("/portal/") ? null : <>{children}</>;
}
