import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/** Canonical + hreflang + Open Graph for a localized public page. `noindex` keeps unapproved drafts out of search. */
export async function pageMetadata(
  path: string,
  seo: { title: Record<"en" | "ar", string>; description: Record<"en" | "ar", string> },
  opts: { noindex?: boolean } = {},
): Promise<Metadata> {
  const loc = (await getLocale()) === "ar" ? "ar" : "en";
  const title = seo.title[loc];
  const description = seo.description[loc];
  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${loc}${path}`,
      languages: {
        en: `${baseUrl}/en${path}`,
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
      locale: loc === "ar" ? "ar_AE" : "en_AE",
    },
    ...(opts.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export async function currentLoc(): Promise<"en" | "ar"> {
  return (await getLocale()) === "ar" ? "ar" : "en";
}
