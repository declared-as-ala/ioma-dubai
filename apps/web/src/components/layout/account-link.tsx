"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Heart,
  LogOut,
  Package,
  User,
  UserRound,
  Briefcase,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

/**
 * Header account control. Signed out: a link to /login. Signed in: a dropdown with the
 * account shortcuts and sign out. Waits for the persisted session to hydrate first so a
 * logged-in visitor is never sent to the login page by a stale "no user" first render.
 */
export function AccountLink() {
  const t = useTranslations("Nav");
  const ar = useLocale() === "ar";
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!hydrated) {
    return (
      <Button variant="ghost" size="icon-sm" aria-label={t("account")} disabled>
        <User className="size-4" />
      </Button>
    );
  }

  if (!user) {
    return (
      <Button asChild variant="ghost" size="icon-sm" aria-label={t("account")}>
        <Link href="/login">
          <User className="size-4" />
        </Link>
      </Button>
    );
  }

  const isPro = user.roles.some((r) => r === "professional_approved");
  const items = [
    { href: "/account", label: ar ? "حسابي" : "My account", icon: UserRound },
    { href: "/account/orders", label: ar ? "طلباتي" : "Orders", icon: Package },
    { href: "/account/wishlist", label: ar ? "المفضلة" : "Wishlist", icon: Heart },
    ...(isPro
      ? [
          {
            href: "/portal",
            label: ar ? "المساحة المهنية" : "Pro space",
            icon: Briefcase,
          },
        ]
      : []),
  ];

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="sm"
        aria-label={t("account")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="gap-1 px-2"
      >
        <span className="grid size-6 place-items-center rounded-full bg-sf-champagne/20 text-[0.65rem] font-semibold uppercase text-foreground">
          {user.email.slice(0, 1)}
        </span>
        <ChevronDown
          className={`size-3 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute end-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-md border border-border bg-background text-foreground shadow-lg"
        >
          <p
            className="truncate border-b border-border px-4 py-3 text-xs text-muted-foreground"
            dir="ltr"
          >
            {user.email}
          </p>
          <div className="py-1">
            {items.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center gap-3 px-4 text-sm hover:bg-muted"
              >
                <Icon className="size-4 text-muted-foreground" aria-hidden />
                {label}
              </Link>
            ))}
          </div>
          <button
            type="button"
            role="menuitem"
            disabled={logout.isPending}
            onClick={() =>
              logout.mutate(undefined, {
                onSettled: () => {
                  setOpen(false);
                  router.replace("/");
                },
              })
            }
            className="flex min-h-11 w-full items-center gap-3 border-t border-border px-4 text-sm hover:bg-muted disabled:opacity-50"
          >
            <LogOut className="size-4 text-muted-foreground" aria-hidden />
            {logout.isPending
              ? ar
                ? "جارٍ الخروج…"
                : "Signing out…"
              : ar
                ? "تسجيل الخروج"
                : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
