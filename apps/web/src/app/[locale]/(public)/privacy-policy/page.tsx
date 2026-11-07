import type { Metadata } from "next";
import { useLocale, useTranslations } from "next-intl";
import { OfficialPolicy } from "@/components/legal/official-policy";
import {
  PRIVACY_OFFICIAL,
  type PolicySection,
  type PolicyTranslation,
} from "@/content/privacy-official";
import { PRIVACY_EN } from "@/content/privacy-en";
import { PRIVACY_AR } from "@/content/privacy-ar";

export const metadata: Metadata = {
  title: "Privacy Policy | IOMA Paris Dubai",
  description:
    "How IOMA Paris collects, uses, shares and protects your personal data, and the rights you have over it.",
};

const COPY = {
  en: {
    lede: "How we collect, use, share and protect your personal data, and the rights you have over it.",
  },
  ar: {
    lede: "كيف نجمع بياناتكم الشخصية ونستخدمها ونشاركها ونحميها، وما هي حقوقكم بشأنها.",
  },
} as const;

/** Rebuilds the French section list with the translated headings and blocks, id for id. */
function translate(tr: PolicyTranslation): PolicySection[] {
  return PRIVACY_OFFICIAL.map((s) => {
    const t = tr[s.id];
    if (!t) return s;
    return {
      id: s.id,
      level: s.level,
      heading: t.heading,
      blocks: t.blocks.map((b) =>
        Array.isArray(b) ? { t: "ul" as const, x: b } : { t: "p" as const, x: b },
      ),
    };
  });
}

const EN_SECTIONS = translate(PRIVACY_EN);
const AR_SECTIONS = translate(PRIVACY_AR);

export default function PrivacyPolicyPage() {
  const loc = useLocale() === "ar" ? "ar" : "en";
  const t = useTranslations("Legal");
  const c = COPY[loc];

  return (
    <OfficialPolicy
      loc={loc}
      kicker={t("privacy.kicker")}
      title={t("privacy.title")}
      lede={c.lede}
      sections={loc === "ar" ? AR_SECTIONS : EN_SECTIONS}
    />
  );
}
