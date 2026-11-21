"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { BadgeCheck, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import { tr } from "@/lib/l10n";
import { useAuthStore } from "@/stores/auth-store";
import {
  useProductReviews,
  useSubmitReview,
  useWithdrawReview,
  MAX_REVIEW_PHOTOS,
  MAX_REVIEW_PHOTO_BYTES,
  type ReviewSort,
} from "@/hooks/use-reviews";

const T = {
  title: { en: "Customer reviews", fr: "Avis clients", ar: "آراء العملاء" },
  write: { en: "Write a review", fr: "Écrire un avis", ar: "اكتبي تقييمك" },
  empty: {
    en: "No reviews yet. Be the first to share your experience.",
    fr: "Aucun avis pour le moment. Soyez la première à partager votre expérience.",
    ar: "لا توجد تقييمات بعد. كوني أول من يشارك تجربتها.",
  },
  verified: { en: "Verified purchase", fr: "Achat vérifié", ar: "شراء موثّق" },
  verifiedCount: {
    en: (n: number) => `${n} verified purchase${n === 1 ? "" : "s"}`,
    fr: (n: number) => `${n} achat${n === 1 ? "" : "s"} vérifié${n === 1 ? "" : "s"}`,
    ar: (n: number) => `${n} عملية شراء موثّقة`,
  },
  reviews: {
    en: (n: number) => `${n} review${n === 1 ? "" : "s"}`,
    fr: (n: number) => `${n} avis`,
    ar: (n: number) => `${n} تقييم`,
  },
  sort: { en: "Sort", fr: "Trier", ar: "ترتيب" },
  newest: { en: "Most recent", fr: "Plus récents", ar: "الأحدث" },
  highest: { en: "Highest rated", fr: "Mieux notés", ar: "الأعلى تقييماً" },
  lowest: { en: "Lowest rated", fr: "Moins bien notés", ar: "الأقل تقييماً" },
  more: { en: "Show more reviews", fr: "Afficher plus d'avis", ar: "عرض المزيد" },
  reply: { en: "Reply from IOMA", fr: "Réponse d'IOMA", ar: "ردّ من IOMA" },
  loading: {
    en: "Loading reviews…",
    fr: "Chargement des avis…",
    ar: "جارٍ تحميل التقييمات…",
  },
  loadError: {
    en: "Reviews could not be loaded right now.",
    fr: "Les avis ne peuvent pas être chargés pour le moment.",
    ar: "تعذّر تحميل التقييمات حالياً.",
  },
  formTitle: {
    en: "Share your experience",
    fr: "Partagez votre expérience",
    ar: "شاركينا تجربتك",
  },
  formIntro: {
    en: "Your review is published after a quick check by our team.",
    fr: "Votre avis sera publié après une courte vérification par notre équipe.",
    ar: "سيتم نشر تقييمك بعد مراجعة سريعة من فريقنا.",
  },
  rating: { en: "Your rating", fr: "Votre note", ar: "تقييمك" },
  titleLabel: {
    en: "Title (optional)",
    fr: "Titre (facultatif)",
    ar: "العنوان (اختياري)",
  },
  commentLabel: { en: "Your review", fr: "Votre avis", ar: "تقييمك" },
  commentHint: {
    en: "At least 10 characters.",
    fr: "10 caractères minimum.",
    ar: "10 أحرف على الأقل.",
  },
  submit: { en: "Submit review", fr: "Envoyer l'avis", ar: "إرسال التقييم" },
  sending: { en: "Sending…", fr: "Envoi…", ar: "جارٍ الإرسال…" },
  cancel: { en: "Cancel", fr: "Annuler", ar: "إلغاء" },
  thanks: {
    en: "Thank you. Your review was received and will appear once it has been approved.",
    fr: "Merci. Votre avis a bien été reçu et apparaîtra dès qu'il aura été validé.",
    ar: "شكراً لك. تم استلام تقييمك وسيظهر بعد الموافقة عليه.",
  },
  signIn: {
    en: "Sign in to write a review",
    fr: "Connectez-vous pour écrire un avis",
    ar: "سجّلي الدخول لكتابة تقييم",
  },
  signInNote: {
    en: "Only registered customers can review a product.",
    fr: "Seuls les clients inscrits peuvent donner un avis.",
    ar: "يمكن للعملاء المسجّلين فقط تقييم المنتجات.",
  },
  yours: { en: "Your review", fr: "Votre avis", ar: "تقييمك" },
  pending: {
    en: "Awaiting approval. Only you can see it for now.",
    fr: "En attente de validation. Vous seule pouvez le voir pour l'instant.",
    ar: "بانتظار الموافقة. أنتِ فقط من يراه حالياً.",
  },
  rejected: {
    en: "This review was not published.",
    fr: "Cet avis n'a pas été publié.",
    ar: "لم يتم نشر هذا التقييم.",
  },
  hidden: {
    en: "This review is currently hidden.",
    fr: "Cet avis est actuellement masqué.",
    ar: "هذا التقييم مخفي حالياً.",
  },
  withdraw: { en: "Withdraw my review", fr: "Retirer mon avis", ar: "سحب تقييمي" },
  stars: {
    en: (n: number) => `${n} out of 5 stars`,
    fr: (n: number) => `${n} étoiles sur 5`,
    ar: (n: number) => `${n} من 5 نجوم`,
  },
  photos: { en: "Photos (optional)", fr: "Photos (facultatif)", ar: "صور (اختياري)" },
  photosHint: {
    en: "Up to 3 photos, JPEG, PNG or WebP, 5 MB each.",
    fr: "Jusqu'à 3 photos, JPEG, PNG ou WebP, 5 Mo chacune.",
    ar: "حتى 3 صور بصيغة JPEG أو PNG أو WebP، بحجم 5 ميغابايت لكل صورة.",
  },
  addPhotos: { en: "Add photos", fr: "Ajouter des photos", ar: "إضافة صور" },
  removePhoto: { en: "Remove photo", fr: "Retirer la photo", ar: "إزالة الصورة" },
  photoAlt: { en: "Customer photo", fr: "Photo client", ar: "صورة العميلة" },
  photoRejected: {
    en: "A photo was skipped: use JPEG, PNG or WebP up to 5 MB.",
    fr: "Une photo a été ignorée : JPEG, PNG ou WebP jusqu'à 5 Mo.",
    ar: "تم تجاهل صورة: استخدمي JPEG أو PNG أو WebP بحجم أقصاه 5 ميغابايت.",
  },
  photoFailed: {
    en: "Your review was received, but a photo could not be uploaded.",
    fr: "Votre avis a bien été reçu, mais une photo n'a pas pu être envoyée.",
    ar: "تم استلام تقييمك، لكن تعذّر رفع إحدى الصور.",
  },
  photosPending: {
    en: (n: number) => `${n} photo${n === 1 ? "" : "s"} awaiting approval.`,
    fr: (n: number) => `${n} photo${n === 1 ? "" : "s"} en attente de validation.`,
    ar: (n: number) => `${n} صورة بانتظار الموافقة.`,
  },
  errors: {
    duplicate: {
      en: "You have already reviewed this product.",
      fr: "Vous avez déjà donné votre avis sur ce produit.",
      ar: "لقد قمتِ بتقييم هذا المنتج من قبل.",
    },
    generic: {
      en: "Your review could not be sent. Please check it and try again.",
      fr: "Votre avis n'a pas pu être envoyé. Vérifiez-le et réessayez.",
      ar: "تعذّر إرسال تقييمك. يرجى المراجعة والمحاولة مرة أخرى.",
    },
    rating: {
      en: "Please choose a rating.",
      fr: "Veuillez choisir une note.",
      ar: "يرجى اختيار تقييم.",
    },
    short: {
      en: "Please write at least 10 characters.",
      fr: "Veuillez écrire au moins 10 caractères.",
      ar: "يرجى كتابة 10 أحرف على الأقل.",
    },
  },
};

