import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getMagazineArticle, getMagazineArticles } from "@/lib/server-content";
import { ReadingProgress } from "@/components/magazine/reading-progress";
import { SocialShare } from "@/components/magazine/social-share";
import { MagazineCard } from "@/components/magazine/magazine-card";
import { BackArrow } from "@/components/ui/back-arrow";
import { Clock, Calendar, User, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const article = await getMagazineArticle(slug);

  if (!article) {
    return {
      title: "Article Not Found | IOMA Paris Dubai",
    };
  }

  const title =
    article.seoTitle?.[locale] ||
    article.title?.[locale] ||
    article.title?.fr ||
    "IOMA Paris Magazine";

  const description =
    article.seoDescription?.[locale] ||
    article.excerpt?.[locale] ||
    article.summary?.[locale] ||
    article.excerpt?.fr ||
    "";

  const cover = article.coverImage || "https://ioma-paris.ae/images/hero/hero-poster.jpg";

  return {
    title: `${title} | IOMA Paris Magazine`,
    description,
    alternates: {
      canonical: `https://ioma-paris.ae/${locale}/magazine/${slug}`,
      languages: {
        en: `https://ioma-paris.ae/en/magazine/${slug}`,
        fr: `https://ioma-paris.ae/fr/magazine/${slug}`,
        ar: `https://ioma-paris.ae/ar/magazine/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://ioma-paris.ae/${locale}/magazine/${slug}`,
      siteName: "IOMA Paris Dubai",
      publishedTime: article.datePublished,
      images: [
        {
          url: cover,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [cover],
    },
  };
}

export default async function MagazineArticlePage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();

  const article = await getMagazineArticle(slug);
  if (!article) {
    notFound();
  }

  const title = article.title?.[locale] || article.title?.fr || article.title?.en || "";

  const excerpt =
    article.excerpt?.[locale] || article.summary?.[locale] || article.excerpt?.fr || "";

  const category =
    article.category?.[locale] ||
    article.category?.fr ||
    article.category?.en ||
    "Magazine";

  const categorySlug = article.categorySlug || "beautiful-longevity";
  const author = article.author || "IOMA Paris Scientific Committee";
  const readingTime = article.readingTimeMinutes || 4;

  const dateFormatted = article.datePublished
    ? new Intl.DateTimeFormat(
        locale === "ar" ? "ar-AE" : locale === "fr" ? "fr-FR" : "en-AE",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      ).format(new Date(article.datePublished))
    : "";

  // Fetch related articles from same category
  const relatedRes = await getMagazineArticles({
    category: categorySlug,
    limit: 4,
  });
  const relatedArticles = (relatedRes.items || [])
    .filter((a) => a.slug !== article.slug)
    .slice(0, 3);

  // Schema.org Article JSON-LD
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: excerpt,
    image: article.coverImage ? [article.coverImage] : [],
    datePublished: article.datePublished,
    dateModified: article.updatedAt || article.datePublished,
    author: {
      "@type": "Person",
      name: author,
    },
    publisher: {
      "@type": "Organization",
      name: "IOMA Paris Dubai",
      logo: {
        "@type": "ImageObject",
        url: "https://ioma-paris.ae/images/ioma-logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://ioma-paris.ae/${locale}/magazine/${slug}`,
    },
  };

  // Schema.org BreadcrumbList JSON-LD
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: locale === "fr" ? "Accueil" : locale === "ar" ? "الرئيسية" : "Home",
        item: `https://ioma-paris.ae/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: locale === "fr" ? "Magazine" : locale === "ar" ? "المجلة" : "Magazine",
        item: `https://ioma-paris.ae/${locale}/magazine`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: category,
        item: `https://ioma-paris.ae/${locale}/magazine?category=${categorySlug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: title,
        item: `https://ioma-paris.ae/${locale}/magazine/${slug}`,
      },
    ],
  };

  const rawHtml =
    article.htmlBody?.[locale] || article.htmlBody?.fr || article.htmlBody?.en || "";

  return (
    <>
      {/* Schema.org Microdata */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <ReadingProgress />

      <main className="min-h-screen bg-white pb-24 dark:bg-neutral-950">
        {/* Breadcrumbs & Navigation Bar */}
        <div className="border-b border-neutral-100 bg-neutral-50/50 py-4 dark:border-neutral-900 dark:bg-neutral-900/50">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 md:px-6">
            <Link
              href="/magazine"
              className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-neutral-600 uppercase transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              <BackArrow />
              <span>
                {locale === "fr"
                  ? "Retour au Magazine"
                  : locale === "ar"
                    ? "العودة إلى المجلة"
                    : "Back to Magazine"}
              </span>
            </Link>

            <div className="hidden items-center gap-2 text-xs text-neutral-400 sm:flex">
              <Link
                href="/magazine"
                className="hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                Magazine
              </Link>
              <ChevronRight className="h-3 w-3 rtl:rotate-180" />
              <Link
                href={`/magazine?category=${categorySlug}`}
                className="hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                {category}
              </Link>
            </div>
          </div>
        </div>

        {/* Article Header Container */}
        <article className="mx-auto max-w-4xl px-4 pt-10 md:px-6 md:pt-16">
          {/* Category Pill */}
          <div className="mb-6">
            <Link
              href={`/magazine?category=${categorySlug}`}
              className="inline-flex items-center rounded-full bg-neutral-100 px-4 py-1.5 text-xs font-semibold tracking-wider text-neutral-900 uppercase transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
            >
              {category}
            </Link>
          </div>

          {/* Headline */}
          <h1 className="font-display text-3xl font-medium tracking-tight text-neutral-900 md:text-5xl lg:text-6xl dark:text-neutral-50">
            {title}
          </h1>

          {/* Excerpt */}
          {excerpt && (
            <p className="mt-6 font-serif text-lg leading-relaxed text-neutral-600 md:text-xl dark:text-neutral-300">
              {excerpt}
            </p>
          )}

          {/* Author, Date & Reading Time Metadata */}
          <div className="mt-8 flex flex-wrap items-center gap-6 border-y border-neutral-100 py-4 text-xs text-neutral-500 dark:border-neutral-900 dark:text-neutral-400">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="font-medium text-neutral-800 dark:text-neutral-200">
                {author}
              </span>
            </div>

            {dateFormatted && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <time dateTime={article.datePublished}>{dateFormatted}</time>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                {readingTime} {locale === "ar" ? "دقائق قراءة" : "min read"}
              </span>
            </div>
          </div>

          {/* Cover Image */}
          {article.coverImage && (
            <div className="relative my-10 aspect-16/10 w-full overflow-hidden rounded-3xl bg-neutral-100 shadow-md md:my-14 dark:bg-neutral-800">
              <Image
                src={article.coverImage}
                alt={title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Article Body */}
          {rawHtml ? (
            <div
              className="prose prose-neutral prose-lg max-w-none dark:prose-invert prose-headings:font-display prose-headings:font-normal prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-2xl md:prose-h2:text-3xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-xl prose-p:leading-relaxed prose-p:text-neutral-700 dark:prose-p:text-neutral-300 prose-a:text-neutral-900 prose-a:underline hover:prose-a:text-neutral-600 dark:prose-a:text-neutral-100 prose-img:rounded-2xl prose-img:shadow-sm"
              dangerouslySetInnerHTML={{ __html: rawHtml }}
            />
          ) : article.blocks && article.blocks.length > 0 ? (
            <div className="space-y-8">
              {article.blocks.map((block, i) => (
                <section key={i} className="space-y-4">
                  {block.heading?.[locale] && (
                    <h2 className="font-display text-2xl font-normal text-neutral-900 dark:text-neutral-100">
                      {block.heading[locale]}
                    </h2>
                  )}
                  {block.image && (
                    <div className="relative aspect-16/9 overflow-hidden rounded-2xl">
                      <Image
                        src={block.image}
                        alt={block.heading?.[locale] || ""}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  {block.body?.[locale] && (
                    <p className="text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
                      {block.body[locale]}
                    </p>
                  )}
                </section>
              ))}
            </div>
          ) : null}

          {/* Social Share Bar */}
          <div className="mt-14">
            <SocialShare
              title={title}
              url={`/magazine/${article.slug}`}
              locale={locale}
            />
          </div>
        </article>

        {/* Related Articles Section */}
        {relatedArticles.length > 0 && (
          <section className="mt-20 border-t border-neutral-100 bg-neutral-50/50 py-16 dark:border-neutral-900 dark:bg-neutral-900/50">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
              <div className="mb-10 text-center">
                <p className="font-mono text-xs font-semibold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
                  {locale === "fr"
                    ? "Pour aller plus loin"
                    : locale === "ar"
                      ? "المزيد من المقالات"
                      : "Continue Reading"}
                </p>
                <h2 className="mt-2 font-display text-2xl font-normal text-neutral-900 md:text-3xl dark:text-neutral-50">
                  {locale === "fr"
                    ? "Articles recommandés"
                    : locale === "ar"
                      ? "مقالات موصى بها"
                      : "Related Articles"}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {relatedArticles.map((rel) => (
                  <MagazineCard key={rel.slug} article={rel} locale={locale} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
