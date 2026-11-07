"use client";

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
import { useB2BOrders } from "@/hooks/use-professional";
import { useProAccess, useProVideos } from "@/hooks/use-pro-access";
import { formatMinor } from "@/lib/money";
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

export default function ProOverview() {
  const { tx, loc, lx } = useTx();
  const access = useProAccess().data;
  const videos = useProVideos(access);
  const orders = useB2BOrders();
  if (!access) return null;

  const customer = access.level === "customer";
  const name = access.firstName ?? "";
  const stepState = customer ? [true, true, true] : [true, false, false];

  return (
    <div className="space-y-10">
      {/* Welcome banner */}
      <ProCard className="overflow-hidden">
        <div className="grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="relative min-h-[220px] md:min-h-[300px]">
            <Image
              src="/images/pro/hero.jpg"
              alt=""
              fill
              priority
              sizes="(min-width: 768px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="p-6 sm:p-9">
            <Eyebrow>
              {tx(customer ? OVERVIEW.customerKicker : OVERVIEW.validatedKicker)}
            </Eyebrow>
            <h1 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
              {name
                ? tx(customer ? OVERVIEW.welcomeBack(name) : OVERVIEW.welcome(name))
                : tx({
                    en: customer ? "Welcome back." : "Welcome.",
                    ar: customer ? "مرحباً بعودتك." : "مرحباً.",
                  })}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {tx(customer ? OVERVIEW.customerBody : OVERVIEW.validatedBody)}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {customer ? (
                <>
                  <Link href="/portal/orders" className={primaryBtn}>
                    {tx(OVERVIEW.reorder)}
                  </Link>
                  <Link href="/portal/videos" className={outlineBtn}>
                    {tx(OVERVIEW.continueTraining)}
                  </Link>
                </>
              ) : (
                <Link href="/portal/shop" className={primaryBtn}>
                  {tx(OVERVIEW.startOrder)}
                </Link>
              )}
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
                        stepState[i]
                          ? "border-[#5b4fd6] bg-[#5b4fd6] text-white"
                          : i === 1
                            ? "border-[#5b4fd6] bg-[#5b4fd6] text-white"
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

      {/* Six cards: three open from validation, three unlocked by the first order */}
      <div className="grid gap-4 md:grid-cols-3">
        {CARDS.map((c) => {
          const locked = c.lockedFirst && !customer;
          return (
            <Link
              key={c.key}
              href={c.href}
              className={cn(
                "group rounded-xl border border-border bg-white p-6 transition-colors hover:border-[#5b4fd6]/50",
                locked && "bg-white/60",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <c.icon
                  className={cn("size-6 text-[#5b4fd6]", locked && "opacity-60")}
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

      {/* Training preview (locked) or continue learning (customer) */}
      <section>
        <h2 className="font-display text-2xl">
          {tx(customer ? OVERVIEW.continueLearning : OVERVIEW.previewTitle)}
        </h2>
        {!customer && (
          <p className="mt-1 text-sm text-muted-foreground">{tx(OVERVIEW.previewBody)}</p>
        )}
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {(videos.data ?? []).slice(0, 3).map((v) => (
            <Link
              key={v.id}
              href="/portal/videos"
              className="overflow-hidden rounded-xl border border-border bg-white"
            >
              <BlurThumb src={v.preview} locked={v.locked}>
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid size-12 place-items-center rounded-full bg-[#5b4fd6] text-white shadow">
                    <Play
                      className="size-5 translate-x-0.5 rtl:-scale-x-100"
                      aria-hidden
                    />
                  </span>
                </span>
              </BlurThumb>
              <div className="p-4">
                <Chip>{tx(VIDEOS.tabs[v.category] ?? VIDEOS.tabs.all!)}</Chip>
                <p className="mt-2 text-sm font-medium">{lx(v.title)}</p>
                {v.durationMinutes ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {v.durationMinutes} min
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Orders */}
      <section>
        <h2 className="font-display text-2xl">{tx(OVERVIEW.yourOrders)}</h2>
        <ProCard className="mt-5 overflow-hidden">
          {orders.data?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-start text-sm">
                <thead>
                  <tr className="border-b border-border text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
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
                    <tr key={o._id} className="border-b border-border last:border-0">
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
                          className="text-xs font-semibold uppercase tracking-wider text-[#5b4fd6] hover:underline"
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
                {tx({ en: "Start your first order", ar: "ابدأ طلبك الأول" })}
              </Link>
            </div>
          )}
        </ProCard>
      </section>
    </div>
  );
}
