import { ServiceContactForm } from "@/components/forms/service-contact-form";
import { ServiceHero } from "@/components/services/service-kit";
import { Reveal } from "@/components/motion/cine";
import { CONTACT as P } from "@/content/services";
import { currentLoc, pageMetadata } from "@/lib/page-meta";

export const generateMetadata = () => pageMetadata("/contact", P.seo);

export default async function ContactPage() {
  const loc = await currentLoc();
  return (
    <main>
      <ServiceHero
        kicker={P.hero.kicker[loc]}
        title={P.hero.title[loc]}
        lede={P.hero.lede[loc]}
      />
      <div className="mx-auto grid max-w-[1440px] gap-14 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-7">
          <ServiceContactForm />
        </div>
        <Reveal as="aside" className="space-y-8 lg:col-span-5 lg:pt-4">
          <h2 data-cine-item className="font-display text-2xl font-medium">
            {P.sideTitle[loc]}
          </h2>
          <ul data-cine-item className="space-y-4">
            {P.side.map((s) => (
              <li
                key={s.en}
                className="flex gap-3 text-base leading-relaxed text-muted-foreground"
              >
                <span
                  aria-hidden
                  className="mt-2.5 size-1.5 shrink-0 rounded-full bg-sf-champagne"
                />
                {s[loc]}
              </li>
            ))}
          </ul>
          <p
            data-cine-item
            className="rounded-2xl bg-sf-ivory p-5 text-sm leading-relaxed text-muted-foreground"
          >
            {P.detailsNote[loc]}
          </p>
        </Reveal>
      </div>
    </main>
  );
}
