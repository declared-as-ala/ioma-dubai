import type { ReactNode } from "react";
import { PageHero } from "@/components/layout/page-hero";
import type { PolicySection } from "@/content/privacy-official";

type Loc = "en" | "ar";

const ANCHORS: Record<string, string> = { "#who": "#s-1", "#rights": "#s-7" };

/** Renders text that carries {{url|label}} links. Empty links are dropped to their label. */
function Rich({ text }: { text: string }): ReactNode {
  const parts = text.split(/(\{\{[^}]*\}\})/g);
  return parts.map((part, i) => {
    const m = /^\{\{([^|]*)\|([^}]*)\}\}$/.exec(part);
    if (!m) return part;
    const [, rawHref = "", label = ""] = m;
    if (!rawHref) return label;
    const href = ANCHORS[rawHref] ?? rawHref;
    const external = /^https?:/.test(href);
    return (
      <a
        key={i}
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="font-medium text-sf-mauve underline underline-offset-4 hover:no-underline"
      >
        {label}
        {external ? <span className="sr-only"> ({OPENS_NEW_TAB})</span> : null}
      </a>
    );
  });
}

const OPENS_NEW_TAB = "opens in a new tab";

const UI = {
  toc: { en: "On this page", ar: "في هذه الصفحة" },
} as const;

function Sections({
  sections,
  lang,
  dir,
}: {
  sections: PolicySection[];
  lang: string;
  dir: "ltr" | "rtl";
}) {
  return (
    <div lang={lang} dir={dir} className="space-y-14 text-start">
      {sections.map((s) => (
        <section
          key={s.id}
          id={lang === "fr" ? `fr-${s.id}` : s.id}
          className="scroll-mt-40"
        >
          {s.level === 1 ? (
            <h2 className="font-display text-2xl font-medium tracking-[-0.01em] md:text-3xl rtl:tracking-normal">
              {s.heading}
            </h2>
          ) : (
            <h3 className="font-display text-xl font-medium tracking-[-0.01em] rtl:tracking-normal">
              {s.heading}
            </h3>
          )}
          <div className="mt-4 max-w-2xl space-y-4 text-base leading-relaxed text-muted-foreground rtl:leading-loose">
            {s.blocks.map((b, i) =>
              b.t === "ul" ? (
                <ul key={i} className="space-y-2">
                  {b.x.map((item, j) => (
                    <li key={j} className="flex gap-3">
                      <span
                        aria-hidden
                        className="mt-2.5 size-1.5 shrink-0 rounded-full bg-sf-mauve"
                      />
                      <span>
                        <Rich text={item} />
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p key={i}>
                  <Rich text={b.x} />
                </p>
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

/**
 * Official policy document: sticky table of contents (top-level sections), numbered sections, notice about the
 * language of the text. The policy body is rendered verbatim and left-to-right in French.
 */
export function OfficialPolicy({
  loc,
  kicker,
  title,
  lede,
  sections,
}: {
  loc: Loc;
  kicker: string;
  title: string;
  lede: string;
  sections: PolicySection[];
}) {
  const toc = sections.filter((s) => s.level === 1);
  return (
    <main>
      <PageHero kicker={kicker} title={title} lede={lede} />
      <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-12 lg:gap-20">
        <aside className="lg:col-span-4">
          <nav aria-label={UI.toc[loc]} className="lg:sticky lg:top-40">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/60 rtl:tracking-normal">
              {UI.toc[loc]}
            </p>
            <ol className="mt-5 space-y-1 border-s border-border">
              {toc.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="-ms-px flex min-h-11 items-center border-s border-transparent ps-4 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                  >
                    {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <div className="lg:col-span-8">
          <div>
            <Sections sections={sections} lang={loc} dir={loc === "ar" ? "rtl" : "ltr"} />
          </div>
        </div>
      </div>
    </main>
  );
}
