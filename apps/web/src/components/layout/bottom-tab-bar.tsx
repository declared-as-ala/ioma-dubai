"use client";

import { Heart, House, Store, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "motion/react";
import { Link, usePathname } from "@/i18n/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { TRANSITIONS } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";
import { isBottomTabBarSuppressed } from "./bottom-tab-bar-suppression";

export function BottomTabBar() {
  const t = useTranslations("Nav");
  const wishlistT = useTranslations("Account.nav");
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const isLoggedIn = useAuthStore((s) => Boolean(s.user));

  // Suppressed on /checkout — the step navigation and submit button already
  // own the bottom of the screen there; a persistent tab bar would compete
  // with them for the same touch real estate. See DECISIONS.md.
  if (isBottomTabBarSuppressed(pathname)) {
    return null;
  }

  const tabs: {
    href: string;
    label: string;
    icon: typeof House;
    active: boolean;
  }[] = [
    {
      href: "/",
      label: t("homeShort"),
      icon: House,
      active: pathname === "/",
    },
    {
      href: "/shop",
      label: t("shop"),
      icon: Store,
      active: pathname.startsWith("/shop"),
    },
    {
      href: "/wishlist",
      label: wishlistT("wishlist"),
      icon: Heart,
      active: pathname.startsWith("/wishlist"),
    },
    {
      href: isLoggedIn ? "/account" : "/login",
      label: t("account"),
      icon: User,
      active: pathname.startsWith("/account") || pathname === "/login",
    },
  ] as const;

  return (
    // `xl:hidden` deliberately matches header.tsx's own hamburger-trigger
    // (`xl:hidden`) and primary-nav (`xl:flex`) breakpoint, not `lg` — the
    // header already defines where mobile nav hands off to desktop nav;
    // using a different breakpoint here would leave a real gap (1024–1280px)
    // with no primary navigation visible at all. Found live: this bar
    // originally used `lg:hidden` and collided with an already-existing
    // homepage-only mobile tab bar at the same fixed position — see
    // DECISIONS.md.
    <nav
      aria-label={t("bottomNavigation")}
      data-testid="bottom-tab-bar"
      className="fixed inset-x-0 bottom-0 z-sticky-header border-t border-border bg-background/95 backdrop-blur-md xl:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-[640px] items-stretch justify-between">
        {tabs.map(({ href, label, icon: Icon, active }) => (
          <li key={href} className="flex-1">
            <motion.div
              whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
              transition={TRANSITIONS.instant}
            >
              <Link
                href={href}
                prefetch={href === "/login" ? false : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[0.65rem] uppercase tracking-wide transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className="size-5"
                  aria-hidden
                  fill={active ? "currentColor" : "none"}
                  strokeWidth={active ? 1 : 1.5}
                />
                {label}
              </Link>
            </motion.div>
          </li>
        ))}
      </ul>
    </nav>
  );
}
