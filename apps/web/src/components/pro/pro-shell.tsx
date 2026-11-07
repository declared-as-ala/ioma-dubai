"use client";

import { useEffect } from "react";
import {
  Check,
  FileText,
  FlaskConical,
  Gift,
  ImageIcon,
  LayoutGrid,
  Lock,
  LogOut,
  ShoppingBag,
  Video,
} from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { useLogout } from "@/hooks/use-auth";
import { useCartQuery } from "@/hooks/use-cart";
import { useProAccess, type ProAccess } from "@/hooks/use-pro-access";
import { SHELL, type L } from "@/content/pro-space";
import { cn } from "@/lib/utils";
import { primaryBtn, useTx } from "./pro-ui";

interface NavItem {
  href: string;
  label: L;
  icon: typeof LayoutGrid;
  /** Locked (padlock in the menu) until the account has placed its first order. */
  lockedUntilOrder?: boolean;
  match?: string[];
}

const NAV: NavItem[] = [
  { href: "/portal", label: SHELL.nav.overview, icon: LayoutGrid },
  {
    href: "/portal/shop",
    label: SHELL.nav.shop,
    icon: ShoppingBag,
    match: ["/portal/catalog", "/portal/cart", "/portal/checkout"],
  },
  {
    href: "/portal/cabin",
    label: SHELL.nav.cabin,
    icon: FlaskConical,
    match: ["/portal/protocols"],
  },
  {
    href: "/portal/videos",
    label: SHELL.nav.videos,
    icon: Video,
    lockedUntilOrder: true,
    match: ["/portal/trainings"],
  },
  {
    href: "/portal/gallery",
    label: SHELL.nav.gallery,
    icon: ImageIcon,
    lockedUntilOrder: true,
  },
  {
    href: "/portal/benefits",
    label: SHELL.nav.benefits,
    icon: Gift,
    lockedUntilOrder: true,
  },
  { href: "/portal/documents", label: SHELL.nav.documents, icon: FileText },
];

function ContactBox({ access }: { access: ProAccess }) {
  const { tx } = useTx();
  const isCustomer = access.level === "customer";
  const contact = isCustomer ? access.accountContact : access.teamContact;
  return (
    <div className="rounded-xl bg-sf-champagne/10 p-4 text-sm">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#4a3f8f]/80">
        {isCustomer ? tx(SHELL.yourContact) : tx(SHELL.help)}
      </p>
      {contact ? (
        <div className="mt-2 space-y-1">
          <p className="font-medium">{contact.name || tx(SHELL.helpTeam)}</p>
          {contact.phone && (
            <p>
              <a
                className="hover:underline"
                href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                dir="ltr"
              >
                {contact.phone}
              </a>
            </p>
          )}
          {contact.email && (
            <p className="break-all">
              <a className="hover:underline" href={`mailto:${contact.email}`}>
                {contact.email}
              </a>
            </p>
          )}
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">{tx(SHELL.contactSoon)}</p>
      )}
    </div>
  );
}

