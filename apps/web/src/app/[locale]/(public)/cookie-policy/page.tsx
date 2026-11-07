import { PageHero } from "@/components/layout/page-hero";
import { ConsentPreferencesPanel } from "@/components/consent/consent-manager";
import { CookieChoiceSummary } from "@/components/consent/cookie-choice-summary";
import { COOKIES as P } from "@/content/services";
import { currentLoc, pageMetadata } from "@/lib/page-meta";

export const generateMetadata = () => pageMetadata("/cookie-policy", P.seo);

export default async function CookiePolicyPage() {
  const loc = await currentLoc();
  return (
    <main>
      <PageHero kicker={P.kicker[loc]} title={P.title[loc]} lede={P.lede[loc]} />
      <div className="mx-auto grid max-w-[1440px] gap-16 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-12 lg:gap-24">
        <section aria-label={P.title[loc]} className="lg:col-span-7">
          <CookieChoiceSummary
            labels={{
              title: P.your[loc],
              none: P.none[loc],
              analytics: P.categories[1]!.title[loc],
              marketing: P.categories[2]!.title[loc],
              on: P.on[loc],
              off: P.off[loc],
            }}
          />
          <div className="mt-8">
            <ConsentPreferencesPanel />
          </div>
        </section>
        <div className="space-y-12 lg:col-span-5">
          <section aria-label={P.categoriesTitle[loc]}>
            <h2 className="font-display text-2xl font-medium">
              {P.categoriesTitle[loc]}
            </h2>
            <dl className="mt-6 space-y-6">
              {P.categories.map((c) => (
                <div key={c.title.en}>
                  <dt className="font-display text-lg">{c.title[loc]}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {c.text[loc]}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <section aria-label={P.lifetimeTitle[loc]}>
            <h2 className="font-display text-2xl font-medium">{P.lifetimeTitle[loc]}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {P.lifetime[loc]}
            </p>
          </section>
          <section aria-label={P.browserTitle[loc]}>
            <h2 className="font-display text-2xl font-medium">{P.browserTitle[loc]}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {P.browser[loc]}
            </p>
          </section>
          <section
            aria-label={P.statusTitle[loc]}
            className="rounded-2xl bg-sf-ivory p-6"
          >
            <h2 className="font-display text-xl font-medium">{P.statusTitle[loc]}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {P.statusText[loc]}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
