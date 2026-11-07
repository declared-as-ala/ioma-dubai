import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { Link } from "@/i18n/navigation";

export default function FaqPage() {
  const t = useTranslations("FaqPage");

  const questions = [1, 2, 3, 4, 5] as const;

  return (
    <main>
      <PageHero kicker={t("kicker")} title={t("title")} />
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
        <Accordion type="single" collapsible>
          {questions.map((n) => (
            <AccordionItem key={n} value={`q${n}`}>
              <AccordionTrigger className="py-6 text-start font-display text-xl">
                {t(`q${n}Title`)}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t(`q${n}Body`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 text-center">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="uppercase tracking-widest"
          >
            <Link href="/contact">{t("contactCta")}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
