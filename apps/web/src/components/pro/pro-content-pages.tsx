"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useMutation } from "@tanstack/react-query";
import { Download, Gift, ImageIcon, Play, Video, FileText } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import { formatMinor } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useB2BOrders } from "@/hooks/use-professional";
import {
  useProAccess,
  useProBenefits,
  useProDocuments,
  useProGallery,
  useProVideos,
  type ProPhoto,
  type ProVideo,
} from "@/hooks/use-pro-access";
import {
  BENEFITS,
  DOCUMENTS,
  GALLERY,
  LOCK,
  OVERVIEW,
  VIDEOS,
  orderStatusLabel,
} from "@/content/pro-space";
import {
  BlurThumb,
  Chip,
  EmptyNote,
  LockPill,
  PageTitle,
  ProCard,
  UnlockBanner,
  outlineBtn,
  primaryBtn,
  useTx,
} from "./pro-ui";

function Tabs({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={value === t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "min-h-11 rounded-lg border px-5 text-xs font-semibold uppercase tracking-wider transition-colors",
            value === t.key
              ? "border-[#5b4fd6] bg-[#5b4fd6] text-white"
              : "border-border bg-white hover:border-[#5b4fd6]/50",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- Training videos */

export function ProVideos() {
  const { tx, lx } = useTx();
  const access = useProAccess().data;
  const videos = useProVideos(access);
  const [tab, setTab] = useState("all");
  const [playing, setPlaying] = useState<ProVideo | null>(null);
  if (!access) return null;
  const customer = access.level === "customer";
  const items = (videos.data ?? []).filter((v) => tab === "all" || v.category === tab);

  return (
    <div className="space-y-6">
      {!customer && <UnlockBanner access={access} />}
      <PageTitle title={tx(VIDEOS.title)}>
        {tx(customer ? VIDEOS.subtitle : VIDEOS.lockedSubtitle)}
      </PageTitle>
      {customer && (
        <Tabs
          label={tx(VIDEOS.title)}
          value={tab}
          onChange={setTab}
          tabs={Object.entries(VIDEOS.tabs).map(([key, label]) => ({
            key,
            label: tx(label),
          }))}
        />
      )}
      {!customer && (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4a3f8f]/80">
          {tx(VIDEOS.preview)}
        </p>
      )}

      {videos.isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="ioma-skel h-60" aria-hidden />
          ))}
        </div>
      ) : items.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((v) => (
            <ProCard key={v.id} className="overflow-hidden">
              <button
                type="button"
                disabled={v.locked}
                onClick={() => setPlaying(v)}
                className="block w-full text-start disabled:cursor-default"
                aria-label={`${tx(VIDEOS.play)}: ${lx(v.title)}`}
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
              </button>
              <div className="p-4">
                <Chip>{tx(VIDEOS.tabs[v.category] ?? VIDEOS.tabs.all!)}</Chip>
                <h2 className="mt-2 text-sm font-medium leading-snug">
                  <bdi>{lx(v.title)}</bdi>
                </h2>
                {v.durationMinutes ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {tx(LOCK.duration(v.durationMinutes))}
                  </p>
                ) : null}
              </div>
            </ProCard>
          ))}
        </div>
      ) : (
        <EmptyNote>{tx(VIDEOS.empty)}</EmptyNote>
      )}

      <Dialog open={!!playing} onOpenChange={(o) => !o && setPlaying(null)}>
        <DialogContent className="max-w-3xl">
          <DialogTitle>{playing ? lx(playing.title) : ""}</DialogTitle>
          <DialogDescription className="sr-only">{tx(VIDEOS.title)}</DialogDescription>
          {playing?.videoUrl ? (
            <video
              key={playing.id}
              src={playing.videoUrl}
              controls
              autoPlay
              className="aspect-video w-full rounded-lg bg-black"
            />
          ) : (
            <p className="grid aspect-video place-items-center rounded-lg bg-ioma-grey-50 text-sm text-muted-foreground">
              {tx(VIDEOS.videoSoon)}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ----------------------------------------------------------------- Cabin gallery */

export function ProGallery() {
  const { tx, lx } = useTx();
  const access = useProAccess().data;
  const photos = useProGallery(access);
  const [tab, setTab] = useState("all");
  const [open, setOpen] = useState<ProPhoto | null>(null);
  if (!access) return null;
  const customer = access.level === "customer";
  const items = (photos.data ?? []).filter((p) => tab === "all" || p.category === tab);

  return (
    <div className="space-y-6">
      {!customer && <UnlockBanner access={access} />}
      <PageTitle title={tx(GALLERY.title)}>
        {tx(customer ? GALLERY.subtitle : GALLERY.lockedSubtitle)}
      </PageTitle>
      <Tabs
        label={tx(GALLERY.title)}
        value={tab}
        onChange={setTab}
        tabs={Object.entries(GALLERY.tabs).map(([key, label]) => ({
          key,
          label: tx(label),
        }))}
      />
      {photos.isLoading ? (
        <div className="ioma-skel h-72" aria-hidden />
      ) : items.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                disabled={p.locked}
                onClick={() => setOpen(p)}
                className="block w-full overflow-hidden rounded-xl border border-border bg-white text-start disabled:cursor-default"
                aria-label={lx(p.title)}
              >
                <BlurThumb
                  src={p.locked ? p.preview : p.image || p.preview}
                  locked={p.locked}
                  aspect="aspect-[4/3]"
                  alt={lx(p.title)}
                />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyNote>{tx(GALLERY.empty)}</EmptyNote>
      )}
      <p className="text-xs text-muted-foreground">{tx(GALLERY.credit)}</p>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-4xl">
          <DialogTitle>{open ? lx(open.title) : ""}</DialogTitle>
          <DialogDescription className="sr-only">{tx(GALLERY.title)}</DialogDescription>
          {open?.image && (
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={open.image}
                alt={lx(open.title)}
                fill
                sizes="90vw"
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ----------------------------------------------------------------- Your benefits */

export function ProBenefits() {
  const { tx, lx } = useTx();
  const access = useProAccess().data;
  const extra = useProBenefits(access);
  if (!access) return null;
  const customer = access.level === "customer";
  const icons = {
    videos: Video,
    gallery: ImageIcon,
    guides: FileText,
    contact: Gift,
  } as const;

  return (
    <div className="space-y-6">
      {!customer && <UnlockBanner access={access} />}
      <PageTitle title={tx(BENEFITS.title)}>
        {tx(customer ? BENEFITS.subtitle : BENEFITS.lockedSubtitle)}
      </PageTitle>
      <div className="grid gap-4 md:grid-cols-2">
        {BENEFITS.cards.map((c) => {
          const Icon = icons[c.key as keyof typeof icons];
          const inner = (
            <>
              <div className="flex items-start justify-between gap-3">
                <Icon className="size-6 text-[#5b4fd6]" aria-hidden />
                {customer ? (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-emerald-800">
                    {tx(BENEFITS.unlocked)}
                  </span>
                ) : (
                  <LockPill>{tx(BENEFITS.locked)}</LockPill>
                )}
              </div>
              <h2 className="mt-6 font-display text-xl">{tx(c.title)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{tx(c.body)}</p>
              {c.key === "contact" && customer && (
                <div className="mt-4 rounded-lg bg-sf-champagne/10 p-3 text-sm">
                  {access.accountContact ? (
                    <>
                      <p className="font-medium">{access.accountContact.name}</p>
                      {access.accountContact.phone && (
                        <p dir="ltr" className="text-start">
                          {access.accountContact.phone}
                        </p>
                      )}
                      {access.accountContact.email && (
                        <p className="break-all">{access.accountContact.email}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {tx(BENEFITS.contactTbc)}
                    </p>
                  )}
                </div>
              )}
            </>
          );
          return c.href && customer ? (
            <Link
              key={c.key}
              href={c.href}
              className="rounded-xl border border-border bg-white p-6 transition-colors hover:border-[#5b4fd6]/50"
            >
              {inner}
            </Link>
          ) : (
            <div
              key={c.key}
              className={cn(
                "rounded-xl border border-border bg-white p-6",
                !customer && "bg-white/70",
              )}
            >
              {inner}
            </div>
          );
        })}
        {(extra.data?.items ?? []).map((b) => (
          <div
            key={b.id}
            className={cn(
              "rounded-xl border border-border bg-white p-6",
              !customer && "bg-white/70",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <Gift className="size-6 text-[#5b4fd6]" aria-hidden />
              {customer ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-emerald-800">
                  {tx(BENEFITS.unlocked)}
                </span>
              ) : (
                <LockPill>{tx(BENEFITS.locked)}</LockPill>
              )}
            </div>
            <h2 className="mt-6 font-display text-xl">{lx(b.title)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{lx(b.body)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Documents */

export function ProDocuments() {
  const { tx, lx } = useTx();
  const access = useProAccess().data;
  const docs = useProDocuments(access);
  const open = useMutation({
    mutationFn: (id: string) => apiFetch<{ url: string }>(`/pro/documents/${id}/url`),
    onSuccess: ({ url }) => window.open(url, "_blank", "noopener,noreferrer"),
  });
  if (!access) return null;
  const customer = access.level === "customer";

  return (
    <div className="space-y-6">
      <PageTitle title={tx(DOCUMENTS.title)}>
        {tx(customer ? DOCUMENTS.subtitleCustomer : DOCUMENTS.subtitle)}
      </PageTitle>
      {docs.isLoading ? (
        <div className="ioma-skel h-64" aria-hidden />
      ) : docs.data?.length ? (
        <ProCard className="divide-y divide-border">
          {docs.data.map((d) => (
            <div
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-4 p-5"
            >
              <div className="flex min-w-0 items-center gap-4">
                <FileText
                  className={cn(
                    "size-5 shrink-0 text-[#5b4fd6]",
                    d.locked && "opacity-50",
                  )}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className={cn("font-medium", d.locked && "text-foreground/60")}>
                    {lx(d.title) ||
                      tx(DOCUMENTS.kinds[d.kind] ?? DOCUMENTS.kinds.price_list!)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF ·{" "}
                    {d.locked
                      ? tx(DOCUMENTS.unlocksWithOrder)
                      : d.hasFile
                        ? tx(DOCUMENTS.download)
                        : tx(DOCUMENTS.fileSoon)}
                  </p>
                </div>
              </div>
              {d.locked ? (
                <LockPill>{tx(DOCUMENTS.locked)}</LockPill>
              ) : (
                <button
                  type="button"
                  className={cn(outlineBtn, "min-h-11 px-4")}
                  disabled={!d.hasFile || open.isPending}
                  onClick={() => open.mutate(d.id)}
                >
                  <Download className="size-4" aria-hidden />
                  {tx(DOCUMENTS.download)}
                </button>
              )}
            </div>
          ))}
        </ProCard>
      ) : (
        <EmptyNote>{tx(DOCUMENTS.empty)}</EmptyNote>
      )}
      {open.isError && (
        <p role="alert" className="text-sm text-destructive">
          {tx(DOCUMENTS.error)}
        </p>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- Orders */

export function ProOrders() {
  const { tx, loc } = useTx();
  const orders = useB2BOrders();
  const sorted = useMemo(() => orders.data ?? [], [orders.data]);
  return (
    <div className="space-y-6">
      <PageTitle title={tx(OVERVIEW.yourOrders)} />
      <ProCard className="overflow-hidden">
        {orders.isLoading ? (
          <div className="ioma-skel m-5 h-24" aria-hidden />
        ) : sorted.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-start text-sm">
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
                {sorted.map((o) => (
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
              {tx(LOCK.firstOrderCta)}
            </Link>
          </div>
        )}
      </ProCard>
    </div>
  );
}
