import { ArrowUpRight } from "lucide-react";
import { Block, CardRow, H2, ServiceHero } from "@/components/services/service-kit";
import { MaskText, Reveal } from "@/components/motion/cine";
import { CAREERS as P, CAREERS_URL } from "@/content/services";
import { currentLoc, pageMetadata } from "@/lib/page-meta";

export const generateMetadata = () => pageMetadata("/careers", P.seo);

export default async function CareersPage() {
  const loc = await currentLoc();
  return (
    <main>
      <ServiceHero
        kicker={P.hero.kicker[loc]}
        title={P.hero.title[loc]}
        lede={P.hero.lede[loc]}
        image={P.hero.image}
        alt={P.hero.alt[loc]}
      >
        <Reveal>
          <div data-cine-item className="pt-2">
            <a
              href={CAREERS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-sf-charcoal px-8 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-white transition-[background-color,color,transform] duration-200 ease-[var(--ease-out-strong)] hover:bg-sf-champagne hover:text-sf-charcoal active:scale-[0.97] rtl:tracking-normal"
            >
              {P.hero.cta[loc]}
              <span className="sr-only">({P.hero.external[loc]})</span>
              <ArrowUpRight
                className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100"
                aria-hidden
              />
            </a>
          </div>
        </Reveal>
      </ServiceHero>

      <Block label={P.groupTitle[loc]}>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-24">
          <MaskText as="h2" text={P.groupTitle[loc]} className={`${H2} lg:col-span-5`} />
          <Reveal className="space-y-10 lg:col-span-7">
            <p
              data-cine-item
              className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              {P.groupText[loc]}
            </p>
            <div data-cine-item>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/60 rtl:tracking-normal">
                {P.brandsTitle[loc]}
              </p>
              <ul className="mt-5 flex flex-wrap gap-3" dir="ltr">
                {P.brands.map((b) => (
                  <li
                    key={b}
                    className="rounded-full border border-border px-5 py-2 text-sm"
                  >
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Block>

      <Block label={P.valuesTitle[loc]} tone="ivory">
        <MaskText as="h2" text={P.valuesTitle[loc]} className={`${H2} mb-12 max-w-3xl`} />
        <CardRow
          items={P.values.map((v) => ({ title: v.title[loc], text: v.text[loc] }))}
        />
      </Block>

      <Block label={P.hero.cta[loc]} tone="dark">
        <div className="mx-auto max-w-2xl space-y-8 text-center">
          <MaskText as="h2" text={P.hero.cta[loc]} className={H2} />
          <p className="text-white/70">{P.note[loc]}</p>
          <a
            href={CAREERS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-white px-8 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-sf-charcoal transition-[background-color,transform] duration-200 ease-[var(--ease-out-strong)] hover:bg-sf-champagne active:scale-[0.97] rtl:tracking-normal"
          >
            {P.hero.cta[loc]}
            <span className="sr-only">({P.hero.external[loc]})</span>
            <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
          </a>
        </div>
      </Block>
    </main>
  );
}
