import Image from "next/image";
import { getLocale } from "next-intl/server";
import { ArrowRight, Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getMagazineArticles, type MagazineArticleItem } from "@/lib/server-content";
import { MaskText, StaggerGrid } from "@/components/motion/cine";

const COPY = {
  en: {
    kicker: "The IOMA Magazine",
    title: "Skin science, rituals & longevity",
    all: "Read all articles",
    min: "min",
    fallbackCategory: "Magazine",
  },
  ar: {
    kicker: "مجلة آيوما",
    title: "علم البشرة والطقوس وطول عمر الجمال",
    all: "اقرأ جميع المقالات",
    min: "دقائق",
    fallbackCategory: "المجلة",
  },
} as const;

const pick = (v: Record<string, string> | undefined, loc: string) =>
  v?.[loc] || v?.en || v?.fr || "";

/** Latest magazine articles for the home page. Renders nothing when there are none (or the API is unreachable). */
export async function JournalBand() {
  const locale = (await getLocale()) === "ar" ? "ar" : "en";
  const c = COPY[locale];
  const { items } = await getMagazineArticles({ limit: 3 });
  const articles: MagazineArticleItem[] = (items ?? []).slice(0, 3);
  if (articles.length === 0) return null;

  const date = (iso?: string) =>
    iso
      ? new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-AE", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }).format(new Date(iso))
      : "";

  return (
    <section
      aria-label={c.kicker}
      className="border-t border-border bg-sf-ivory py-20 md:py-28"
    >
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-sf-mauve rtl:tracking-normal">
              <span aria-hidden className="h-px w-8 bg-sf-mauve" />
              {c.kicker}
            </p>
            <MaskText
              as="h2"
              className="mt-4 max-w-2xl text-balance font-display text-[clamp(1.9rem,3.6vw,3rem)] font-medium leading-[1.1] tracking-[-0.02em] rtl:leading-[1.35] rtl:tracking-normal"
              text={c.title}
            />
          </div>
          <Link
            href="/magazine"
            className="group inline-flex min-h-11 items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:text-sf-mauve rtl:tracking-normal"
          >
            {c.all}
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
              aria-hidden
            />
          </Link>
        </div>

        <StaggerGrid
          revision="journal"
          className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-3"
        >
          {articles.map((a) => {
            const title = pick(a.title, locale);
            const excerpt = pick(a.excerpt, locale) || pick(a.summary, locale);
            const category = pick(a.category, locale) || c.fallbackCategory;
            return (
              <article key={a.slug} className="group flex flex-col">
                <Link
                  href={`/magazine/${a.slug}`}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="relative block aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-muted"
                >
                  {a.coverImage ? (
                    <Image
                      src={a.coverImage}
                      alt=""
                      fill
                      unoptimized
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover transition-transform duration-[900ms] ease-[var(--ease-out-strong)] motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-[1.04]"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center font-display text-sm uppercase tracking-[0.3em] text-muted-foreground">
                      IOMA
                    </span>
                  )}
                  <span className="absolute start-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-foreground shadow-sm rtl:tracking-normal">
                    {category}
                  </span>
                </Link>
                <div className="mt-5 flex flex-1 flex-col">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {a.datePublished && (
                      <time dateTime={a.datePublished}>{date(a.datePublished)}</time>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" aria-hidden />
                      {a.readingTimeMinutes || 3} {c.min}
                    </span>
                  </div>
                  <h3 className="mt-3 line-clamp-2 font-display text-[1.3rem] font-medium leading-snug text-foreground transition-colors group-hover:text-sf-mauve">
                    <Link href={`/magazine/${a.slug}`}>{title}</Link>
                  </h3>
                  {excerpt && (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {excerpt}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </StaggerGrid>
      </div>
    </section>
  );
}
