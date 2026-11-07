import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const locales = ["en", "ar"] as const;

const publicRoutes = [
  "",
  "/about",
  "/jean-michel-karam",
  "/ioma-prive",
  "/technology",
  "/shop",
  "/treatments",
  "/partners",
  "/journal",
  "/professionals",
  "/loyalty",
  "/contact",
  "/shipping-returns",
  "/secure-payment",
  "/careers",
  "/privacy-policy",
  "/cookie-policy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const route of publicRoutes) {
    for (const locale of locales) {
      const url = `${baseUrl}/${locale}${route}`;

      const languages: Record<string, string> = {};
      for (const altLocale of locales) {
        languages[altLocale] = `${baseUrl}/${altLocale}${route}`;
      }
      languages["x-default"] = `${baseUrl}/en${route}`;

      entries.push({
        url,
        lastModified: new Date(),
        changeFrequency: route === "" ? "daily" : "weekly",
        priority: route === "" ? 1.0 : 0.8,
        alternates: {
          languages,
        },
      });
    }
  }

  return entries;
}
