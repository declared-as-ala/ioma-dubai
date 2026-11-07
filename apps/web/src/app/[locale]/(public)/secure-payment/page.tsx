import { Link } from "@/i18n/navigation";
import {
  Block,
  CardRow,
  H2,
  ServiceHero,
  StatusBanner,
  Steps,
} from "@/components/services/service-kit";
import { MaskText, Reveal } from "@/components/motion/cine";
import { PAYMENT as P } from "@/content/services";
import { currentLoc, pageMetadata } from "@/lib/page-meta";

export const generateMetadata = () => pageMetadata("/secure-payment", P.seo);

export default async function SecurePaymentPage() {
  const loc = await currentLoc();
  return (
    <main>
      <ServiceHero
        kicker={P.hero.kicker[loc]}
        title={P.hero.title[loc]}
        lede={P.hero.lede[loc]}
      />
      <StatusBanner
        tone="pending"
        label={P.status.label[loc]}
        text={P.status.text[loc]}
      />

      <Block label={P.principlesTitle[loc]}>
        <MaskText
          as="h2"
          text={P.principlesTitle[loc]}
          className={`${H2} mb-12 max-w-3xl`}
        />
        <CardRow
          cols={2}
          items={P.principles.map((p) => ({ title: p.title[loc], text: p.text[loc] }))}
        />
      </Block>

      <Block label={P.flowTitle[loc]} tone="dark">
        <MaskText
          as="h2"
          text={P.flowTitle[loc]}
          className={`${H2} mx-auto mb-16 max-w-3xl text-center`}
        />
        <Steps
          dark
          steps={P.flow.map((s) => ({ n: s.n, title: s.title[loc], text: s.text[loc] }))}
        />
      </Block>

      <Block label={P.methodsTitle[loc]} tone="ivory">
        <div className="grid gap-10 lg:grid-cols-12">
          <MaskText
            as="h2"
            text={P.methodsTitle[loc]}
            className={`${H2} lg:col-span-5`}
          />
          <Reveal className="space-y-8 lg:col-span-7">
            <p
              data-cine-item
              className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              {P.methodsText[loc]}
            </p>
            <div data-cine-item>
              <Link
                href="/contact"
                className="inline-flex min-h-12 items-center rounded-full bg-sf-charcoal px-8 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-white transition-[background-color,color,transform] duration-200 ease-[var(--ease-out-strong)] hover:bg-sf-champagne hover:text-sf-charcoal active:scale-[0.97] rtl:tracking-normal"
              >
                {P.cta[loc]}
              </Link>
            </div>
          </Reveal>
        </div>
      </Block>
    </main>
  );
}
