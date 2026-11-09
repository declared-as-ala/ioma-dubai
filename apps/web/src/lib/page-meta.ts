import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { toLoc, type Loc } from "@/lib/l10n";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/** Canonical + hreflang + Open Graph for a localized public page. `noindex` keeps unapproved drafts out of search. */
export async function pageMetadata(
  path: string,
  seo: { title: Record<Loc, string>; description: Record<Loc, string> },
  opts: { noindex?: boolean } = {},
): Promise<Metadata> {
  const loc = toLoc(await getLocale());
  const title = seo.title[loc];
  const description = seo.description[loc];
  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${loc}${path}`,
      languages: {
        en: `${baseUrl}/en${path}`,
        fr: `${baseUrl}/fr${path}`,
        ar: `${baseUrl}/ar${path}`,
        "x-default": `${baseUrl}/en${path}`,
      },
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${baseUrl}/${loc}${path}`,
      siteName: "IOMA Paris Dubai",
      locale: loc === "ar" ? "ar_AE" : loc === "fr" ? "fr_FR" : "en_AE",
    },
    ...(opts.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export async function currentLoc(): Promise<Loc> {
  return toLoc(await getLocale());
}
