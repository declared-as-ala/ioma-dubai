"use client";

import { useMemo } from "react";
import Image from "next/image";
import {
  Check,
  FileText,
  FlaskConical,
  Gift,
  ImageIcon,
  Play,
  ShoppingBag,
  Video,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ProductImage } from "@/components/shop/product-image";
import { useB2BCatalog, useB2BOrders } from "@/hooks/use-professional";
import { useProAccess, useProHome, type Localized } from "@/hooks/use-pro-access";
import { formatMinor } from "@/lib/money";
import { tr } from "@/lib/l10n";
import { cn } from "@/lib/utils";
import { OVERVIEW, SHELL, VIDEOS, orderStatusLabel } from "@/content/pro-space";
import {
  BlurThumb,
  Chip,
  Eyebrow,
  LockPill,
  ProCard,
  outlineBtn,
  primaryBtn,
  useTx,
} from "./pro-ui";

const CARDS = [
  {
    key: "shop",
    href: "/portal/shop",
    icon: ShoppingBag,
    text: OVERVIEW.cards.shop,
    label: "shop",
    lockedFirst: false,
  },
  {
    key: "cabin",
    href: "/portal/cabin",
    icon: FlaskConical,
    text: OVERVIEW.cards.cabin,
    label: "cabin",
    lockedFirst: false,
  },
  {
    key: "documents",
    href: "/portal/documents",
    icon: FileText,
    text: OVERVIEW.cards.documents,
    label: "documents",
    lockedFirst: false,
  },
  {
    key: "videos",
    href: "/portal/videos",
    icon: Video,
    text: OVERVIEW.cards.videos,
    label: "videos",
    lockedFirst: true,
  },
  {
    key: "gallery",
    href: "/portal/gallery",
    icon: ImageIcon,
    text: OVERVIEW.cards.gallery,
    label: "gallery",
    lockedFirst: true,
  },
  {
    key: "benefits",
    href: "/portal/benefits",
    icon: Gift,
    text: OVERVIEW.cards.benefits,
    label: "benefits",
    lockedFirst: true,
  },
] as const;

