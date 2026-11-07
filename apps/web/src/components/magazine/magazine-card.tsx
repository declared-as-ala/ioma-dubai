import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { MagazineArticleItem } from "@/lib/server-content";
import { Clock, ArrowRight } from "lucide-react";

interface MagazineCardProps {
  article: MagazineArticleItem;
  locale: string;
}

export function MagazineCard({ article, locale }: MagazineCardProps) {
  const title = article.title?.[locale] || article.title?.fr || article.title?.en || "";
  const excerpt =
    article.excerpt?.[locale] || article.summary?.[locale] || article.excerpt?.fr || "";
  const category =
    article.category?.[locale] ||
    article.category?.fr ||
    article.category?.en ||
    "Magazine";
  const readingTime = article.readingTimeMinutes || 3;

  const dateFormatted = article.datePublished
    ? new Intl.DateTimeFormat(
        locale === "ar" ? "ar-AE" : locale === "fr" ? "fr-FR" : "en-AE",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        },
      ).format(new Date(article.datePublished))
    : "";

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
      {/* Cover image */}
      <Link
        href={`/magazine/${article.slug}`}
        className="relative aspect-16/10 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800"
        tabIndex={-1}
        aria-hidden="true"
      >
        {article.coverImage ? (
          <Image
            src={article.coverImage}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-100 font-display text-sm tracking-widest text-neutral-400 uppercase">
            IOMA Magazine
          </div>
        )}
        <div className="absolute top-3 start-3">
          <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium tracking-wider text-neutral-900 uppercase backdrop-blur-md shadow-xs dark:bg-neutral-900/90 dark:text-neutral-100">
            {category}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          {/* Metadata: Date & Reading Time */}
          <div className="mb-3 flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
            {dateFormatted && (
              <time dateTime={article.datePublished}>{dateFormatted}</time>
            )}
            {dateFormatted && <span aria-hidden="true">•</span>}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {readingTime} {locale === "ar" ? "دقائق" : "min"}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-display text-xl leading-snug font-medium text-neutral-900 transition-colors group-hover:text-neutral-600 dark:text-neutral-50 dark:group-hover:text-neutral-300">
            <Link href={`/magazine/${article.slug}`} className="focus:outline-hidden">
              <span className="absolute inset-0 z-10" />
              {title}
            </Link>
          </h3>

          {/* Excerpt */}
          {excerpt && (
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {excerpt}
            </p>
          )}
        </div>

        {/* Footer / Read CTA */}
        <div className="mt-6 flex items-center text-xs font-semibold tracking-wider text-neutral-900 uppercase dark:text-neutral-100">
          <span className="group-hover:underline">
            {locale === "fr"
              ? "Lire l'article"
              : locale === "ar"
                ? "قراءة المقال"
                : "Read article"}
          </span>
          <ArrowRight className="ms-1.5 h-3.5 w-3.5 transition-transform duration-300 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
        </div>
      </div>
    </article>
  );
}
