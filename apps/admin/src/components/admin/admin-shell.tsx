"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Menu,
  LogOut,
  ExternalLink,
  Search,
  X,
  Bell,
  ChevronDown,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  UserCheck,
  MapPin,
  GraduationCap,
  FileText,
  Settings,
  Film,
  type LucideIcon,
} from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useAdminAccess, useAdminQuery } from "@/hooks/use-admin";
import { ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { useLogout } from "@/hooks/use-auth";
import { ProductImage } from "@/components/shop/product-image";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AdminQueryState, AdminEmpty, useAdminFormat } from "./admin-ui";
import { PageLoader } from "@/components/ui/loading-screen";

interface NavLeaf {
  label: string;
  href: string;
  /** extra path prefixes that keep this entry highlighted */
  also?: string[];
}
interface NavGroup {
  title: string;
  icon: LucideIcon;
  href?: string;
  items?: NavLeaf[];
}

// Sidebar information architecture (single source of truth). Taxonomies
// (categories, ranges, concerns, skin/product types) live under one
// "Product Organization" workspace instead of separate first-level items.
const NAV: NavGroup[] = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  {
    title: "Catalogue",
    icon: Package,
    items: [
      { label: "Products", href: "/admin/products", also: ["/admin/products/new"] },
      {
        label: "Import center",
        href: "/admin/products/import",
        also: ["/admin/catalogue/imports"],
      },
      {
        label: "Product Organization",
        href: "/admin/catalogue/organization",
        also: [
          "/admin/categories",
          "/admin/ranges",
          "/admin/product-ranges",
          "/admin/concerns",
          "/admin/skin-concerns",
          "/admin/skin-types",
          "/admin/product-types",
        ],
      },
    ],
  },
  {
    title: "Orders",
    icon: ShoppingBag,
    items: [{ label: "Orders", href: "/admin/orders" }],
  },
  {
    title: "Customers",
    icon: Users,
    items: [{ label: "Customers", href: "/admin/customers" }],
  },
  {
    title: "Professional / B2B",
    icon: UserCheck,
    items: [
      { label: "Professionals", href: "/admin/professional-accounts" },
      { label: "B2B leads", href: "/admin/b2b-leads", also: ["/admin/professionals"] },
      { label: "B2B Orders", href: "/admin/orders?type=b2b" },
      { label: "Professional Pricing", href: "/admin/products?visibility=both" },
      { label: "Cabin Products", href: "/admin/products?visibility=b2b_cabin" },
      { label: "Training videos", href: "/admin/pro-videos" },
      { label: "Cabin gallery", href: "/admin/pro-gallery" },
      { label: "Pro benefits", href: "/admin/pro-benefits" },
      { label: "Pro documents", href: "/admin/pro-documents" },
      { label: "B2B settings", href: "/admin/b2b-settings" },
    ],
  },
  {
    title: "Partners & Spas",
    icon: MapPin,
    items: [
      { label: "Partners", href: "/admin/partners" },
      {
        label: "Services & Treatments",
        href: "/admin/services",
        also: ["/admin/treatments"],
      },
    ],
  },
  {
    title: "Training",
    icon: GraduationCap,
    items: [
      { label: "Trainings", href: "/admin/trainings" },
      {
        label: "Sessions & Bookings",
        href: "/admin/training-sessions",
        also: ["/admin/training-bookings"],
      },
      { label: "Protocols", href: "/admin/protocols" },
      { label: "Professional Documents", href: "/admin/documents" },
      { label: "Certificates", href: "/admin/certificates" },
    ],
  },
  {
    title: "Website",
    icon: Film,
    items: [
      { label: "Home hero", href: "/admin/hero" },
      { label: "Magazine", href: "/admin/magazine" },
      { label: "Content Pages", href: "/admin/content" },
    ],
  },
  {
    title: "System",
    icon: Settings,
    items: [
      { label: "Users & Roles", href: "/admin/admin-users", also: ["/admin/roles"] },
      { label: "Audit Logs", href: "/admin/audit" },
      { label: "Settings", href: "/admin/settings" },
    ],
  },
];

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("AdminExperience");
  const path = usePathname();
  const [search, setSearch] = useState("");
  useEffect(() => {
    setSearch(window.location.search);
  }, [path]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const leafActive = (leaf: NavLeaf) => {
    const [base, query] = leaf.href.split("?");
    if (query) return path === base && search.includes(query);
    if (base === "/admin/orders" && search.includes("type=b2b")) return false;
    if (base === "/admin/products" && search.includes("visibility=")) return false;
    return [base, ...(leaf.also ?? [])].some(
      (p) => path === p || path.startsWith(`${p}/`),
    );
  };

  const linkCls = (_active: boolean) => "pl-nav-item";

  return (
    <nav aria-label={t("navigation")} className="space-y-0.5 px-2 py-3">
      {NAV.map((group) => {
        const Icon = group.icon;
        if (group.href) {
          const active = path === group.href;
          return (
            <Link
              key={group.title}
              href={group.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={linkCls(active)}
            >
              <Icon className="size-4 shrink-0" />
              {group.title}
            </Link>
          );
        }
        const leaves = group.items ?? [];
        const single = leaves.length === 1;
        const anyActive = leaves.some(leafActive);
        if (single) {
          const leaf = leaves[0]!;
          return (
            <Link
              key={group.title}
              href={leaf.href}
              onClick={onNavigate}
              aria-current={anyActive ? "page" : undefined}
              className={linkCls(anyActive)}
            >
              <Icon className="size-4 shrink-0" />
              {group.title}
            </Link>
          );
        }
        const open =
          collapsed[group.title] === undefined ? true : !collapsed[group.title];
        return (
          <div key={group.title}>
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setCollapsed((c) => ({ ...c, [group.title]: open }))}
              className={`${linkCls(false)} ${anyActive ? "!text-white" : ""}`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1 text-start">{group.title}</span>
              <ChevronDown
                className={`!size-3.5 shrink-0 transition-transform ${open ? "" : "-rotate-90 rtl:rotate-90"}`}
              />
            </button>
            {open && (
              <ul className="pl-nav-sub space-y-px pb-1">
                {leaves.map((leaf) => {
                  const active = leafActive(leaf);
                  return (
                    <li key={leaf.label}>
                      <Link
                        href={leaf.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={linkCls(active)}
                      >
                        {leaf.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function AdminSearch() {
  const t = useTranslations("AdminExperience");
  const { label } = useAdminFormat();
  const [input, setInput] = useState("");
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const query = useAdminQuery<{ resource: string; items: Record<string, any>[] }[]>(
    `search?q=${encodeURIComponent(term)}`,
    !!term && open,
  );
  return (
    <>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim().length > 1) {
            setTerm(input.trim());
            setOpen(true);
          }
        }}
        className="flex h-8 w-full min-w-0 items-center gap-2 rounded-lg border border-neutral-600 bg-[#303030] px-2.5 focus-within:border-neutral-300"
      >
        <Search className="size-3.5 shrink-0 text-neutral-400" />
        <input
          ref={ref}
          aria-label={t("search")}
          placeholder="Search orders, products and customers"
          value={input}
          maxLength={100}
          onChange={(e) => setInput(e.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-neutral-400"
        />
        <kbd className="hidden shrink-0 rounded border border-neutral-600 px-1 text-[10px] text-neutral-400 md:block">
          Ctrl K
        </kbd>
      </form>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogTitle>{t("searchResults")}</DialogTitle>
          <DialogDescription>{term}</DialogDescription>
          <AdminQueryState query={query}>
            {query.data?.every((g) => !g.items.length) && <AdminEmpty />}
            {query.data?.map((group) => (
              <section key={group.resource}>
                {group.items.length > 0 && (
                  <h3 className="mt-4 text-xs font-semibold uppercase">
                    {t(`resources.${group.resource}`)}
                  </h3>
                )}
                {group.items.map((item) => (
                  <Link
                    key={item._id}
                    href={`/admin/${group.resource}/${item._id}`}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center gap-3 border-b py-3 text-sm text-blue-700"
                  >
                    {group.resource === "products" && (
                      <span className="relative block size-11 shrink-0">
                        <ProductImage
                          media={item.primaryImage}
                          src={item.images?.[0]}
                          alt={label(item.name)}
                          fill
                          variant="thumbnail"
                          sizes="44px"
                          className="object-contain"
                        />
                      </span>
                    )}
                    {label(
                      item.name ??
                        item.companyName ??
                        item.orderNumber ??
                        [item.firstName, item.lastName].filter(Boolean).join(" "),
                    )}
                  </Link>
                ))}
              </section>
            ))}
          </AdminQueryState>
        </DialogContent>
      </Dialog>
    </>
  );
}

function NotificationsMenu() {
  const { data } = useAdminQuery<Record<string, any>>("dashboard/overview");
  const count = (rows: any[] | undefined) => rows?.[0]?.count ?? 0;
  const inv = data?.inventory?.health?.[0];
  const entries = [
    {
      label: "Pending B2B applications",
      value: count(data?.b2b?.pending),
      href: "/admin/professionals",
    },
    {
      label: "Low or out of stock",
      value: (inv?.lowStock ?? 0) + (inv?.outOfStock ?? 0),
      href: "/admin/products?status=low_stock",
    },
  ].filter((e) => e.value > 0);
  const total = entries.reduce((n, e) => n + e.value, 0);
  return (
    <details className="relative">
      <summary
        aria-label="Notifications"
        className="relative grid size-8 cursor-pointer list-none place-items-center rounded-md hover:bg-[#303030] [&::-webkit-details-marker]:hidden"
      >
        <Bell className="size-4" />
        {total > 0 && (
          <span className="absolute -end-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-4">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </summary>
      <div className="absolute end-0 top-full z-50 mt-1 w-72 rounded-lg border border-neutral-200 bg-white p-2 text-neutral-900 shadow-lg">
        <p className="px-2 py-1.5 text-xs font-semibold">Notifications</p>
        {entries.length ? (
          entries.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="flex min-h-9 items-center justify-between rounded px-2 text-[13px] hover:bg-neutral-100"
            >
              <span>{e.label}</span>
              <span className="font-semibold">{e.value}</span>
            </Link>
          ))
        ) : (
          <p className="px-2 py-3 text-[13px] text-neutral-500">
            Nothing needs your attention.
          </p>
        )}
      </div>
    </details>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const access = useAdminAccess();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthHydrated();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("AdminExperience");
  const logout = useLogout();
  const [drawer, setDrawer] = useState(false);

  // A 401 from /admin/access sends the visitor to sign in.
  const unauthorized =
    access.error instanceof ApiError && access.error.statusCode === 401;
  useEffect(() => {
    if (hydrated && !user && unauthorized)
      router.replace(
        `/login?redirect=${encodeURIComponent(window.location.pathname.replace(/^\/(en|ar)/, "") || "/admin")}`,
      );
  }, [hydrated, user, unauthorized, router]);

  if (!hydrated || access.isLoading || (unauthorized && !user))
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f1f1f1] p-8">
        <PageLoader variant="admin" label={t("loading")} fullScreen={false} />
      </div>
    );
  if (access.isError || !access.data?.canAccess)
    return (
      <main className="mx-auto max-w-xl p-8 py-24">
        <h1 className="text-2xl font-semibold">{t("denied")}</h1>
        <p className="my-4 text-sm">{t("deniedDescription")}</p>
        <button
          type="button"
          className="pl-btn"
          onClick={() =>
            logout.mutate(undefined, { onSettled: () => router.replace("/login") })
          }
        >
          {t("logout")}
        </button>
      </main>
    );
  const data = access.data;
  const initials = data.user.email.slice(0, 2).toUpperCase();

  return (
    <div className="admin-shell min-h-screen bg-[#f1f1f1] text-[#303030]">
      <header className="sticky top-0 z-40 flex h-12 items-center gap-2 bg-[#1a1a1a] px-2 text-white md:px-3">
        <button
          type="button"
          aria-label={t("navigation")}
          onClick={() => setDrawer(true)}
          className="grid size-11 place-items-center rounded-md hover:bg-[#303030] xl:hidden"
        >
          <Menu className="size-5" />
        </button>
        <Link
          href="/admin"
          className="flex items-center gap-2 pe-2 text-sm font-semibold tracking-wide xl:w-[220px]"
        >
          <span className="text-base tracking-[0.18em]">IOMA</span>
          <span className="border-s border-neutral-600 ps-2 text-xs font-normal text-neutral-300">
            Admin
          </span>
        </Link>
        <div className="mx-auto hidden w-full max-w-xl min-w-0 flex-1 sm:block">
          <AdminSearch />
        </div>
        <div className="ms-auto flex items-center gap-1 sm:ms-0">
          <NotificationsMenu />
          <a
            href={process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000"}
            target="_blank"
            rel="noreferrer"
            className="flex h-8 items-center gap-1.5 rounded-md px-2 text-xs hover:bg-[#303030]"
          >
            <ExternalLink className="size-3.5" />
            <span className="hidden md:inline">{t("viewWebsite")}</span>
          </a>
          <details className="relative">
            <summary className="flex h-8 cursor-pointer list-none items-center gap-2 rounded-md px-1.5 text-xs hover:bg-[#303030] [&::-webkit-details-marker]:hidden">
              <span className="grid size-6 place-items-center rounded-full bg-violet-300 text-[10px] font-bold text-black">
                {initials}
              </span>
              <span className="hidden max-w-40 truncate md:inline">
                {data.user.email}
              </span>
            </summary>
            <div className="absolute end-0 top-full z-50 mt-1 w-60 rounded-lg border border-neutral-200 bg-white p-3 text-neutral-900 shadow-lg">
              <p className="break-all text-xs font-medium">{data.user.email}</p>
              <p className="my-2 text-xs text-neutral-500">
                {data.user.roles
                  .filter((r) => !["customer", "guest"].includes(r))
                  .map((r) => (t.has(`values.${r}`) ? t(`values.${r}`) : r))
                  .join(", ")}
              </p>
              {
                <button
                  disabled={logout.isPending}
                  className="flex min-h-9 w-full items-center gap-2 rounded px-1 text-sm hover:bg-neutral-100"
                  onClick={() =>
                    logout.mutate(undefined, {
                      onSettled: () => router.replace("/login"),
                    })
                  }
                >
                  <LogOut className="size-4" />
                  {t("logout")}
                </button>
              }
            </div>
          </details>
        </div>
      </header>
      <div className="sm:hidden bg-[#1a1a1a] px-2 pb-2">
        <AdminSearch />
      </div>
      <div className="grid min-w-0 xl:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="sticky top-12 hidden max-h-[calc(100vh-48px)] self-start overflow-y-auto bg-[#1a1a1a] xl:block">
          <Navigation />
        </aside>
        <main id="admin-main" className="min-w-0 p-3 md:p-5 xl:p-6">
          {children}
        </main>
      </div>
      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent
          side={locale === "ar" ? "right" : "left"}
          showCloseButton={false}
          className="admin-shell w-[min(300px,90vw)] gap-0 overflow-y-auto border-0 bg-[#1a1a1a] p-0 text-white"
        >
          <div className="flex items-center justify-between border-b border-neutral-700 px-4">
            <SheetTitle className="text-sm text-white">IOMA · Admin</SheetTitle>
            <SheetClose
              className="grid size-11 place-items-center"
              aria-label={t("close")}
            >
              <X className="size-5" />
            </SheetClose>
          </div>
          <SheetDescription className="sr-only">{t("navigation")}</SheetDescription>
          <Navigation onNavigate={() => setDrawer(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
