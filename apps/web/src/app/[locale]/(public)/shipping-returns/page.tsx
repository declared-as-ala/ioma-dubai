import { Link } from "@/i18n/navigation";
import {
  Block,
  CardRow,
  FaqList,
  H2,
  ServiceHero,
  StatusBanner,
  Steps,
} from "@/components/services/service-kit";
import { MaskText, Reveal } from "@/components/motion/cine";
import { COMMON, SHIPPING as P } from "@/content/services";
import { currentLoc, pageMetadata } from "@/lib/page-meta";

export const generateMetadata = () => pageMetadata("/shipping-returns", P.seo);

export default async function ShippingReturnsPage() {
  const loc = await currentLoc();
  return (
    <main>
      <ServiceHero
        kicker={P.hero.kicker[loc]}
        title={P.hero.title[loc]}
        lede={P.hero.lede[loc]}
        image={P.hero.image}
        alt={P.hero.alt[loc]}
      />
      <StatusBanner
        tone="pending"
        label={P.status.label[loc]}
        text={P.status.text[loc]}
      />

      <Block label={P.overviewTitle[loc]}>
        <MaskText
          as="h2"
          text={P.overviewTitle[loc]}
          className={`${H2} mb-12 max-w-3xl`}
        />
        <CardRow
          cols={4}
          items={P.overview.map((o) => ({
            title: o.title[loc],
            text: o.text[loc],
            tag: COMMON.pending[loc],
          }))}
        />
      </Block>

      <Block label={P.journeyTitle[loc]} tone="dark">
        <MaskText
          as="h2"
          text={P.journeyTitle[loc]}
          className={`${H2} mx-auto mb-16 max-w-3xl text-center`}
        />
        <Steps
          dark
          steps={P.journey.map((s) => ({
            n: s.n,
            title: s.title[loc],
            text: s.text[loc],
          }))}
        />
        <Reveal className="mt-16 text-center">
          <Link
            data-cine-item
            href="/contact"
            className="inline-flex min-h-12 items-center rounded-full bg-white px-8 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-sf-charcoal transition-[background-color,transform] duration-200 ease-[var(--ease-out-strong)] hover:bg-sf-champagne active:scale-[0.97] rtl:tracking-normal"
          >
            {COMMON.contactUs[loc]}
          </Link>
        </Reveal>
      </Block>

      <Block label={P.damagedTitle[loc]}>
        <div className="grid gap-10 lg:grid-cols-12">
          <MaskText
            as="h2"
            text={P.damagedTitle[loc]}
            className={`${H2} lg:col-span-6`}
          />
          <Reveal className="lg:col-span-6">
            <p
              data-cine-item
              className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              {P.damagedText[loc]}
            </p>
          </Reveal>
        </div>
      </Block>

      <FaqList
        title={COMMON.faq[loc]}
        items={P.faq.map((f) => ({ q: f.q[loc], a: f.a[loc] }))}
      />
    </main>
  );
}
