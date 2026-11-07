import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@ioma/config";
import { PageHero } from "@/components/layout/page-hero";
import { Link } from "@/i18n/navigation";
import { TREATMENTS } from "@/content/treatments";

export default function TreatmentsPage() {
  const t = useTranslations("TreatmentsPage");
  const locale = useLocale() as Locale;

  return (
    <main>
      <PageHero kicker={t("kicker")} title={t("title")} lede={t("intro")} />
      <ul className="mx-auto my-16 max-w-[1440px] divide-y divide-border border-y border-border px-4 md:my-24 md:px-8">
        {TREATMENTS.map((treatment) => (
          <li key={treatment.slug}>
            <Link
              href={`/treatments/${treatment.slug}`}
              className="group flex flex-col gap-2 py-8 transition-colors hover:bg-sf-ivory sm:flex-row sm:items-center sm:justify-between sm:gap-6"
            >
              <div>
                <p className="font-display text-xl">{treatment.name[locale]}</p>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  {treatment.summary[locale]}
                </p>
              </div>
              <span className="whitespace-nowrap text-xs uppercase tracking-widest text-muted-foreground">
                {t("duration", { minutes: treatment.durationMinutes })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
