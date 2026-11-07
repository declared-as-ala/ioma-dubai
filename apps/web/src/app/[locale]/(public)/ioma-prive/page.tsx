import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { PrivePage } from "@/components/prive/prive-page";
import { PRIVE, PRIVE_IMAGES, type Loc } from "@/content/prive-official";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const PATH = "/ioma-prive";

export async function generateMetadata(): Promise<Metadata> {
  const loc = ((await getLocale()) === "ar" ? "ar" : "en") as Loc;
  const title = PRIVE.seo.title[loc];
  const description = PRIVE.seo.description[loc];
  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${loc}${PATH}`,
      languages: {
        en: `${baseUrl}/en${PATH}`,
        ar: `${baseUrl}/ar${PATH}`,
        "x-default": `${baseUrl}/en${PATH}`,
      },
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${baseUrl}/${loc}${PATH}`,
      siteName: "IOMA Paris Dubai",
      locale: loc === "ar" ? "ar_AE" : "en_AE",
      images: [{ url: `${baseUrl}${PRIVE_IMAGES.model}`, alt: PRIVE.hero.alt[loc] }],
    },
  };
}

export default async function IomaPrivePage() {
  const loc = ((await getLocale()) === "ar" ? "ar" : "en") as Loc;

  // Structured data from the official page only: the Paris address, the treatment menu with its listed prices, the FAQ.
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HealthAndBeautyBusiness",
        "@id": `${baseUrl}/${loc}${PATH}#cabin`,
        name: "IOMA Privé — La Maison DESSANGE",
        description: PRIVE.seo.description.en,
        url: `${baseUrl}/${loc}${PATH}`,
        telephone: PRIVE.dessange.phone,
        address: {
          "@type": "PostalAddress",
          streetAddress: "4, rue Marbeuf",
          postalCode: "75008",
          addressLocality: "Paris",
          addressCountry: "FR",
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "IOMA Privé treatment menu",
          itemListElement: PRIVE.menu.rituals.map((r) => ({
            "@type": "Offer",
            price: r.eur,
            priceCurrency: "EUR",
            itemOffered: { "@type": "Service", name: r.name.en, description: r.text.en },
          })),
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${baseUrl}/${loc}${PATH}#faq`,
        mainEntity: PRIVE.faq.items.map((f) => ({
          "@type": "Question",
          name: f.q.en,
          acceptedAnswer: { "@type": "Answer", text: f.a.en },
        })),
      },
    ],
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <PrivePage loc={loc} />
    </main>
  );
}
