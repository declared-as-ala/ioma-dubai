"use client";
import { useEffect } from "react";
import { useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Link, usePathname } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api";
import { SheetClose } from "@/components/ui/sheet";

export interface ManagedContentData {
  title: Record<string, string>;
  summary?: Record<string, string>;
  seoTitle?: Record<string, string>;
  seoDescription?: Record<string, string>;
  blocks: {
    type: string;
    heading: Record<string, string>;
    body: Record<string, string>;
    image?: string;
    url?: string;
  }[];
}
export function useManagedContent(kind: string, slug: string, enabled = true) {
  return useQuery({
    queryKey: ["content", kind, slug],
    queryFn: () => apiFetch<ManagedContentData | null>(`/content/${kind}/${slug}`),
    enabled,
    staleTime: 30000,
    retry: false,
  });
}
export function ManagedBlocks({ content }: { content: ManagedContentData }) {
  const locale = useLocale();
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 md:py-20">
      <h1 className="font-display text-4xl md:text-6xl">{content.title[locale]}</h1>
      {content.summary?.[locale] && (
        <p className="mt-5 max-w-3xl text-lg leading-8">{content.summary[locale]}</p>
      )}
      <div className="mt-10 space-y-10">
        {content.blocks.map((block, index) =>
          block.type === "faq" ? (
            <details className="border-b py-4" key={index}>
              <summary className="min-h-11 cursor-pointer text-lg">
                {block.heading[locale]}
              </summary>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7">
                {block.body[locale]}
              </p>
            </details>
          ) : (
            <section key={index} className="space-y-4">
              {block.heading[locale] && (
                <h2 className="font-display text-2xl">{block.heading[locale]}</h2>
              )}
              {block.image && (
                <img
                  src={block.image}
                  alt={block.heading[locale] ?? ""}
                  className="max-h-[600px] w-full object-contain"
                />
              )}
              {block.body[locale] && (
                <p className="whitespace-pre-wrap text-sm leading-8">
                  {block.body[locale]}
                </p>
              )}
              {block.url && (
                <Link
                  href={block.url}
                  className="inline-flex min-h-11 items-center underline"
                >
                  {block.heading[locale] || block.url}
                </Link>
              )}
            </section>
          ),
        )}
      </div>
    </div>
  );
}
export function ManagedPage({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const locale = useLocale();
  const targets: Record<string, [string, string]> = {
    "/": ["homepage", "home"],
    "/faq": ["faq", "faq"],
    "/contact": ["page", "contact"],
    "/about": ["page", "maison"],
    // Service and legal pages: an administrator can publish a CMS page with the same slug to replace the built-in design.
    "/loyalty": ["page", "loyalty"],
    "/shipping-returns": ["page", "shipping-returns"],
    "/secure-payment": ["page", "secure-payment"],
    "/careers": ["page", "careers"],
    "/terms": ["page", "terms"],
    "/legal-notice": ["page", "legal-notice"],
    "/privacy-policy": ["page", "privacy-policy"],
    "/cookie-policy": ["page", "cookie-policy"],
  };
  const target =
    targets[path] ??
    (path.startsWith("/journal/")
      ? ["journal", path.split("/")[2]!]
      : path.startsWith("/pages/")
        ? ["page", path.split("/")[2]!]
        : undefined);
  const q = useManagedContent(target?.[0] ?? "page", target?.[1] ?? "none", !!target);
  useEffect(() => {
    if (q.data?.seoTitle?.[locale]) document.title = q.data.seoTitle[locale];
  }, [q.data, locale]);
  return target && q.data ? <ManagedBlocks content={q.data} /> : children;
}
export function ManagedNavigation({
  children,
  mobile = false,
}: {
  children: React.ReactNode;
  mobile?: boolean;
}) {
  const q = useManagedContent("navigation", "main");
  const locale = useLocale();
  if (!q.data?.blocks.length) return children;
  return (
    <nav
      aria-label={q.data.title[locale]}
      className={
        mobile
          ? "flex flex-col gap-2"
          : "mx-auto hidden max-w-[1440px] flex-wrap items-center justify-center gap-x-6 px-4 py-2 xl:flex"
      }
    >
      {q.data.blocks
        .filter((block) => block.url)
        .map((block, i) =>
          mobile ? (
            <SheetClose key={i} asChild>
              <Link
                href={block.url!}
                className="inline-flex min-h-11 items-center text-xs uppercase tracking-wide"
              >
                {block.heading[locale]}
              </Link>
            </SheetClose>
          ) : (
            <Link
              key={i}
              href={block.url!}
              className="inline-flex min-h-11 items-center text-xs uppercase tracking-wide"
            >
              {block.heading[locale]}
            </Link>
          ),
        )}
    </nav>
  );
}
export function ManagedFooterLinks({ children }: { children: React.ReactNode }) {
  const q = useManagedContent("footer", "main");
  const locale = useLocale();
  if (!q.data?.blocks.length) return children;
  return (
    <div className="col-span-2 grid gap-6 md:col-span-4 md:grid-cols-4">
      {q.data.blocks.map((block, i) => (
        <div key={i}>
          <h3 className="text-xs uppercase tracking-widest">{block.heading[locale]}</h3>
          <p className="mt-3 text-sm leading-6">{block.body[locale]}</p>
          {block.url && (
            <Link
              href={block.url}
              className="inline-flex min-h-11 items-center text-sm underline"
            >
              {block.heading[locale]}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
