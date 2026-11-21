"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  FileText,
  FlaskConical,
  Gift,
  ImageIcon,
  Building2,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Lock,
  LogOut,
  Menu,
  ShoppingBag,
  Video,
} from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
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
  {
    href: "/portal/business",
    label: {
      en: "Business profile",
      fr: "Profil de l'établissement",
      ar: "ملف المؤسسة",
    },
    icon: Building2,
  },
];

const SUB_PAGES: Record<string, L> = {
  cart: { en: "Your order", fr: "Votre commande", ar: "طلبك" },
  checkout: { en: "Checkout", fr: "Paiement", ar: "إتمام الطلب" },
  orders: { en: "Orders", fr: "Commandes", ar: "الطلبات" },
  catalog: { en: "Catalogue", fr: "Catalogue", ar: "الكتالوج" },
  support: { en: "Support", fr: "Assistance", ar: "الدعم" },
  company: { en: "Company", fr: "Établissement", ar: "المؤسسة" },
  protocols: { en: "Protocols", fr: "Protocoles", ar: "البروتوكولات" },
  trainings: { en: "Trainings", fr: "Formations", ar: "التدريب" },
};

function StatusChip({ customer, className }: { customer: boolean; className?: string }) {
  const { tx } = useTx();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium",
        customer
          ? "border-[#a7f0ba] bg-[#defbe6] text-[#198038]"
          : "border-[#f1c21b] bg-[#fcf4d6] text-[#8e6a00]",
        className,
      )}
    >
      <Check className="size-3.5" aria-hidden />
      {tx(customer ? SHELL.chipCustomer : SHELL.chipValidated)}
    </span>
  );
}

