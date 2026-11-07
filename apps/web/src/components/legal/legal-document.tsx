import { LEGAL_COMMON, type LegalDoc, type Loc } from "@/content/services";
import { PageHero } from "@/components/layout/page-hero";

/**
 * Readable legal layout: sticky table of contents (anchor links, no motion), numbered sections, and for every
 * section the list of information still needed. Static on purpose: legal text prioritises readability.
 */
export function LegalDocument({ doc, loc }: { doc: LegalDoc; loc: Loc }) {
  return (
    <main>
      <PageHero kicker={doc.kicker[loc]} title={doc.title[loc]} lede={doc.intro[loc]} />
      <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-12 lg:gap-20">
        <aside className="lg:col-span-4">
          <nav aria-label={LEGAL_COMMON.onThisPage[loc]} className="lg:sticky lg:top-40">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/60 rtl:tracking-normal">
              {LEGAL_COMMON.onThisPage[loc]}
            </p>
            <ol className="mt-5 space-y-1 border-s border-border">
              {doc.sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="-ms-px flex min-h-11 items-center border-s border-transparent ps-4 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                  >
                    {s.heading[loc]}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <div className="lg:col-span-8">
          <div
            role="note"
            className="rounded-[1.5rem] border border-sf-champagne/60 bg-white p-6 md:p-8"
          >
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60 rtl:tracking-normal">
                  {LEGAL_COMMON.statusLabel[loc]}
                </dt>
                <dd className="mt-1">{doc.status[loc]}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60 rtl:tracking-normal">
                  {LEGAL_COMMON.versionLabel[loc]}
                </dt>
                <dd className="mt-1" dir="ltr">
                  {doc.version}
                </dd>
              </div>
            </dl>
            <p className="mt-5 text-sm leading-relaxed text-foreground/80">
              {LEGAL_COMMON.banner[loc]}
            </p>
          </div>

          <div className="mt-14 space-y-16">
            {doc.sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-40">
                <h2 className="font-display text-2xl font-medium tracking-[-0.01em] md:text-3xl rtl:tracking-normal">
                  {s.heading[loc]}
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                  {s.text[loc]}
                </p>
                {s.missing.length ? (
                  <div className="mt-6 rounded-2xl bg-sf-ivory p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60 rtl:tracking-normal">
                      {LEGAL_COMMON.missingTitle[loc]}
                    </p>
                    <ul className="mt-3 space-y-2 text-sm leading-relaxed">
                      {s.missing.map((m) => (
                        <li key={m.en} className="flex gap-3">
                          <span
                            aria-hidden
                            className="mt-2 size-1.5 shrink-0 rounded-full bg-sf-champagne"
                          />
                          {m[loc]}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
