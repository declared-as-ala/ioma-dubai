import { Link } from "@/i18n/navigation";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import {
  Block,
  CardRow,
  FaqList,
  H2,
  Kicker,
  ServiceHero,
  StatusBanner,
  Steps,
} from "@/components/services/service-kit";
import { MaskText, Reveal } from "@/components/motion/cine";
import { COMMON, LOYALTY as P } from "@/content/services";
import { currentLoc, pageMetadata } from "@/lib/page-meta";

export const generateMetadata = () => pageMetadata("/loyalty", P.seo);

export default async function LoyaltyPage() {
  const loc = await currentLoc();
  return (
    <main>
      <ServiceHero
        kicker={P.hero.kicker[loc]}
        title={`${P.hero.title[loc]} — ${P.hero.line[loc]}`}
        image={P.hero.image}
        alt={P.hero.alt[loc]}
      >
        <Reveal>
          <div data-cine-item className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/register"
              className="inline-flex min-h-12 items-center rounded-full bg-sf-charcoal px-8 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-white transition-[background-color,color,transform] duration-200 ease-[var(--ease-out-strong)] hover:bg-sf-champagne hover:text-sf-charcoal active:scale-[0.97] rtl:tracking-normal"
            >
              {P.ctaAccount[loc]}
            </Link>
            <a
              href="#news"
              className="inline-flex min-h-12 items-center rounded-full border border-foreground/30 px-8 text-[0.72rem] font-semibold uppercase tracking-[0.2em] transition-colors hover:border-foreground hover:bg-white rtl:tracking-normal"
            >
              {P.ctaNews[loc]}
            </a>
          </div>
        </Reveal>
      </ServiceHero>

      <StatusBanner
        tone="pending"
        label={P.status.label[loc]}
        text={P.status.text[loc]}
      />

      <Block label={P.howTitle[loc]} tone="dark">
        <div className="mb-14 space-y-6 text-center">
          <div className="flex justify-center">
            <Kicker light>{COMMON.reference[loc]}</Kicker>
          </div>
          <MaskText
            as="h2"
            text={P.howTitle[loc]}
            className={`${H2} mx-auto max-w-3xl`}
          />
        </div>
        <Steps
          dark
          steps={P.steps.map((s) => ({ n: s.n, title: s.title[loc], text: s.text[loc] }))}
        />
      </Block>

      <Block label={P.benefitsTitle[loc]}>
        <MaskText
          as="h2"
          text={P.benefitsTitle[loc]}
          className={`${H2} mb-12 max-w-3xl`}
        />
        <CardRow
          items={P.benefits.map((b) => ({
            title: b.title[loc],
            text: b.text[loc],
            tag: COMMON.reference[loc],
          }))}
        />
      </Block>

      <Block label={P.undefinedTitle[loc]} tone="ivory">
        <div className="grid gap-12 lg:grid-cols-12">
          <MaskText
            as="h2"
            text={P.undefinedTitle[loc]}
            className={`${H2} lg:col-span-5`}
          />
          <Reveal
            as="ul"
            className="divide-y divide-border border-y border-border lg:col-span-7"
          >
            {P.undefined.map((u) => (
              <li
                key={u.en}
                data-cine-item
                className="flex items-center justify-between gap-6 py-6 text-base md:text-lg"
              >
                <span>{u[loc]}</span>
                <span className="shrink-0 rounded-full border border-sf-champagne/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-sf-champagne rtl:tracking-normal">
                  {COMMON.toConfirm[loc]}
                </span>
              </li>
            ))}
          </Reveal>
        </div>
      </Block>

      <FaqList
        title={COMMON.faq[loc]}
        items={P.faq.map((f) => ({ q: f.q[loc], a: f.a[loc] }))}
      />

      <section
        id="news"
        aria-label={P.ctaNews[loc]}
        className="scroll-mt-40 px-4 py-24 md:px-8 lg:py-32"
      >
        <div className="mx-auto max-w-xl text-center">
          <MaskText as="h2" text={P.ctaNews[loc]} className={H2} />
          <p className="mb-8 mt-6 text-muted-foreground">{P.newsText[loc]}</p>
          <NewsletterForm />
        </div>
      </section>
    </main>
  );
}