function Section({
  title,
  href,
  hrefLabel,
  children,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#e8e1d4] pb-2">
        <h2 className="font-display text-2xl">{title}</h2>
        {href && (
          <Link
            href={href}
            className="text-xs font-semibold uppercase tracking-wider text-[#9c8157] hover:underline"
          >
            {hrefLabel}
          </Link>
        )}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/**
 * IOMA PRO home. The banner, announcements, section order and visibility, featured items,
 * delivery information and contact details all come from the admin (Portal home); nothing
 * on this page is a hardcoded banner or promotion.
 */
export default function ProOverview() {
  const { tx, loc, lx } = useTx();
  const access = useProAccess().data;
  const home = useProHome(access);
  const orders = useB2BOrders();
  const catalog = useB2BCatalog();
  const featuredSlugs = home.data?.featuredProductSlugs ?? [];
  const featured = useMemo(
    () => (catalog.data ?? []).filter((p) => featuredSlugs.includes(p.slug)).slice(0, 4),
    [catalog.data, featuredSlugs],
  );
  if (!access) return null;

  const customer = access.level === "customer";
  const name = access.firstName ?? "";
  const h = home.data;
  const L = (v?: Localized) => lx(v);
  const headline = L(h?.hero.headline);
  const body = L(h?.hero.body);
  const heroImage = h?.hero.image;
  const primary = h?.hero.primaryCta;
  const secondary = h?.hero.secondaryCta;
  const stepState = customer ? [true, true, true] : [true, false, false];

  const sectionNodes: Record<string, React.ReactNode> = {
    orders: (
      <Section
        key="orders"
        title={tx(OVERVIEW.yourOrders)}
        href="/portal/orders"
        hrefLabel={tr(loc, {
          en: "All orders",
          fr: "Toutes les commandes",
          ar: "كل الطلبات",
        })}
      >
        <ProCard className="overflow-hidden">
          {orders.isLoading ? (
            <div className="ioma-skel m-5 h-24" aria-hidden />
          ) : orders.data?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-start text-sm">
                <thead>
                  <tr className="border-b border-[#e8e1d4] text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
                    {[
                      OVERVIEW.cols.order,
                      OVERVIEW.cols.date,
                      OVERVIEW.cols.amount,
                      OVERVIEW.cols.status,
                    ].map((c) => (
                      <th key={c.en} className="px-5 py-3 text-start font-semibold">
                        {tx(c)}
                      </th>
                    ))}
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {orders.data.slice(0, 5).map((o) => (
                    <tr key={o._id} className="border-b border-[#e8e1d4] last:border-0">
                      <td className="px-5 py-4">
                        <bdi>{o.orderNumber}</bdi>
                      </td>
                      <td className="px-5 py-4">
                        {new Intl.DateTimeFormat(loc, { dateStyle: "medium" }).format(
                          new Date(o.createdAt),
                        )}
                      </td>
                      <td className="px-5 py-4">{formatMinor(o.totalMinor, loc)}</td>
                      <td className="px-5 py-4">
                        {tx(orderStatusLabel(o.fulfillmentStatus))}
                      </td>
                      <td className="px-5 py-4 text-end">
                        <Link
                          href={`/portal/orders/${o.orderNumber}`}
                          className="text-xs font-semibold uppercase tracking-wider text-[#9c8157] hover:underline"
                        >
                          {tx(OVERVIEW.view)}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">{tx(OVERVIEW.noOrders)}</p>
              <Link href="/portal/shop" className={cn(primaryBtn, "mt-5")}>
                {tr(loc, {
                  en: "Start your first order",
                  fr: "Passez votre première commande",
                  ar: "ابدأ طلبك الأول",
                })}
              </Link>
            </div>
          )}
        </ProCard>
      </Section>
    ),

    featuredProducts: featured.length ? (
      <Section
        key="featuredProducts"
        title={tr(loc, {
          en: "Featured products",
          fr: "Produits à la une",
          ar: "منتجات مميزة",
        })}
        href="/portal/shop"
        hrefLabel={tr(loc, {
          en: "Open the shop",
          fr: "Ouvrir la boutique",
          ar: "افتح المتجر",
        })}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => {
            const v = p.variants[0];
            return (
              <Link key={p.slug} href="/portal/shop" className="group block">
                <ProCard className="overflow-hidden transition-shadow group-hover:shadow-md">
                  <div className="relative aspect-square bg-[#faf7f1]">
                    {p.images[0] && (
                      <ProductImage
                        src={p.images[0]}
                        alt={p.name[loc] || p.name.en}
                        fill
                        sizes="(min-width: 1024px) 20vw, 45vw"
                        className="object-contain p-5"
                      />
                    )}
                  </div>
                  <div className="space-y-1 p-4">
                    <p className="text-[0.65rem] uppercase tracking-[0.16em] text-[#9c8157]">
                      {p.range.name[loc] || p.range.name.en}
                    </p>
                    <p className="text-sm font-medium leading-snug">
                      <bdi>{p.name[loc] || p.name.en}</bdi>
                    </p>
                    {v?.b2bPriceMinor != null && (
                      <p className="text-sm">{formatMinor(v.b2bPriceMinor, loc)}</p>
                    )}
                  </div>
                </ProCard>
              </Link>
            );
          })}
        </div>
      </Section>
    ) : null,

    training: h?.training.length ? (
      <Section
        key="training"
        title={tx(customer ? OVERVIEW.continueLearning : OVERVIEW.previewTitle)}
        href="/portal/videos"
        hrefLabel={tr(loc, { en: "Training academy", fr: "Académie", ar: "الأكاديمية" })}
      >
        {!customer && (
          <p className="-mt-2 mb-4 text-sm text-muted-foreground">
            {tx(OVERVIEW.previewBody)}
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          {h.training.map((v) => (
            <Link
              key={v.id}
              href="/portal/videos"
              className="overflow-hidden rounded-2xl border border-[#e8e1d4] bg-white"
            >
              <BlurThumb
                src={v.locked ? v.preview : v.thumbnail || v.preview}
                locked={v.locked}
              >
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid size-12 place-items-center rounded-full bg-[#1a1a1d]/90 text-white shadow">
                    <Play
                      className="size-5 translate-x-0.5 rtl:-scale-x-100"
                      aria-hidden
                    />
                  </span>
                </span>
              </BlurThumb>
              <div className="p-4">
                <Chip>{tx(VIDEOS.tabs[v.category] ?? VIDEOS.tabs.all!)}</Chip>
                <p className="mt-2 text-sm font-medium">
                  <bdi>{lx(v.title)}</bdi>
                </p>
                {v.durationMinutes ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {v.durationMinutes} min
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </Section>
    ) : null,

    documents: h?.documents.length ? (
      <Section
        key="documents"
        title={tr(loc, {
          en: "Latest documents",
          fr: "Derniers documents",
          ar: "أحدث المستندات",
        })}
        href="/portal/documents"
        hrefLabel={tr(loc, {
          en: "Resource center",
          fr: "Centre de ressources",
          ar: "مركز الموارد",
        })}
      >
        <ProCard className="divide-y divide-[#e8e1d4]">
          {h.documents.map((d) => (
            <Link
              key={d.id}
              href="/portal/documents"
              className="flex items-center gap-4 p-4 hover:bg-[#faf7f1]"
            >
              <FileText
                className={cn("size-5 text-[#9c8157]", d.locked && "opacity-50")}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-sm">
                <bdi>{lx(d.title)}</bdi>
              </span>
              {d.locked && <LockPill>{tx(OVERVIEW.cards.firstOrder)}</LockPill>}
            </Link>
          ))}
        </ProCard>
      </Section>
    ) : null,

    benefits: h?.benefits.length ? (
      <Section
        key="benefits"
        title={tr(loc, {
          en: "Partner benefits",
          fr: "Avantages partenaire",
          ar: "مزايا الشركاء",
        })}
        href="/portal/benefits"
        hrefLabel={tr(loc, {
          en: "All benefits",
          fr: "Tous les avantages",
          ar: "كل المزايا",
        })}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {h.benefits.map((b) => (
            <ProCard key={b.id} className="p-5">
              <p className="font-display text-lg">
                <bdi>{lx(b.title)}</bdi>
              </p>
              <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                <bdi>{lx(b.body)}</bdi>
              </p>
            </ProCard>
          ))}
        </div>
      </Section>
    ) : null,

    contact:
      h && (h.contact.phone || h.contact.email || h.contact.supportEmail) ? (
        <Section
          key="contact"
          title={tr(loc, {
            en: "Your IOMA contact",
            fr: "Votre contact IOMA",
            ar: "جهة اتصالكم في IOMA",
          })}
        >
          <ProCard className="space-y-1 p-6 text-sm">
            {h.contact.phone && (
              <p dir="ltr" className="text-start">
                <a
                  className="hover:underline"
                  href={`tel:${h.contact.phone.replace(/\s+/g, "")}`}
                >
                  {h.contact.phone}
                </a>
              </p>
            )}
            {h.contact.email && (
              <p>
                <a className="hover:underline" href={`mailto:${h.contact.email}`}>
                  {h.contact.email}
                </a>
              </p>
            )}
            {h.contact.supportEmail && (
              <p>
                <a className="hover:underline" href={`mailto:${h.contact.supportEmail}`}>
                  {h.contact.supportEmail}
                </a>
              </p>
            )}
            {L(h.contact.hours) && (
              <p className="pt-2 text-muted-foreground">
                <bdi>{L(h.contact.hours)}</bdi>
              </p>
            )}
          </ProCard>
        </Section>
      ) : null,
  };

  const ordered = (
    h?.sections ?? Object.keys(sectionNodes).map((key) => ({ key, visible: true }))
  )
    .filter((s) => s.visible)
    .map((s) => sectionNodes[s.key])
    .filter(Boolean);

  return (
    <div className="space-y-10">
      <ProCard className="overflow-hidden">
        <div
          className={cn(
            "grid",
            heroImage && "md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]",
          )}
        >
          {heroImage && (
            <div className="relative min-h-[220px] md:min-h-[320px]">
              <Image
                src={heroImage}
                alt=""
                fill
                priority
                unoptimized
                sizes="(min-width: 768px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
          )}
          <div className="bg-gradient-to-br from-white to-[#faf7f1] p-6 sm:p-10">
            <Eyebrow>
              {tx(customer ? OVERVIEW.customerKicker : OVERVIEW.validatedKicker)}
            </Eyebrow>
            <h1 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
              {headline ||
                (name
                  ? tx(customer ? OVERVIEW.welcomeBack(name) : OVERVIEW.welcome(name))
                  : tr(loc, {
                      en: customer ? "Welcome back." : "Welcome.",
                      fr: customer ? "Bon retour parmi nous." : "Bienvenue.",
                      ar: customer ? "مرحباً بعودتك." : "مرحباً.",
                    }))}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {body || tx(customer ? OVERVIEW.customerBody : OVERVIEW.validatedBody)}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {primary?.href ? (
                <Link href={primary.href} className={primaryBtn}>
                  {L(primary.label)}
                </Link>
              ) : customer ? (
                <Link href="/portal/orders" className={primaryBtn}>
                  {tx(OVERVIEW.reorder)}
                </Link>
              ) : (
                <Link href="/portal/shop" className={primaryBtn}>
                  {tx(OVERVIEW.startOrder)}
                </Link>
              )}
              {secondary?.href ? (
                <Link href={secondary.href} className={outlineBtn}>
                  {L(secondary.label)}
                </Link>
              ) : customer ? (
                <Link href="/portal/videos" className={outlineBtn}>
                  {tx(OVERVIEW.continueTraining)}
                </Link>
              ) : null}
            </div>
            {!customer && (
              <ol
                className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs"
                aria-label="Progress"
              >
                {OVERVIEW.steps.map((step, i) => (
                  <li key={step.en} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "grid size-7 place-items-center rounded-full border text-[0.7rem] font-semibold",
                        stepState[i] || i === 1
                          ? "border-[#1a1a1d] bg-[#1a1a1d] text-white"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {stepState[i] ? <Check className="size-3.5" aria-hidden /> : i + 1}
                    </span>
                    <span className={cn(i === 2 && "text-muted-foreground")}>
                      {tx(step)}
                    </span>
                    {i < 2 && (
                      <span aria-hidden className="hidden h-px w-8 bg-border sm:block" />
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </ProCard>

      {(h?.announcements ?? []).map((a) => (
        <div
          key={a.id}
          role="note"
          className="rounded-2xl border border-[#bfa273]/40 bg-[#bfa273]/10 px-6 py-4"
        >
          <p className="font-medium">
            <bdi>{L(a.title)}</bdi>
          </p>
          {L(a.body) && (
            <p className="mt-1 text-sm text-muted-foreground">
              <bdi>{L(a.body)}</bdi>
            </p>
          )}
        </div>
      ))}

      <div className="grid gap-4 md:grid-cols-3">
        {CARDS.map((c) => {
          const locked = c.lockedFirst && !customer;
          return (
            <Link
              key={c.key}
              href={c.href}
              className={cn(
                "group rounded-2xl border border-[#e8e1d4] bg-white p-6 transition-colors hover:border-[#bfa273]",
                locked && "bg-white/60",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <c.icon
                  className={cn("size-6 text-[#9c8157]", locked && "opacity-60")}
                  aria-hidden
                />
                {locked && <LockPill>{tx(OVERVIEW.cards.firstOrder)}</LockPill>}
              </div>
              <h2
                className={cn(
                  "mt-6 font-display text-xl",
                  locked && "text-foreground/60",
                )}
              >
                {tx(SHELL.nav[c.label])}
              </h2>
              <p
                className={cn(
                  "mt-1 text-sm text-muted-foreground",
                  locked && "opacity-70",
                )}
              >
                {tx(c.text)}
              </p>
            </Link>
          );
        })}
      </div>

      {ordered}
    </div>
  );
}
