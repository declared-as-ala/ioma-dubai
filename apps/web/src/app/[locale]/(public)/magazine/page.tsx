import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Clock, ArrowRight, BookOpen } from "lucide-react";
import { getMagazineArticles, type MagazineArticleItem } from "@/lib/server-content";
import { MagazineCard } from "@/components/magazine/magazine-card";
import {
  MagazineFilterBar,
  type CategoryOption,
} from "@/components/magazine/magazine-filter-bar";

export const dynamic = "force-dynamic";

const CATEGORY_DEFINITIONS: Record<string, { en: string; fr: string; ar: string }> = {
  "beautiful-longevity": {
    en: "Beautiful Longevity",
    fr: "Beautiful Longevity",
    ar: "طول عمر وجمال البشرة",
  },
  "science-de-la-peau": {
    en: "Skin Science",
    fr: "Science de la peau",
    ar: "علم البشرة",
  },
  "soins-visage": {
    en: "Facial Care",
    fr: "Soins visage",
    ar: "العناية بالوجه",
  },
  "actifs-ingredients": {
    en: "Actives & Ingredients",
    fr: "Actifs & ingrédients",
    ar: "المكونات الفعالة",
  },
  "peau-mode-de-vie": {
    en: "Skin & Lifestyle",
    fr: "Peau & mode de vie",
    ar: "البشرة وأسلوب الحياة",
  },
  "marque-innovation": {
    en: "Brand & Innovation",
    fr: "Marque & innovation",
    ar: "العلامة والابتكار",
  },
  "cheveux-cuir-chevelu": {
    en: "Hair & Scalp",
    fr: "Cheveux & cuir chevelu",
    ar: "الشعر وفروة الرأس",
  },
  "soins-corps": {
    en: "Body Care",
    fr: "Soins corps",
    ar: "العناية بالجسم",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  const isFr = locale === "fr";

  const title = isAr
    ? "مجلة آيوما باريس دبي | أسرار علم البشرة والجمال المستدام"
    : isFr
      ? "Le Magazine IOMA Paris | Science, Rituels & Beautiful Longevity"
      : "IOMA Paris Magazine | Skin Science, Longevity & Skincare Rituals";

  const description = isAr
    ? "اكتشفوا مقالات مجلة آيوما الحصرية حول علم البشرة، مفهوم Beautiful Longevity، المكونات الفعالة، والطقوس المخصصة للبشرة."
    : isFr
      ? "Explorez les articles officiels du Magazine IOMA Paris : science cellulaire, Beautiful Longevity, actifs haute performance et soins sur-mesure."
      : "Explore official IOMA Paris Magazine articles: cellular skin science, Beautiful Longevity, clinical actives, and bespoke beauty rituals.";

  return {
    title,
    description,
    alternates: {
      canonical: `https://ioma-paris.ae/${locale}/magazine`,
      languages: {
        en: "https://ioma-paris.ae/en/magazine",
        fr: "https://ioma-paris.ae/fr/magazine",
        ar: "https://ioma-paris.ae/ar/magazine",
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://ioma-paris.ae/${locale}/magazine`,
      siteName: "IOMA Paris Dubai",
    },
  };
}

export default async function MagazineIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>;
}) {
  const locale = await getLocale();
  const sp = await searchParams;
  const activeCategory = sp.category || "";
  const activeSearch = sp.q || "";
  const currentPage = Math.max(parseInt(sp.page || "1", 10) || 1, 1);
  const pageSize = 12;

  const data = await getMagazineArticles({
    category: activeCategory,
    search: activeSearch,
    page: currentPage,
    limit: pageSize,
  });

  const totalPages = Math.max(Math.ceil((data.total || 0) / pageSize), 1);
  const items = data.items || [];

  const categoryOptions: CategoryOption[] = Object.entries(CATEGORY_DEFINITIONS).map(
    ([slug, labels]) => ({
      slug,
      label: (labels as any)[locale] || labels.en,
    }),
  );

  const isFirstPage = currentPage === 1 && !activeCategory && !activeSearch;
  const featuredArticle = isFirstPage && items.length > 0 ? items[0] : null;
  const displayArticles = featuredArticle ? items.slice(1) : items;

  const pageTitle =
    locale === "fr"
      ? "Le Magazine IOMA"
      : locale === "ar"
        ? "مجلة آيوما"
        : "IOMA Magazine";

  const pageSubtitle =
    locale === "fr"
      ? "La science de la peau, la Beautiful Longevity et les rituels d'exception décryptés par les experts IOMA Paris."
      : locale === "ar"
        ? "علم البشرة المتقدم، وطول عمر الخلايا، وطقوس الجمال الاستثنائية برؤية خبراء آيوما باريس."
        : "Skin science, Beautiful Longevity, and bespoke skincare rituals decoded by IOMA Paris experts.";

  return (
    <main className="min-h-screen bg-neutral-50/50 pb-24 dark:bg-neutral-950">
      {/* Editorial Header */}
      <section className="border-b border-neutral-200/80 bg-white py-16 md:py-24 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto max-w-5xl px-4 text-center md:px-6">
          <p className="font-mono text-xs font-semibold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
            {locale === "fr"
              ? "Éditorial & Science"
              : locale === "ar"
                ? "افتتاحية وعلم البشرة"
                : "Editorial & Science"}
          </p>
          <h1 className="mt-4 font-display text-4xl font-normal tracking-tight text-neutral-900 md:text-6xl dark:text-neutral-50">
            {pageTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-neutral-600 md:text-lg dark:text-neutral-400">
            {pageSubtitle}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pt-10 md:px-8">
        {/* Filter and Search Bar */}
        <MagazineFilterBar
          categories={categoryOptions}
          activeCategory={activeCategory}
          activeSearch={activeSearch}
          locale={locale}
        />

        {/* Featured Article Hero (Page 1 only) */}
        {featuredArticle && (
          <section className="mb-14">
            <div className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-xs transition-shadow duration-300 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                <div className="relative aspect-16/10 lg:aspect-auto lg:col-span-7">
                  {featuredArticle.coverImage ? (
                    <Image
                      src={featuredArticle.coverImage}
                      alt={
                        featuredArticle.title?.[locale] || featuredArticle.title?.fr || ""
                      }
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full min-h-[360px] w-full items-center justify-center bg-neutral-100 font-display text-lg text-neutral-400">
                      IOMA Magazine
                    </div>
                  )}
                  <div className="absolute top-4 start-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3.5 py-1 text-xs font-medium tracking-wider text-white uppercase backdrop-blur-md dark:bg-white dark:text-neutral-900">
                      <BookOpen className="h-3.5 w-3.5" />
                      {locale === "fr"
                        ? "À la une"
                        : locale === "ar"
                          ? "مقال مميز"
                          : "Featured"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col justify-between p-8 md:p-12 lg:col-span-5">
                  <div>
                    <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                      <span className="font-semibold tracking-wider text-neutral-900 uppercase dark:text-neutral-200">
                        {featuredArticle.category?.[locale] ||
                          featuredArticle.category?.fr ||
                          featuredArticle.category?.en}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {featuredArticle.readingTimeMinutes || 4}{" "}
                        {locale === "ar" ? "دقائق" : "min"}
                      </span>
                    </div>

                    <h2 className="mt-4 font-display text-2xl font-medium text-neutral-900 md:text-3xl dark:text-neutral-50">
                      <Link
                        href={`/magazine/${featuredArticle.slug}`}
                        className="transition-colors hover:text-neutral-600 dark:hover:text-neutral-300"
                      >
                        {featuredArticle.title?.[locale] ||
                          featuredArticle.title?.fr ||
                          featuredArticle.title?.en}
                      </Link>
                    </h2>

                    <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                      {featuredArticle.excerpt?.[locale] ||
                        featuredArticle.summary?.[locale] ||
                        featuredArticle.excerpt?.fr}
                    </p>
                  </div>

                  <div className="mt-8">
                    <Link
                      href={`/magazine/${featuredArticle.slug}`}
                      className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-xs font-semibold tracking-wider text-white uppercase transition-transform hover:scale-[1.02] dark:bg-white dark:text-neutral-900"
                    >
                      <span>
                        {locale === "fr"
                          ? "Lire l'article complet"
                          : locale === "ar"
                            ? "قراءة المقال كاملاً"
                            : "Read full article"}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Articles Grid */}
        {displayArticles.length > 0 ? (
          <section>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {displayArticles.map((article) => (
                <MagazineCard key={article.slug} article={article} locale={locale} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav
                className="mt-16 flex items-center justify-center gap-3"
                aria-label="Pagination"
              >
                {currentPage > 1 && (
                  <Link
                    href={`/magazine?${new URLSearchParams({
                      ...(activeCategory ? { category: activeCategory } : {}),
                      ...(activeSearch ? { q: activeSearch } : {}),
                      page: String(currentPage - 1),
                    }).toString()}`}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-200 bg-white px-5 text-xs font-medium uppercase tracking-wider text-neutral-700 transition-colors hover:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                  >
                    {locale === "fr"
                      ? "Précédent"
                      : locale === "ar"
                        ? "السابق"
                        : "Previous"}
                  </Link>
                )}

                <span className="px-4 text-xs font-medium tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
                  {locale === "fr"
                    ? `Page ${currentPage} sur ${totalPages}`
                    : locale === "ar"
                      ? `الصفحة ${currentPage} من ${totalPages}`
                      : `Page ${currentPage} of ${totalPages}`}
                </span>

                {currentPage < totalPages && (
                  <Link
                    href={`/magazine?${new URLSearchParams({
                      ...(activeCategory ? { category: activeCategory } : {}),
                      ...(activeSearch ? { q: activeSearch } : {}),
                      page: String(currentPage + 1),
                    }).toString()}`}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-200 bg-white px-5 text-xs font-medium uppercase tracking-wider text-neutral-700 transition-colors hover:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                  >
                    {locale === "fr" ? "Suivant" : locale === "ar" ? "التالي" : "Next"}
                  </Link>
                )}
              </nav>
            )}
          </section>
        ) : (
          <div className="rounded-3xl border border-neutral-200/80 bg-white py-20 text-center dark:border-neutral-800 dark:bg-neutral-900">
            <p className="font-display text-xl text-neutral-900 dark:text-neutral-100">
              {locale === "fr"
                ? "Aucun article trouvé"
                : locale === "ar"
                  ? "لم يتم العثور على مقالات"
                  : "No articles found"}
            </p>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              {locale === "fr"
                ? "Essayez de modifier votre recherche ou filtre."
                : locale === "ar"
                  ? "يرجى تجربة معايير بحث أخرى أو إزالة الفلاتر."
                  : "Try adjusting your search terms or filters."}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
