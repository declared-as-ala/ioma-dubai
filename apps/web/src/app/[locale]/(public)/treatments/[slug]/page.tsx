import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@ioma/config";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { BackArrow } from "@/components/ui/back-arrow";
import { TREATMENTS } from "@/content/treatments";

export function generateStaticParams() {
  return TREATMENTS.map((treatment) => ({ slug: treatment.slug }));
}

export default async function TreatmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const treatment = TREATMENTS.find((t) => t.slug === slug);
  if (!treatment) {
    notFound();
  }

  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("TreatmentsPage");

  return (
    <main className="mx-auto max-w-2xl px-4 md:px-6 py-24">
      <Link
        href="/treatments"
        className="inline-flex min-h-11 items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground xl:min-h-0"
      >
        <BackArrow /> {t("backToTreatments")}
      </Link>
      <h1 className="mt-6 font-display text-4xl">{treatment.name[locale]}</h1>
      <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
        {t("duration", { minutes: treatment.durationMinutes })}
      </p>
      <div className="mt-8 space-y-6">
        {treatment.body[locale].map((paragraph, index) => (
          <p key={index} className="text-base leading-relaxed text-muted-foreground">
            {paragraph}
          </p>
        ))}
      </div>
      <Button asChild size="lg" className="mt-10 uppercase tracking-widest">
        <Link href="/partners" prefetch={false}>
          {locale === "ar" ? "البحث عن معهد شريك" : "Find an Institute"}
        </Link>
      </Button>
    </main>
  );
}