function ContactBox({ access }: { access: ProAccess }) {
  const { tx } = useTx();
  const isCustomer = access.level === "customer";
  const contact = isCustomer ? access.accountContact : access.teamContact;
  return (
    <div className="rounded-xl bg-sf-champagne/10 p-4 text-sm">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--pro-chip-ink)]/80">
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  // the drawer and the account menu close on navigation, Escape or an outside click
  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!accountOpen) return;
    const away = (e: MouseEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) setAccountOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAccountOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [accountOpen]);

  useEffect(() => {
    // Visitors (no session) belong on the registration page, which previews the pro space.
    if (hydrated && !user) router.replace("/professionals");
  }, [hydrated, user, router]);

  if (!hydrated || !user || access.isLoading) {
    return (
      <div
        className="grid min-h-screen place-items-center bg-[color:var(--pro-bg)]"
        role="status"
        aria-label={tx(SHELL.loading)}
      >
        <div className="space-y-3 text-center">
          <p className="font-display text-2xl tracking-wide">
            ioma <span className="text-xs tracking-[0.3em]">PARIS</span>
          </p>
          <div className="ioma-bar mx-auto text-[color:var(--pro-accent-ink)]" />
          <p className="text-xs text-muted-foreground">{tx(SHELL.loading)}</p>
        </div>
      </div>
    );
  }

  const data = access.data;
  if (access.isError || !data || data.level === "visitor") {
    return (
      <main className="grid min-h-screen place-items-center bg-[color:var(--pro-bg)] px-4">
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
  const activeItem = NAV.find((n) => n.href !== "/portal" && isActive(n));
  const subKey = pathname.split("/")[2];
  const subLabel =
    subKey && SUB_PAGES[subKey] && (!activeItem || !pathname.startsWith(activeItem.href))
      ? SUB_PAGES[subKey]
      : subKey && SUB_PAGES[subKey] && activeItem && pathname !== activeItem.href
        ? SUB_PAGES[subKey]
        : null;
  const crumbs: { label: L; href?: string }[] = [
    { label: SHELL.nav.overview, href: pathname === "/portal" ? undefined : "/portal" },
  ];
  if (activeItem)
    crumbs.push({
      label: activeItem.label,
      href: subLabel ? activeItem.href : undefined,
    });
  if (subLabel && !(activeItem && subLabel === activeItem.label))
    crumbs.push({ label: subLabel });
  const initial = (data.firstName?.[0] ?? data.companyName?.[0] ?? "P").toUpperCase();

  const navLinks = (onNavigate?: () => void, large = false) => (
    <nav aria-label={tx(SHELL.menu)} className="space-y-1">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          aria-current={isActive(item) ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-sm border-s-[3px] border-transparent px-3 transition-colors",
            large ? "min-h-12 text-[0.95rem]" : "min-h-11 text-sm",
            isActive(item)
              ? "border-[color:var(--pro-accent)] bg-sf-champagne/10 font-medium text-foreground"
              : "text-foreground/75 hover:bg-sf-champagne/10",
          )}
        >
          <item.icon
            className="size-[18px] text-[color:var(--pro-accent-ink)]"
            aria-hidden
          />
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
  );

  const signOut = () =>
    logout.mutate(undefined, { onSettled: () => router.replace("/professionals") });

  return (
    <div className="min-h-screen bg-[color:var(--pro-bg)] text-foreground">
      <a
        href="#pro-main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:shadow"
      >
        {tx({ en: "Skip to content", fr: "Aller au contenu", ar: "تخطَّ إلى المحتوى" })}
      </a>
      <header className="sticky top-0 z-30 border-b border-border bg-white">
        <div className="flex h-14 items-center gap-1 px-2 md:gap-3 md:px-6">
          <button
            type="button"
            className="grid size-11 shrink-0 place-items-center rounded-sm hover:bg-muted lg:hidden"
            aria-label={tx(SHELL.menu)}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <Link
            href="/portal"
            className="flex min-w-0 items-center gap-2"
            aria-label="IOMA Pro"
          >
            <span className="font-display text-2xl leading-none tracking-wide">ioma</span>
            <span className="hidden text-[0.6rem] tracking-[0.3em] text-muted-foreground md:inline">
              PARIS
            </span>
            <span className="ms-1 rounded border border-[color:var(--pro-accent)] px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-[0.2em] text-[color:var(--pro-chip-ink)]">
              {SHELL.badge}
            </span>
          </Link>
          <div className="ms-auto flex items-center gap-1 md:gap-3">
            <span className="hidden max-w-[220px] truncate text-xs text-muted-foreground xl:inline">
              {data.companyName}
            </span>
            <StatusChip customer={customer} className="hidden md:inline-flex" />
            <Link
              href="/portal/cart"
              className="relative grid min-h-11 min-w-11 place-items-center gap-2 rounded-sm px-2 hover:bg-muted md:inline-flex md:grid-flow-col md:px-3"
            >
              <ShoppingBag className="size-5" aria-hidden />
              <span className="sr-only md:not-sr-only md:text-xs">{tx(SHELL.order)}</span>
              {itemCount > 0 && (
                <span
                  className="absolute end-0.5 top-1 grid min-w-5 place-items-center rounded-full bg-[color:var(--pro-btn)] px-1 text-[0.65rem] font-semibold leading-5 text-white md:static md:ms-0"
                  aria-label={`${itemCount}`}
                >
                  {itemCount}
                </span>
              )}
            </Link>
            <div ref={accountRef} className="relative">
              <button
                type="button"
                className="flex min-h-11 items-center gap-1 rounded-sm px-1.5 hover:bg-muted"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                aria-label={data.companyName ?? tx(SHELL.signOut)}
                onClick={() => setAccountOpen((o) => !o)}
              >
                <span className="grid size-8 place-items-center rounded-full bg-[color:var(--pro-btn)] text-xs font-semibold text-white">
                  {initial}
                </span>
                <ChevronDown
                  className="hidden size-4 text-muted-foreground md:block"
                  aria-hidden
                />
              </button>
              {accountOpen && (
                <div
                  role="menu"
                  className="pro-menu-in absolute end-0 top-full z-40 mt-1 w-64 border border-border bg-white py-2 shadow-lg"
                >
                  <div className="px-4 pb-3">
                    <p className="truncate text-sm font-medium">{data.companyName}</p>
                    <StatusChip customer={customer} className="mt-2" />
                  </div>
                  <Link
                    role="menuitem"
                    href="/portal/business"
                    onClick={() => setAccountOpen(false)}
                    className="flex min-h-11 items-center gap-2 border-t border-border px-4 text-sm hover:bg-muted"
                  >
                    <Building2 className="size-4" aria-hidden />
                    {tx(NAV[NAV.length - 1]!.label)}
                  </Link>
                  <button
                    role="menuitem"
                    type="button"
                    disabled={logout.isPending}
                    onClick={signOut}
                    className="flex min-h-11 w-full items-center gap-2 border-t border-border px-4 text-start text-sm hover:bg-muted"
                  >
                    <LogOut className="size-4 rtl:-scale-x-100" aria-hidden />
                    {tx(SHELL.signOut)}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation drawer (phones and tablets) */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[86vw] max-w-sm gap-0 overflow-y-auto p-0">
          <SheetTitle className="sr-only">{tx(SHELL.menu)}</SheetTitle>
          <SheetDescription className="sr-only">{data.companyName}</SheetDescription>
          <div className="border-b border-border px-5 py-4">
            <p className="font-display text-2xl leading-none tracking-wide">
              ioma{" "}
              <span className="text-xs tracking-[0.3em] text-muted-foreground">
                PARIS
              </span>
            </p>
            <p className="mt-3 truncate text-sm font-medium">{data.companyName}</p>
            <StatusChip customer={customer} className="mt-2" />
          </div>
          <div className="p-3">{navLinks(() => setMenuOpen(false), true)}</div>
          <div className="mt-auto p-4">
            <ContactBox access={data} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden border-e border-border bg-white lg:block">
          <div className="sticky top-14 flex max-h-[calc(100vh-3.5rem)] flex-col justify-between gap-6 overflow-y-auto p-4">
            {navLinks()}
            <ContactBox access={data} />
          </div>
        </aside>

        <main id="pro-main" className="min-w-0 px-4 py-5 md:px-8 md:py-8">
          {crumbs.length > 1 && (
            <nav aria-label="Breadcrumb" className="mb-4">
              <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                {crumbs.map((c, i) => (
                  <li key={i} className="flex items-center gap-1">
                    {i > 0 && (
                      <ChevronRight className="size-3 rtl:rotate-180" aria-hidden />
                    )}
                    {c.href ? (
                      <Link
                        href={c.href}
                        className="hover:text-foreground hover:underline"
                      >
                        {tx(c.label)}
                      </Link>
                    ) : (
                      <span aria-current="page" className="text-foreground">
                        {tx(c.label)}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <div key={pathname} className="pro-page-in">
            {children}
          </div>
          <div className="mt-10 lg:hidden">
            <ContactBox access={data} />
          </div>
        </main>
      </div>
    </div>
  );
}