export function Stars({
  value,
  size = "size-4",
  className,
}: {
  value: number;
  size?: string;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5 text-sf-champagne", className)}
      aria-hidden
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            size,
            i <= Math.round(value) ? "fill-current" : "fill-transparent opacity-40",
          )}
        />
      ))}
    </span>
  );
}

/** The rating shown next to the product title: only real published reviews, nothing when there are none. */
export function ProductRatingSummary({ slug }: { slug: string }) {
  const locale = useLocale();
  const q = useProductReviews(slug);
  const stats = q.data?.stats;
  if (!stats || stats.count === 0) return null;
  return (
    <div className="flex items-center gap-2 text-xs">
      <Stars value={stats.average ?? 0} size="size-3.5" />
      <a
        href="#avis-clients"
        className="font-medium text-foreground underline-offset-2 transition-colors hover:text-sf-champagne hover:underline"
        aria-label={`${stats.average} / 5 · ${tr(locale, T.reviews)(stats.count)}`}
      >
        {stats.average?.toFixed(1)} · {tr(locale, T.reviews)(stats.count)}
      </a>
    </div>
  );
}

function ReviewForm({
  slug,
  open,
  onOpenChange,
}: {
  slug: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const locale = useLocale();
  const submit = useSubmitReview(slug);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [photoNote, setPhotoNote] = useState<string | null>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const ok: File[] = [];
    let rejected = false;
    for (const f of Array.from(list)) {
      if (/^image\/(jpeg|png|webp)$/.test(f.type) && f.size <= MAX_REVIEW_PHOTO_BYTES)
        ok.push(f);
      else rejected = true;
    }
    setFiles((cur) => [...cur, ...ok].slice(0, MAX_REVIEW_PHOTOS));
    setPhotoNote(rejected ? tr(locale, T.photoRejected) : null);
  };

  const reset = () => {
    setFiles([]);
    setPhotoNote(null);
    setRating(0);
    setTitle("");
    setComment("");
    setError(null);
    setDone(false);
    submit.reset();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return setError(tr(locale, T.errors.rating));
    if (comment.trim().length < 10) return setError(tr(locale, T.errors.short));
    setError(null);
    submit.mutate(
      { rating, title: title.trim(), comment: comment.trim(), locale, files },
      {
        onSuccess: (res) => {
          setDone(true);
          if (res.photoErrors) setPhotoNote(tr(locale, T.photoFailed));
        },
        onError: (err) =>
          setError(
            err instanceof ApiError && err.statusCode === 409
              ? tr(locale, T.errors.duplicate)
              : err instanceof ApiError && err.statusCode === 400
                ? err.message
                : tr(locale, T.errors.generic),
          ),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto">
        <DialogTitle className="font-display text-xl font-normal">
          {tr(locale, T.formTitle)}
        </DialogTitle>
        <DialogDescription>{tr(locale, T.formIntro)}</DialogDescription>
        {done ? (
          <div className="space-y-4" role="status">
            <p className="text-sm leading-relaxed text-foreground">
              {tr(locale, T.thanks)}
            </p>
            {photoNote && <p className="text-sm text-destructive">{photoNote}</p>}
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              OK
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">{tr(locale, T.rating)}</legend>
              <div
                className="flex items-center gap-1"
                role="radiogroup"
                aria-label={tr(locale, T.rating)}
                onMouseLeave={() => setHover(0)}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={tr(locale, T.stars)(n)}
                    className="grid size-11 place-items-center rounded-md text-sf-champagne transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sf-champagne"
                    onMouseEnter={() => setHover(n)}
                    onClick={() => setRating(n)}
                  >
                    <Star
                      className={cn(
                        "size-7",
                        n <= (hover || rating) ? "fill-current" : "fill-transparent",
                      )}
                    />
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="space-y-1.5">
              <label htmlFor="review-title" className="text-sm font-medium">
                {tr(locale, T.titleLabel)}
              </label>
              <input
                id="review-title"
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:border-sf-champagne focus-visible:ring-2 focus-visible:ring-sf-champagne/30"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="review-comment" className="text-sm font-medium">
                {tr(locale, T.commentLabel)}
              </label>
              <textarea
                id="review-comment"
                rows={5}
                maxLength={2000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                aria-describedby="review-comment-hint"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed outline-none focus-visible:border-sf-champagne focus-visible:ring-2 focus-visible:ring-sf-champagne/30"
              />
              <p id="review-comment-hint" className="text-xs text-muted-foreground">
                {tr(locale, T.commentHint)} {comment.length}/2000
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">{tr(locale, T.photos)}</p>
              {files.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {files.map((f, i) => (
                    <li
                      key={`${f.name}-${i}`}
                      className="relative size-20 overflow-hidden rounded-md border border-border"
                    >
                      <img
                        src={URL.createObjectURL(f)}
                        alt={tr(locale, T.photoAlt)}
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        aria-label={tr(locale, T.removePhoto)}
                        className="absolute end-0 top-0 grid size-7 place-items-center bg-black/60 text-white"
                        onClick={() => setFiles((cur) => cur.filter((_, j) => j !== i))}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {files.length < MAX_REVIEW_PHOTOS && (
                <label className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-border px-4 text-sm hover:bg-muted">
                  {tr(locale, T.addPhotos)}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
              <p className="text-xs text-muted-foreground">{tr(locale, T.photosHint)}</p>
              {photoNote && <p className="text-xs text-destructive">{photoNote}</p>}
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {tr(locale, T.cancel)}
              </Button>
              <Button type="submit" disabled={submit.isPending}>
                {submit.isPending ? tr(locale, T.sending) : tr(locale, T.submit)}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Customer reviews of a product: real, published, moderated. Empty state when there are none. */
export function ProductReviews({ slug }: { slug: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const [sort, setSort] = useState<ReviewSort>("newest");
  const [page, setPage] = useState(1);
  const [writing, setWriting] = useState(false);
  const q = useProductReviews(slug, { sort, page });
  const withdraw = useWithdrawReview(slug);
  const [extra, setExtra] = useState<NonNullable<typeof q.data>["items"]>([]);

  const stats = q.data?.stats;
  const mine = q.data?.mine ?? null;
  const items = page === 1 ? (q.data?.items ?? []) : [...extra, ...(q.data?.items ?? [])];
  const hasMore = !!q.data && q.data.page * q.data.limit < q.data.total;
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  const openWrite = () => setWriting(true);

  return (
    <section
      id="avis-clients"
      className="mt-20 border-t border-border pt-12 sm:mt-24 sm:pt-16"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-normal text-foreground">
            {tr(locale, T.title)}
          </h2>
          {stats && stats.count > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="flex items-baseline gap-2">
                <span className="font-display text-4xl font-light leading-none">
                  {stats.average?.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">/ 5</span>
              </span>
              <Stars value={stats.average ?? 0} size="size-5" />
              <span className="text-sm text-foreground/80">
                {tr(locale, T.reviews)(stats.count)}
              </span>
              {stats.verifiedCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-foreground/70">
                  <BadgeCheck className="size-4 text-sf-champagne" aria-hidden />
                  {tr(locale, T.verifiedCount)(stats.verifiedCount)}
                </span>
              )}
            </div>
          )}
        </div>
        {user ? (
          !mine && (
            <Button className="w-full sm:w-auto" onClick={openWrite}>
              {tr(locale, T.write)}
            </Button>
          )
        ) : (
          <div className="sm:text-end">
            <Button asChild className="w-full sm:w-auto">
              <Link
                href={`/login?redirect=${encodeURIComponent(pathname.replace(/^\/(en|fr|ar)/, "") || "/")}`}
              >
                {tr(locale, T.signIn)}
              </Link>
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              {tr(locale, T.signInNote)}
            </p>
          </div>
        )}
      </div>

      {stats && stats.count > 0 && (
        <ul className="mt-6 max-w-md space-y-1.5" aria-label={tr(locale, T.title)}>
          {([5, 4, 3, 2, 1] as const).map((n) => {
            const c = stats.distribution[String(n) as "1"] ?? 0;
            const pct = stats.count ? Math.round((c / stats.count) * 100) : 0;
            return (
              <li key={n} className="flex items-center gap-3 text-xs">
                <span className="w-10 shrink-0 tabular-nums text-muted-foreground">
                  {n} ★
                </span>
                <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-border">
                  <span
                    className="block h-full rounded-full bg-sf-champagne transition-[width] duration-500 motion-reduce:transition-none"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="w-8 shrink-0 text-end tabular-nums text-muted-foreground">
                  {c}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {mine && (
        <div className="mt-8 rounded-lg border border-border bg-muted/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/70">
              {tr(locale, T.yours)}
            </p>
            <button
              type="button"
              className="min-h-11 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              disabled={withdraw.isPending}
              onClick={() => withdraw.mutate(mine.id)}
            >
              {tr(locale, T.withdraw)}
            </button>
          </div>
          <Stars value={mine.rating} className="mt-1" />
          {mine.title && <p className="mt-2 text-sm font-medium">{mine.title}</p>}
          <p className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed text-foreground/85">
            {mine.comment}
          </p>
          {mine.photoCount > 0 && mine.status !== "published" && (
            <p className="mt-2 text-xs text-muted-foreground">
              {tr(locale, T.photosPending)(mine.photoCount)}
            </p>
          )}
          {mine.status !== "published" && (
            <p className="mt-3 text-xs text-muted-foreground" role="status">
              {tr(locale, T[mine.status as "pending" | "rejected" | "hidden"])}
            </p>
          )}
        </div>
      )}

      {q.isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground" role="status">
          {tr(locale, T.loading)}
        </p>
      ) : q.isError ? (
        <p className="mt-8 text-sm text-muted-foreground" role="alert">
          {tr(locale, T.loadError)}
        </p>
      ) : stats && stats.count === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-border px-6 py-12 text-center">
          <Star className="mx-auto size-6 text-sf-champagne/70" aria-hidden />
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {tr(locale, T.empty)}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 flex items-center justify-end gap-2 text-xs">
            <label htmlFor="review-sort" className="text-muted-foreground">
              {tr(locale, T.sort)}
            </label>
            <select
              id="review-sort"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as ReviewSort);
                setPage(1);
                setExtra([]);
              }}
              className="h-11 rounded-md border border-border bg-background px-2 text-xs"
            >
              <option value="newest">{tr(locale, T.newest)}</option>
              <option value="highest">{tr(locale, T.highest)}</option>
              <option value="lowest">{tr(locale, T.lowest)}</option>
            </select>
          </div>
          <ul className="mt-2 divide-y divide-border/60">
            {items.map((r) => (
              <li key={r.id} className="min-w-0 space-y-2 py-5 first:pt-2">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{r.authorName}</span>
                    {r.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-foreground/80">
                        <BadgeCheck className="size-3.5 text-sf-champagne" aria-hidden />
                        {tr(locale, T.verified)}
                      </span>
                    )}
                  </span>
                  <time dateTime={r.createdAt} className="text-xs text-muted-foreground">
                    {date.format(new Date(r.createdAt))}
                  </time>
                </div>
                <div className="flex items-center gap-2">
                  <Stars value={r.rating} size="size-3.5" />
                  <span className="sr-only">{tr(locale, T.stars)(r.rating)}</span>
                </div>
                {r.title && <p className="text-sm font-medium">{r.title}</p>}
                <p className="whitespace-pre-line break-words text-sm leading-relaxed text-foreground/85">
                  {r.comment}
                </p>
                {r.photos.length > 0 && (
                  <ul className="flex flex-wrap gap-2 pt-1">
                    {r.photos.map((src) => (
                      <li key={src}>
                        <a
                          href={src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={src}
                            alt={tr(locale, T.photoAlt)}
                            loading="lazy"
                            className="size-20 rounded-md border border-border object-cover sm:size-24"
                          />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                {r.reply && (
                  <div className="ms-0 mt-2 rounded-md bg-muted/50 p-3 text-sm sm:ms-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-foreground/70">
                      {tr(locale, T.reply)}
                    </p>
                    <p className="mt-1 whitespace-pre-line break-words leading-relaxed text-foreground/85">
                      {r.reply.text}
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {hasMore && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => {
                  setExtra(items);
                  setPage((p) => p + 1);
                }}
              >
                {tr(locale, T.more)}
              </Button>
            </div>
          )}
        </>
      )}

      <ReviewForm slug={slug} open={writing} onOpenChange={setWriting} />
    </section>
  );
}
