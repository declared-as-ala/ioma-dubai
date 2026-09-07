"use client";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { Menu, LogOut, ExternalLink, Search, Plus, X } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useAdminAccess, useAdminQuery, type AdminAccess } from "@/hooks/use-admin";
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

function Navigation({
  access,
  onNavigate,
}: {
  access: AdminAccess;
  onNavigate?: () => void;
}) {
  const t = useTranslations("AdminExperience");
  const path = usePathname();
  const [pending, setPending] = useState<string | null>(null);
  useEffect(() => setPending(null), [path]);
  const entries = [
    { href: "/admin", label: t("dashboard"), group: "overview" },
    ...access.resources
      .filter((r) => !["inventory", "stock-movements"].includes(r.key))
      .map((r) => ({
        href: `/admin/${r.key}`,
        label: t.has(`resources.${r.key}`) ? t(`resources.${r.key}`) : r.title,
        group: r.group,
      })),
    ...(access.permissions.includes("content.manage") || access.permissions.includes("content.view")
      ? [{ href: "/admin/navigation", label: "Header & Mega Menu", group: "content" }]
      : []),
    ...(access.permissions.includes("b2b.view")
      ? [{ href: "/admin/professionals", label: t("applications"), group: "b2b" }]
      : []),
    ...(access.permissions.includes("commerce.view")
      ? [
          { href: "/admin/orders?type=b2b", label: t("b2bOrders"), group: "b2b" },
          { href: "/admin/products?tab=inventory", label: t("professionalPricing"), group: "b2b" },
          {
            href: "/admin/products?visibility=b2b_cabin",
            label: t("cabinProducts"),
            group: "b2b",
          },
        ]
      : []),
    ...(access.permissions.includes("content.view")
      ? ["homepage", "journal", "faq", "footer"].map((kind) => ({
          href: `/admin/content?kind=${kind}`,
          label: t(`values.${kind}`),
          group: "content",
        }))
      : []),

    ...(access.permissions.includes("system.view")
      ? [
          { href: "/admin/roles", label: t("rolesPermissions"), group: "system" },
          { href: "/admin/settings", label: t("settings"), group: "system" },
        ]
      : []),
  ];
  return (
    <nav aria-label={t("navigation")} className="space-y-3 py-3">
      {[
        "overview",
        "commerce",
        "customers",
        "b2b",
        "partners",
        "training",
        "content",
        "system",
      ].map((group) => {
        const links = entries.filter((e) => e.group === group);
        return !links.length ? null : (
          <details key={group} open className="border-b border-neutral-700 pb-2">
            <summary className="flex min-h-11 cursor-pointer items-center px-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              {t(`groups.${group}`)}
            </summary>
            {links.map((entry, i) => (
              <Link
                key={`${entry.href}-${i}`}
                href={entry.href}
                onClick={() => { setPending(entry.href); onNavigate?.(); }}
                aria-current={!entry.href.includes("?") && (path === entry.href || entry.href !== "/admin" && path.startsWith(`${entry.href}/`)) ? "page" : undefined}
                className={`flex min-h-11 items-center border-s-4 px-4 py-2 text-sm transition-colors active:bg-neutral-600 hover:bg-neutral-700 ${pending === entry.href || path === entry.href || entry.href !== "/admin" && !entry.href.includes("?") && path.startsWith(`${entry.href}/`) ? "border-blue-400 bg-neutral-700 text-white" : "border-transparent text-neutral-200"}`}
              >
                {entry.label}
              </Link>
            ))}
          </details>
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
        className="flex min-w-0 flex-1 items-center border border-neutral-600 bg-neutral-800"
      >
        <input
          aria-label={t("search")}
          placeholder={t("search")}
          value={input}
          maxLength={100}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-11 min-w-0 flex-1 bg-transparent px-3 text-sm"
        />
        <button
          type="submit"
          className="grid size-11 shrink-0 place-items-center"
          aria-label={t("search")}
        >
          <Search className="size-4" />
        </button>
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
                    {group.resource === "products" && <span className="relative block size-11 shrink-0"><ProductImage media={item.primaryImage} src={item.images?.[0]} alt={label(item.name)} fill variant="thumbnail" sizes="44px" className="object-contain" /></span>}
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
export function AdminShell({ children }: { children: React.ReactNode }) {
  const access = useAdminAccess();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthHydrated();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("AdminExperience");
  const logout = useLogout();
  const [drawer, setDrawer] = useState(false);
  const pathname = usePathname();
  const reduced = useReducedMotion();
  useEffect(() => {
    if (hydrated && !user) router.replace("/login?redirect=/admin");
  }, [hydrated, user, router]);

  if (!hydrated || !user || access.isLoading)
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-8">
        <PageLoader variant="admin" label={t("loading")} fullScreen={false} />
      </div>
    );
  if (access.isError || !access.data?.canAccess)
    return (
      <main className="mx-auto max-w-xl p-8 py-24">
        <h1 className="text-2xl font-semibold">{t("denied")}</h1>
        <p className="my-4 text-sm">{t("deniedDescription")}</p>
        <Link href="/" className="inline-flex min-h-11 items-center text-blue-700">
          {t("viewWebsite")}
        </Link>
      </main>
    );
  const data = access.data;
  const create = data.resources.filter(
    (r) => r.create && data.permissions.includes(`${r.domain}.manage`),
  );
  return (
    <div className="admin-shell min-h-screen bg-neutral-100 text-neutral-900">
      <header className="sticky top-0 z-40 border-b border-neutral-700 bg-neutral-900 text-white">
        <div className="flex min-h-14 flex-wrap items-center gap-2 px-3 md:px-5">
          <button
            type="button"
            aria-label={t("navigation")}
            onClick={() => setDrawer(true)}
            className="grid size-11 place-items-center xl:hidden"
          >
            <Menu className="size-5" />
          </button>
          <Link
            href="/admin"
            className="me-auto flex min-h-11 items-center gap-2 text-sm font-semibold tracking-wide"
          >
            <span className="border-e border-neutral-600 pe-3 text-lg">IOMA</span>{" "}
            {t("admin")}
          </Link>
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 px-2 text-xs">
            <ExternalLink className="size-4" />
            <span className="hidden md:inline">{t("viewWebsite")}</span>
            <span className="sr-only md:hidden">{t("viewWebsite")}</span>
          </Link>
          <details className="relative">
            <summary className="flex min-h-11 cursor-pointer items-center gap-2 px-2 text-xs">
              <span className="hidden md:inline">{data.user.email}</span>
              <span>{t("account")}</span>
            </summary>
            <div className="absolute end-0 top-full w-60 border border-neutral-600 bg-neutral-900 p-4">
              <p className="break-all text-xs">{data.user.email}</p>
              <p className="my-3 text-xs text-neutral-300">
                {data.user.roles
                  .filter((r) => !["customer", "guest"].includes(r))
                  .map((r) => (t.has(`values.${r}`) ? t(`values.${r}`) : r))
                  .join(", ")}
              </p>
              <Link href="/account" className="flex min-h-11 items-center text-sm">
                {t("account")}
              </Link>
              <button
                disabled={logout.isPending}
                className="flex min-h-11 items-center gap-2 text-sm"
                onClick={() =>
                  logout.mutate(undefined, { onSettled: () => router.replace("/login") })
                }
              >
                <LogOut className="size-4" />
                {t("logout")}
              </button>
            </div>
          </details>
        </div>
        <div className="flex items-center gap-3 border-t border-neutral-700 px-3 py-2 md:px-5">
          <div className="w-full max-w-xl">
            <AdminSearch />
          </div>
        </div>
      </header>
      <div className="grid min-w-0 xl:grid-cols-[232px_minmax(0,1fr)]">
        <aside className="sticky top-[118px] hidden max-h-[calc(100vh-118px)] self-start overflow-y-auto bg-neutral-900 xl:block">
          <Navigation access={data} />
        </aside>
        <main id="admin-main" className="min-w-0 p-4 md:p-6 xl:p-7">
          <motion.div key={pathname} initial={reduced ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.18 }}>{children}</motion.div>
        </main>
      </div>
      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent
          side={locale === "ar" ? "right" : "left"}
          showCloseButton={false}
          className="admin-shell w-[min(320px,90vw)] gap-0 overflow-y-auto border-0 bg-neutral-900 p-0 text-white"
        >
          <div className="flex items-center justify-between border-b border-neutral-700 px-4">
            <SheetTitle className="text-sm text-white">
              IOMA · {t("navigation")}
            </SheetTitle>
            <SheetClose
              className="grid size-11 place-items-center"
              aria-label={t("close")}
            >
              <X className="size-5" />
            </SheetClose>
          </div>
          <SheetDescription className="sr-only">{t("navigation")}</SheetDescription>
          <Navigation access={data} onNavigate={() => setDrawer(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
