import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { FounderStory } from "@/components/founder/founder-story";
import {
  FOUNDER,
  FOUNDER_IMAGES,
  OFFICIAL_SITE,
  OFFICIAL_YOUTUBE,
  type Loc,
} from "@/content/founder";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const PATH = "/jean-michel-karam";

export async function generateMetadata(): Promise<Metadata> {
  const loc = ((await getLocale()) === "ar" ? "ar" : "en") as Loc;
  const image = FOUNDER_IMAGES.banner;
  return {
    title: FOUNDER.metaTitle[loc],
    description: FOUNDER.metaDescription[loc],
    alternates: {
      canonical: `${baseUrl}/${loc}${PATH}`,
      languages: {
        en: `${baseUrl}/en${PATH}`,
        ar: `${baseUrl}/ar${PATH}`,
        "x-default": `${baseUrl}/en${PATH}`,
      },
    },
    openGraph: {
      type: "profile",
      title: FOUNDER.metaTitle[loc],
      description: FOUNDER.metaDescription[loc],
      url: `${baseUrl}/${loc}${PATH}`,
      siteName: "IOMA Paris Dubai",
      locale: loc === "ar" ? "ar_AE" : "en_AE",
      images: [{ url: `${baseUrl}${image}`, alt: FOUNDER.banner.alt[loc] }],
    },
  };
}

export default async function FounderPage() {
  const loc = ((await getLocale()) === "ar" ? "ar" : "en") as Loc;

  // Verified facts only (official IOMA Paris page): no dates beyond 2010, no awards or figures.
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: FOUNDER.name,
    jobTitle: "Founder of IOMA Paris",
    description: FOUNDER.metaDescription.en,
    url: `${baseUrl}/${loc}${PATH}`,
    image: `${baseUrl}${FOUNDER_IMAGES.portrait}`,
    worksFor: {
      "@type": "Organization",
      name: "IOMA Paris",
      url: "https://ioma-paris.com",
    },
    knowsAbout: ["Microelectronics", "MEMS", "Personalised skincare"],
    sameAs: [OFFICIAL_SITE, OFFICIAL_YOUTUBE],
  };

  return (
    <main className="overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }}
      />
      <FounderStory loc={loc} />
    </main>
  );
}
