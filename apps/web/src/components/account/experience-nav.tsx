"use client";

import { useState } from "react";
import {
  ChevronDown,
  LogOut,
  LayoutDashboard,
  ShoppingBag,
  Heart,
  CalendarDays,
  UserRound,
  MapPin,
  Bell,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  FileText,
  Building2,
  Headphones,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useApplications } from "@/hooks/use-professional";
import { useLogout } from "@/hooks/use-auth";
import { useProfileQuery } from "@/hooks/use-account";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

interface NavGroup {
  title: string;
  links: NavItem[];
}

export function ExperienceNav({ professional = false }: { professional?: boolean }) {
  const t = useTranslations("AccountExperience");
  const a = useTranslations("Account.nav");
  const apps = useApplications();
  const app = apps.data?.[0];
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();
  const profile = useProfileQuery();
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);

  const fullName =
    [profile.data?.firstName, profile.data?.lastName].filter(Boolean).join(" ") ||
    user?.email?.split("@")[0] ||
    "Client IOMA";
  const initials =
    [profile.data?.firstName?.[0], profile.data?.lastName?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || fullName.slice(0, 2).toUpperCase();

  const groups: NavGroup[] = professional
    ? [
        {
          title: t("professional"),
          links: [
            { href: "/portal", label: t("overview"), icon: LayoutDashboard },
            { href: "/portal/catalog", label: t("catalog"), icon: ShoppingBag },
            { href: "/portal/cart", label: t("proCart"), icon: ShoppingBag },
            { href: "/portal/orders", label: a("orders"), icon: FileText },
          ],
        },
        {
          title: t("services"),
          links: [
            { href: "/portal/trainings", label: t("training"), icon: GraduationCap },
            { href: "/portal/protocols", label: t("protocols"), icon: FileText },
          ],
        },
        {
          title: t("settings"),
          links: [
            { href: "/portal/company", label: t("company"), icon: Building2 },
            { href: "/portal/documents", label: t("documents"), icon: FileText },
            { href: "/portal/support", label: t("support"), icon: Headphones },
          ],
        },
      ]
    : [
        {
          title: t("personal"),
          links: [{ href: "/account", label: a("dashboard"), icon: LayoutDashboard }],
        },
        {
          title: t("shop"),
          links: [
            { href: "/account/orders", label: a("orders"), icon: ShoppingBag },
            { href: "/account/wishlist", label: a("wishlist"), icon: Heart },
          ],
        },
        {
          title: t("settings"),
          links: [
            { href: "/account/profile", label: a("profile"), icon: UserRound },
            { href: "/account/addresses", label: a("addresses"), icon: MapPin },
            { href: "/account/notifications", label: t("notifications"), icon: Bell },
            { href: "/account/security", label: a("security"), icon: ShieldCheck },
          ],
        },
        ...(app
          ? [
              {
                title: t("professional"),
                links: [
                  {
                    href: "/account/professional",
                    label: t("partnerStatus"),
                    icon: Briefcase,
                  },
                  ...(app.status === "approved"
                    ? [{ href: "/portal", label: t("enter"), icon: Building2 }]
                    : []),
                ],
              },
            ]
          : []),
      ];

  const current =
    groups.flatMap((g) => g.links).find((item) => item.href === pathname)?.label ??
    t("menu");

  return (
    <nav
      aria-label={t("menu")}
      className="lg:sticky lg:top-36 lg:max-h-[calc(100vh-10rem)] lg:self-start lg:overflow-y-auto lg:pe-4"
    >
      {/* Customer Monogram & Privilège Card */}
      <div className="mb-6 rounded-2xl border border-border/70 bg-gradient-to-b from-muted/30 to-background p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background font-display text-sm font-medium tracking-wider shadow-xs">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground/70">
                Club Privilège
              </span>
              <span className="inline-block size-1 rounded-full bg-sf-champagne" />
            </div>
            <p className="truncate text-sm font-medium text-foreground">{fullName}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      {(app?.status === "approved" || professional) && (
        <div className="mb-6 grid grid-cols-2 rounded-xl border border-border/80 p-1 text-xs bg-muted/40">
          <Link
            href="/account"
            className={cn(
              "flex min-h-9 items-center justify-center rounded-lg px-2 font-medium transition-all",
              !professional
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("personal")}
          </Link>
          <Link
            href="/portal"
            className={cn(
              "flex min-h-9 items-center justify-center rounded-lg px-2 font-medium transition-all",
              professional
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("professional")}
          </Link>
        </div>
      )}

      {/* Mobile Accordion Toggle */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls="account-sections"
        onClick={() => setOpen(!open)}
        className="flex min-h-12 w-full items-center justify-between rounded-xl border border-border/80 bg-background px-4 py-3 text-sm font-medium lg:hidden shadow-xs"
      >
        <span className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("menu")}:
          </span>
          <span className="text-foreground">{current}</span>
        </span>
        <ChevronDown
          className={cn("size-4 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      <div
        id="account-sections"
        className={cn("space-y-6 py-5 lg:block lg:py-0", !open && "hidden")}
      >
        {groups.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.links.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group flex min-h-10 items-center justify-between rounded-xl px-3 py-2 text-xs tracking-wide transition-all duration-150",
                        isActive
                          ? "bg-foreground text-background font-medium shadow-xs"
                          : "text-foreground/75 hover:bg-muted/60 hover:text-foreground",
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon
                          className={cn(
                            "size-3.5 shrink-0 transition-colors",
                            isActive
                              ? "text-background"
                              : "text-muted-foreground group-hover:text-foreground",
                          )}
                        />
                        <span>{label}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="border-t border-border/70 pt-4 space-y-1">
          <button
            type="button"
            disabled={logout.isPending}
            onClick={() =>
              logout.mutate(undefined, { onSettled: () => router.replace("/login") })
            }
            className="group flex min-h-10 w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="size-3.5 shrink-0 transition-transform group-hover:-translate-x-0.5" />
            <span>{logout.isPending ? a("loggingOut") : a("logout")}</span>
          </button>
          <Link
            href="/account/delete"
            className="flex min-h-9 items-center px-3 text-[11px] text-muted-foreground/60 transition-colors hover:text-destructive"
          >
            {a("deleteAccount")}
          </Link>
        </div>
      </div>
    </nav>
  );
}
