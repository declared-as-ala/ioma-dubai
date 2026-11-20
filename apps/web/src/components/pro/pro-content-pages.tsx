"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Download,
  FileText,
  Gift,
  GraduationCap,
  LifeBuoy,
  Palette,
  Play,
  Search,
  Star,
  Tag,
  Truck,
} from "lucide-react";
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
import { tr } from "@/lib/l10n";
import { useB2BOrders } from "@/hooks/use-professional";
import {
  useProAccess,
  useProBenefits,
  useProDocuments,
  useProGallery,
  useProVideos,
  useSaveProgress,
  type ProPhoto,
  type ProVideo,
} from "@/hooks/use-pro-access";
import {
  BENEFITS,
  DOCUMENTS,
  GALLERY,
  LOCK,
  OVERVIEW,
  SHELL,
  VIDEOS,
  orderStatusLabel,
} from "@/content/pro-space";
import {
  BlurThumb,
  Chip,
  EmptyNote,
  Eyebrow,
  LockPill,
  type Loc,
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
              ? "border-[#1a1a1d] bg-[#1a1a1d] text-white"
              : "border-border bg-white hover:border-[#1a1a1d]/50",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- Training academy */

const fmtMin = (loc: Loc, m: number) =>
  tr(loc, { en: `${m} min`, fr: `${m} min`, ar: `${m} دقيقة` });

function ProgressBar({ value }: { value: number }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-1 overflow-hidden rounded-full bg-[#e8e1d4]"
    >
      <div
        className="h-full bg-[#bfa273]"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

/** 0-100 for one lesson, from real saved progress and the lesson length when it is known. */
function lessonPercent(v: ProVideo): number {
  if (!v.progress) return 0;
  if (v.progress.completed) return 100;
  const total = (v.durationMinutes ?? 0) * 60;
  return total > 0 ? Math.min(99, (v.progress.positionSeconds / total) * 100) : 0;
}

function LessonCard({ v, onPlay }: { v: ProVideo; onPlay: (v: ProVideo) => void }) {
  const { loc, lx } = useTx();
  const pct = lessonPercent(v);
  return (
    <ProCard className="group overflow-hidden transition-shadow hover:shadow-md">
      <button
        type="button"
        disabled={v.locked}
        onClick={() => onPlay(v)}
        className="block w-full text-start disabled:cursor-default"
        aria-label={`${tr(loc, { en: "Play", fr: "Lire", ar: "تشغيل" })}: ${lx(v.title)}`}
      >
        <BlurThumb
          src={v.locked ? v.preview : v.thumbnail || v.preview}
          locked={v.locked}
        >
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-12 place-items-center rounded-full bg-[#1a1a1d]/90 text-white shadow transition-transform group-hover:scale-105">
              <Play className="size-5 translate-x-0.5 rtl:-scale-x-100" aria-hidden />
            </span>
          </span>
          {v.progress?.completed && (
            <span className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-wider text-emerald-800 shadow-sm">
              <CheckCircle2 className="size-3.5" aria-hidden />
              {tr(loc, { en: "Completed", fr: "Terminé", ar: "مكتمل" })}
            </span>
          )}
        </BlurThumb>
      </button>
      <div className="space-y-2 p-4">
        <h3 className="text-sm font-medium leading-snug">
          <bdi>{lx(v.title)}</bdi>
        </h3>
        {lx(v.description) && (
          <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
            <bdi>{lx(v.description)}</bdi>
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{v.durationMinutes ? fmtMin(loc, v.durationMinutes) : ""}</span>
          {!v.locked && pct > 0 && !v.progress?.completed && (
            <span>{Math.round(pct)}%</span>
          )}
        </div>
        {!v.locked && pct > 0 && <ProgressBar value={pct} />}
      </div>
    </ProCard>
  );
}

function Player({ video, onClose }: { video: ProVideo | null; onClose: () => void }) {
  const { loc, lx, tx } = useTx();
  const save = useSaveProgress();
  const qc = useQueryClient();
  const last = useRef(0);
  const ref = useRef<HTMLVideoElement>(null);

  const persist = (completed = false) => {
    const el = ref.current;
    if (!el || !video) return;
    save.mutate(
      { id: video.id, positionSeconds: el.currentTime, completed },
      { onSuccess: () => void qc.invalidateQueries({ queryKey: ["pro", "videos"] }) },
    );
  };

  return (
    <Dialog
      open={!!video}
      onOpenChange={(o) => {
        if (!o) {
          persist();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogTitle>{video ? lx(video.title) : ""}</DialogTitle>
        <DialogDescription className="sr-only">{tx(VIDEOS.title)}</DialogDescription>
        {video?.videoUrl ? (
          <video
            key={video.id}
            ref={ref}
            src={video.videoUrl}
            controls
            autoPlay
            playsInline
            className="aspect-video w-full rounded-xl bg-black"
            onLoadedMetadata={(e) => {
              // Resume where the learner stopped, unless the lesson was already completed.
              const p = video.progress;
              if (p && !p.completed && p.positionSeconds > 5)
                e.currentTarget.currentTime = p.positionSeconds;
            }}
            onTimeUpdate={(e) => {
              const now = e.currentTarget.currentTime;
              if (Math.abs(now - last.current) >= 15) {
                last.current = now;
                persist();
              }
            }}
            onPause={() => persist()}
            onEnded={() => persist(true)}
          />
        ) : (
          <p className="grid aspect-video place-items-center rounded-xl bg-[#faf7f1] text-sm text-muted-foreground">
            {tx(VIDEOS.videoSoon)}
          </p>
        )}
        {video && lx(video.description) && (
          <p className="text-sm leading-7 text-muted-foreground">
            <bdi>{lx(video.description)}</bdi>
          </p>
        )}
        {video?.progress?.completed && (
          <p className="text-xs text-emerald-800">
            {tr(loc, {
              en: "You completed this lesson.",
              fr: "Vous avez terminé cette leçon.",
              ar: "أكملتم هذا الدرس.",
            })}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ProVideos() {
  const { tx, lx, loc } = useTx();
  const access = useProAccess().data;
  const videos = useProVideos(access);
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [playing, setPlaying] = useState<ProVideo | null>(null);
  const all = useMemo(() => videos.data ?? [], [videos.data]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter(
      (v) =>
        (tab === "all" || v.category === tab) &&
        (!needle ||
          `${lx(v.title)} ${lx(v.description)} ${v.course ?? ""}`
            .toLowerCase()
            .includes(needle)),
    );
  }, [all, tab, q, lx]);

  const courses = useMemo(() => {
    const map = new Map<string, ProVideo[]>();
    for (const v of filtered) {
      const key = v.course || "";
      map.set(key, [...(map.get(key) ?? []), v]);
    }
    return [...map.entries()]
      .map(([course, items]) => ({
        course,
        items: [...items].sort((a, b) => a.sortOrder - b.sortOrder),
      }))
      .sort((a, b) =>
        a.course === "" ? 1 : b.course === "" ? -1 : a.course.localeCompare(b.course),
      );
  }, [filtered]);

  if (!access) return null;
  const customer = access.level === "customer";
  const continueWatching = all
    .filter((v) => v.progress && !v.progress.completed && v.progress.positionSeconds > 5)
    .sort(
      (a, b) =>
        +new Date(b.progress?.updatedAt ?? 0) - +new Date(a.progress?.updatedAt ?? 0),
    )
    .slice(0, 3);
  const featured = all.filter((v) => v.featured).slice(0, 3);
  const done = all.filter((v) => v.progress?.completed).length;

  return (
    <div className="space-y-8">
      {!customer && <UnlockBanner access={access} />}
      <PageTitle
        title={tr(loc, {
          en: "Training academy",
          fr: "Académie de formation",
          ar: "أكاديمية التدريب",
        })}
      >
        {tx(customer ? VIDEOS.subtitle : VIDEOS.lockedSubtitle)}
      </PageTitle>

      {customer && all.length > 0 && (
        <ProCard className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <Eyebrow>
              {tr(loc, { en: "Your progress", fr: "Votre progression", ar: "تقدّمكم" })}
            </Eyebrow>
            <p className="mt-1 text-sm">
              {tr(loc, {
                en: `${done} of ${all.length} lessons completed`,
                fr: `${done} leçon(s) sur ${all.length} terminée(s)`,
                ar: `${done} من ${all.length} دروس مكتملة`,
              })}
            </p>
          </div>
          <div className="w-full max-w-xs">
            <ProgressBar value={(done / all.length) * 100} />
          </div>
        </ProCard>
      )}

      {continueWatching.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-xl">
            {tr(loc, { en: "Continue watching", fr: "Reprendre", ar: "متابعة المشاهدة" })}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {continueWatching.map((v) => (
              <LessonCard key={v.id} v={v} onPlay={setPlaying} />
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-xl">
            {tr(loc, { en: "Featured", fr: "À la une", ar: "مميّز" })}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {featured.map((v) => (
              <LessonCard key={v.id} v={v} onPlay={setPlaying} />
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          label={tx(VIDEOS.title)}
          value={tab}
          onChange={setTab}
          tabs={Object.entries(VIDEOS.tabs).map(([key, label]) => ({
            key,
            label: tx(label),
          }))}
        />
        <label className="relative">
          <span className="sr-only">
            {tr(loc, { en: "Search lessons", fr: "Rechercher", ar: "بحث" })}
          </span>
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tr(loc, {
              en: "Search lessons",
              fr: "Rechercher une leçon",
              ar: "ابحث عن درس",
            })}
            className="min-h-11 w-64 rounded-full border border-[#e8e1d4] bg-white ps-9 pe-4 text-sm outline-none focus-visible:border-[#bfa273]"
          />
        </label>
      </div>

      {videos.isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="ioma-skel h-60" aria-hidden />
          ))}
        </div>
      ) : videos.isError ? (
        <EmptyNote>
          {tr(loc, {
            en: "The training library could not be loaded.",
            fr: "La bibliothèque n'a pas pu être chargée.",
            ar: "تعذّر تحميل المكتبة.",
          })}
        </EmptyNote>
      ) : courses.length ? (
        courses.map(({ course, items }) => {
          const finished = items.filter((v) => v.progress?.completed).length;
          return (
            <section key={course || "other"} className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#e8e1d4] pb-2">
                <h2 className="font-display text-2xl">
                  {course || tr(loc, { en: "Lessons", fr: "Leçons", ar: "الدروس" })}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {customer
                    ? tr(loc, {
                        en: `${finished}/${items.length} completed`,
                        fr: `${finished}/${items.length} terminées`,
                        ar: `${finished}/${items.length} مكتملة`,
                      })
                    : tr(loc, {
                        en: `${items.length} lessons`,
                        fr: `${items.length} leçons`,
                        ar: `${items.length} دروس`,
                      })}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((v) => (
                  <LessonCard key={v.id} v={v} onPlay={setPlaying} />
                ))}
              </div>
            </section>
          );
        })
      ) : (
        <EmptyNote>{tx(VIDEOS.empty)}</EmptyNote>
      )}

      <Player video={playing} onClose={() => setPlaying(null)} />
    </div>
  );
}

/* ----------------------------------------------------------------- Cabin gallery */

export function ProGallery() {
  const { tx, lx, loc } = useTx();
  const access = useProAccess().data;
  const photos = useProGallery(access);
  const [tab, setTab] = useState("all");
  const [collection, setCollection] = useState("");
  const [open, setOpen] = useState<ProPhoto | null>(null);
  const all = useMemo(() => photos.data ?? [], [photos.data]);
  const collections = useMemo(
    () =>
      [...new Set(all.map((p) => p.collection).filter((c): c is string => !!c))].sort(),
    [all],
  );
  const items = useMemo(
    () =>
      all
        .filter(
          (p) =>
            (tab === "all" || p.category === tab) &&
            (!collection || p.collection === collection),
        )
        .sort((a, b) => Number(b.featured) - Number(a.featured)),
    [all, tab, collection],
  );
  if (!access) return null;
  const customer = access.level === "customer";

  return (
    <div className="space-y-6">
      {!customer && <UnlockBanner access={access} />}
      <PageTitle
        title={tr(loc, {
          en: "Inspiration library",
          fr: "Bibliothèque d'inspiration",
          ar: "مكتبة الإلهام",
        })}
      >
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
      {collections.length > 0 && (
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={tr(loc, { en: "Collections", fr: "Collections", ar: "المجموعات" })}
        >
          {["", ...collections].map((c) => (
            <button
              key={c || "all"}
              type="button"
              aria-pressed={collection === c}
              onClick={() => setCollection(c)}
              className={cn(
                "min-h-10 rounded-full border px-4 text-xs font-medium transition-colors",
                collection === c
                  ? "border-[#bfa273] bg-[#bfa273]/15"
                  : "border-[#e8e1d4] bg-white hover:border-[#bfa273]/60",
              )}
            >
              {c || tr(loc, { en: "All collections", fr: "Toutes", ar: "الكل" })}
            </button>
          ))}
        </div>
      )}
      {photos.isLoading ? (
        <div className="ioma-skel h-72" aria-hidden />
      ) : items.length ? (
        <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>li]:mb-4 [&>li]:break-inside-avoid">
          {items.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                disabled={p.locked}
                onClick={() => setOpen(p)}
                className="group block w-full overflow-hidden rounded-2xl border border-[#e8e1d4] bg-white text-start disabled:cursor-default"
                aria-label={lx(p.title)}
              >
                <BlurThumb
                  src={p.locked ? p.preview : p.image || p.preview}
                  locked={p.locked}
                  aspect="aspect-[4/3]"
                  alt={lx(p.title)}
                />
                <span className="block p-3">
                  <span className="block text-sm font-medium">
                    <bdi>{lx(p.title)}</bdi>
                  </span>
                  {lx(p.caption) && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      <bdi>{lx(p.caption)}</bdi>
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyNote>{tx(GALLERY.empty)}</EmptyNote>
      )}

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
          {open && lx(open.caption) && (
            <p className="text-sm text-muted-foreground">
              <bdi>{lx(open.caption)}</bdi>
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ----------------------------------------------------------------- Partner benefits */

const BENEFIT_ICONS = {
  tag: Tag,
  graduation: GraduationCap,
  truck: Truck,
  support: LifeBuoy,
  palette: Palette,
  star: Star,
  gift: Gift,
} as const;

/** Only benefits IOMA configured in the admin are shown: nothing is invented here. */
export function ProBenefits() {
  const { tx, lx, loc } = useTx();
  const access = useProAccess().data;
  const benefits = useProBenefits(access);
  if (!access) return null;
  const customer = access.level === "customer";
  const items = benefits.data?.items ?? [];
  const contact = customer ? access.accountContact : access.teamContact;

  return (
    <div className="space-y-6">
      {!customer && <UnlockBanner access={access} />}
      <PageTitle
        title={tr(loc, {
          en: "Partner benefits",
          fr: "Avantages partenaire",
          ar: "مزايا الشركاء",
        })}
      >
        {tx(customer ? BENEFITS.subtitle : BENEFITS.lockedSubtitle)}
      </PageTitle>

      {benefits.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="ioma-skel h-40" aria-hidden />
          ))}
        </div>
      ) : items.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((b) => {
            const Icon =
              BENEFIT_ICONS[(b.icon ?? "star") as keyof typeof BENEFIT_ICONS] ?? Star;
            return (
              <ProCard
                key={b.id}
                className={cn("overflow-hidden", !customer && "opacity-90")}
              >
                {b.image && (
                  <div className="relative aspect-[16/7]">
                    <Image
                      src={b.image}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 40vw, 90vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <Icon className="size-6 text-[#9c8157]" aria-hidden />
                    {customer ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-emerald-800">
                        {tx(BENEFITS.unlocked)}
                      </span>
                    ) : (
                      <LockPill>{tx(BENEFITS.locked)}</LockPill>
                    )}
                  </div>
                  <h2 className="mt-5 font-display text-xl">
                    <bdi>{lx(b.title)}</bdi>
                  </h2>
                  <p className="mt-1 text-sm leading-7 text-muted-foreground">
                    <bdi>{lx(b.body)}</bdi>
                  </p>
                </div>
              </ProCard>
            );
          })}
        </div>
      ) : (
        <EmptyNote>
          {tr(loc, {
            en: "Your partner benefits will appear here as soon as IOMA publishes them.",
            fr: "Vos avantages partenaire apparaîtront ici dès qu'IOMA les publiera.",
            ar: "ستظهر مزايا الشركاء هنا فور نشرها من قبل IOMA.",
          })}
        </EmptyNote>
      )}

      {contact && (contact.name || contact.phone || contact.email) && (
        <ProCard className="p-6 text-sm">
          <Eyebrow>{customer ? tx(SHELL.yourContact) : tx(SHELL.help)}</Eyebrow>
          <p className="mt-2 font-medium">{contact.name}</p>
          {contact.phone && (
            <p dir="ltr" className="text-start">
              {contact.phone}
            </p>
          )}
          {contact.email && <p className="break-all">{contact.email}</p>}
        </ProCard>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- Documents */

export function ProDocuments() {
  const { tx, lx, loc } = useTx();
  const access = useProAccess().data;
  const docs = useProDocuments(access);
  const [kind, setKind] = useState("");
  const open = useMutation({
    mutationFn: (id: string) => apiFetch<{ url: string }>(`/pro/documents/${id}/url`),
    onSuccess: ({ url }) => window.open(url, "_blank", "noopener,noreferrer"),
  });
  const list = useMemo(() => docs.data ?? [], [docs.data]);
  const kinds = useMemo(() => [...new Set(list.map((d) => d.kind))], [list]);
  if (!access) return null;
  const customer = access.level === "customer";
  const shown = list.filter((d) => !kind || d.kind === kind);

  return (
    <div className="space-y-6">
      <PageTitle
        title={tr(loc, {
          en: "Resource center",
          fr: "Centre de ressources",
          ar: "مركز الموارد",
        })}
      >
        {tx(customer ? DOCUMENTS.subtitleCustomer : DOCUMENTS.subtitle)}
      </PageTitle>
      {kinds.length > 1 && (
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={tx(DOCUMENTS.title)}
        >
          {["", ...kinds].map((k) => (
            <button
              key={k || "all"}
              type="button"
              aria-pressed={kind === k}
              onClick={() => setKind(k)}
              className={cn(
                "min-h-10 rounded-full border px-4 text-xs font-medium transition-colors",
                kind === k
                  ? "border-[#bfa273] bg-[#bfa273]/15"
                  : "border-[#e8e1d4] bg-white hover:border-[#bfa273]/60",
              )}
            >
              {k
                ? tx(DOCUMENTS.kinds[k] ?? DOCUMENTS.kinds.price_list!)
                : tr(loc, { en: "All", fr: "Tous", ar: "الكل" })}
            </button>
          ))}
        </div>
      )}
      {docs.isLoading ? (
        <div className="ioma-skel h-64" aria-hidden />
      ) : shown.length ? (
        <ProCard className="divide-y divide-[#e8e1d4]">
          {shown.map((d) => (
            <div
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-4 p-5"
            >
              <div className="flex min-w-0 items-start gap-4">
                <FileText
                  className={cn(
                    "mt-0.5 size-5 shrink-0 text-[#9c8157]",
                    d.locked && "opacity-50",
                  )}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className={cn("font-medium", d.locked && "text-foreground/60")}>
                    <bdi>
                      {lx(d.title) ||
                        tx(DOCUMENTS.kinds[d.kind] ?? DOCUMENTS.kinds.price_list!)}
                    </bdi>
                  </p>
                  {lx(d.description) && (
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                      <bdi>{lx(d.description)}</bdi>
                    </p>
                  )}
                  <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span>
                      {tx(DOCUMENTS.kinds[d.kind] ?? DOCUMENTS.kinds.price_list!)}
                    </span>
                    {d.language && <span>{d.language.toUpperCase()}</span>}
                    {d.version && <span>v{d.version}</span>}
                    <span>
                      {d.locked
                        ? tx(DOCUMENTS.unlocksWithOrder)
                        : d.hasFile
                          ? "PDF"
                          : tx(DOCUMENTS.fileSoon)}
                    </span>
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
              {tx(LOCK.firstOrderCta)}
            </Link>
          </div>
        )}
      </ProCard>
    </div>
  );
}