export function ProShell({ children }: { children: React.ReactNode }) {
  const { tx } = useTx();
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthHydrated();
  const access = useProAccess();
  const cart = useCartQuery(true);
  const logout = useLogout();

  useEffect(() => {
    // Visitors (no session) belong on the registration page, which previews the pro space.
    if (hydrated && !user) router.replace("/professionals");
  }, [hydrated, user, router]);

  if (!hydrated || !user || access.isLoading) {
    return (
      <div
        className="grid min-h-screen place-items-center bg-[#f8f7fd]"
        role="status"
        aria-label={tx(SHELL.loading)}
      >
        <div className="space-y-3 text-center">
          <p className="font-display text-2xl tracking-wide">
            ioma <span className="text-xs tracking-[0.3em]">PARIS</span>
          </p>
          <div className="ioma-bar mx-auto text-[#5b4fd6]" />
          <p className="text-xs text-muted-foreground">{tx(SHELL.loading)}</p>
        </div>
      </div>
    );
  }

  const data = access.data;
  if (access.isError || !data || data.level === "visitor") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f8f7fd] px-4">
        <div className="max-w-md text-center">
          <p className="font-display text-2xl tracking-wide">
            ioma <span className="text-xs tracking-[0.3em]">PARIS</span>
          </p>
          <h1 className="mt-8 font-display text-3xl">{tx(SHELL.review.title)}</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {tx(SHELL.review.body)}
          </p>
          <Link href="/professionals" className={cn(primaryBtn, "mt-8")}>
            {tx(SHELL.review.cta)}
          </Link>
        </div>
      </main>
    );
  }

  const customer = data.level === "customer";
  const itemCount = cart.data?.items.reduce((n, i) => n + i.qty, 0) ?? 0;
  const isActive = (item: NavItem) =>
    item.href === "/portal"
      ? pathname === "/portal"
      : [item.href, ...(item.match ?? [])].some(
          (p) => pathname === p || pathname.startsWith(`${p}/`),
        );

  return (
    <div className="min-h-screen bg-[#f8f7fd] text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-white">
        <div className="flex h-14 items-center gap-3 px-4 md:px-6">
          <Link href="/portal" className="flex items-center gap-2" aria-label="IOMA Pro">
            <span className="font-display text-2xl leading-none tracking-wide">ioma</span>
            <span className="text-[0.6rem] tracking-[0.3em] text-muted-foreground">
              PARIS
            </span>
            <span className="ms-1 rounded bg-[#5b4fd6] px-1.5 py-0.5 text-[0.6rem] font-bold tracking-wider text-white">
              {SHELL.badge}
            </span>
          </Link>
          <div className="ms-auto flex min-w-0 items-center gap-3 text-xs sm:gap-5">
            <span className="hidden max-w-[220px] truncate text-muted-foreground md:inline">
              {data.companyName}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 font-medium",
                customer
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-800",
              )}
            >
              <Check className="size-3.5" aria-hidden />
              {tx(customer ? SHELL.chipCustomer : SHELL.chipValidated)}
            </span>
            <Link
              href="/portal/cart"
              className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap hover:underline"
            >
              <ShoppingBag className="size-4" aria-hidden />
              {tx(SHELL.order)} · {itemCount}
            </Link>
            <button
              type="button"
              disabled={logout.isPending}
              onClick={() =>
                logout.mutate(undefined, {
                  onSettled: () => router.replace("/professionals"),
                })
              }
              className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-4 rtl:-scale-x-100" aria-hidden />
              <span className="hidden sm:inline">{tx(SHELL.signOut)}</span>
              <span className="sr-only sm:hidden">{tx(SHELL.signOut)}</span>
            </button>
          </div>
        </div>

        {/* Menu on small screens: one scrollable row */}
        <nav
          aria-label={tx(SHELL.menu)}
          className="flex gap-1 overflow-x-auto border-t border-border px-3 py-1.5 lg:hidden"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item) ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-medium",
                isActive(item)
                  ? "bg-sf-champagne/20 text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <item.icon className="size-4" aria-hidden />
              {tx(item.label)}
              {item.lockedUntilOrder && !customer && (
                <Lock className="size-3" aria-label={tx(SHELL.locked)} />
              )}
            </Link>
          ))}
        </nav>
      </header>

      <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden border-e border-border bg-white lg:block">
          <div className="sticky top-14 flex max-h-[calc(100vh-3.5rem)] flex-col justify-between gap-6 overflow-y-auto p-4">
            <nav aria-label={tx(SHELL.menu)} className="space-y-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item) ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
                    isActive(item)
                      ? "bg-sf-champagne/20 font-medium text-foreground"
                      : "text-foreground/75 hover:bg-sf-champagne/10",
                  )}
                >
                  <item.icon className="size-[18px] text-[#5b4fd6]" aria-hidden />
                  <span className="flex-1">{tx(item.label)}</span>
                  {item.lockedUntilOrder && !customer && (
                    <Lock
                      className="size-3.5 text-muted-foreground"
                      aria-label={tx(SHELL.locked)}
                    />
                  )}
                </Link>
              ))}
            </nav>
            <ContactBox access={data} />
          </div>
        </aside>

        <main id="pro-main" className="min-w-0 px-4 py-6 md:px-8 md:py-8">
          {children}
          <div className="mt-10 lg:hidden">
            <ContactBox access={data} />
          </div>
        </main>
      </div>
    </div>
  );
}
