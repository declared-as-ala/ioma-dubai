"use client";

import { useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { IomaLogo } from "@/components/brand/ioma-logo";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ManagedFooterLinks } from "@/components/content/managed-content";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CINE, gsap, useMotion } from "@/components/motion/cine";
import { openConsentSettings } from "@/lib/consent";

type Loc = "en" | "ar";
type L = Record<Loc, string>;
const l = (en: string, ar: string): L => ({ en, ar });

type Item = { href: string; label: L } | { action: "cookies"; label: L };

// Footer map. Links point at real pages only. Social accounts are IOMA Paris's official ones, taken from the
// official site; confirm with the client that they are the accounts to promote for Dubai.
const GROUPS: { title: L; items: Item[] }[] = [
  {
    title: l("IOMA Paris", "آيوما باريس"),
    items: [
      { href: "/about", label: l("About IOMA", "عن آيوما") },
      { href: "/jean-michel-karam", label: l("Jean Michel Karam", "جان ميشال كرم") },
      { href: "/ioma-prive", label: l("IOMA Privé", "آيوما بريفيه") },
      { href: "/magazine", label: l("Magazine", "المجلة") },
      { href: "/technology", label: l("Technology", "التقنية") },
      { href: "/partners", label: l("Our partners", "شركاؤنا") },
    ],
  },
  {
    title: l("Services", "الخدمات"),
    items: [
      { href: "/loyalty", label: l("Loyalty programme", "برنامج الولاء") },
      { href: "/contact", label: l("Contact", "تواصلوا معنا") },
      {
        href: "/shipping-returns",
        label: l("Shipping, returns & refunds", "الشحن والإرجاع والاسترداد"),
      },
      { href: "/secure-payment", label: l("Secure payment", "الدفع الآمن") },
      { href: "/careers", label: l("Careers", "الوظائف") },
    ],
  },
  {
    title: l("Professionals", "المهنيون"),
    items: [
      { href: "/professionals/apply", label: l("Become a partner", "كونوا شركاء") },
      { href: "/professionals", label: l("Professional space", "المساحة المهنية") },
      { href: "/portal/catalog", label: l("Professional products", "المنتجات المهنية") },
    ],
  },
  {
    title: l("Legal", "قانوني"),
    items: [
      { href: "/terms", label: l("Terms & conditions", "الشروط والأحكام") },
      { href: "/legal-notice", label: l("Legal notice", "إشعار قانوني") },
      { href: "/privacy-policy", label: l("Privacy policy", "سياسة الخصوصية") },
      { action: "cookies", label: l("Cookie settings", "إعدادات ملفات تعريف الارتباط") },
    ],
  },
];

const SOCIAL = [
  { href: "https://www.instagram.com/ioma.paris/", label: "Instagram" },
  { href: "https://www.facebook.com/IOMAParisFrance/", label: "Facebook" },
  { href: "https://www.youtube.com/c/IOMAPARIS", label: "YouTube" },
  { href: "https://www.tiktok.com/@iomaparis", label: "TikTok" },
];

const COPY = {
  claim: l(
    "IOMA Paris, N°1 de la cosmétique personnalisée*",
    "IOMA Paris, N°1 de la cosmétique personnalisée*",
  ),
  statement: l(
    "Combining advanced technology and bespoke formulations, IOMA Paris care answers the unique needs of your skin.",
    "تجمع عناية آيوما باريس بين التقنية المتقدمة والتركيبات المخصّصة لتلبية الاحتياجات الفريدة لبشرتكِ.",
  ),
  follow: l("Follow IOMA Paris", "تابعوا آيوما باريس"),
  external: l("opens in a new tab", "يفتح في نافذة جديدة"),
  faq: l("FAQ", "الأسئلة الشائعة"),
  accessibility: l("Accessibility", "إمكانية الوصول"),
};

const linkClass =
  "ioma-flink relative inline-flex items-center text-sm text-foreground/75 transition-colors duration-200 hover:text-sf-mauve focus-visible:text-sf-mauve min-h-11 md:min-h-9 xl:min-h-7";

function FooterLink({ item, loc }: { item: Item; loc: Loc }) {
  if ("action" in item) {
    return (
      <button
        type="button"
        onClick={openConsentSettings}
        className={`${linkClass} text-start`}
      >
        {item.label[loc]}
      </button>
    );
  }
  return (
    <Link href={item.href} className={linkClass}>
      {item.label[loc]}
    </Link>
  );
}

export function Footer() {
  const t = useTranslations("Footer");
  const loc = (useLocale() === "ar" ? "ar" : "en") as Loc;
  const ref = useRef<HTMLElement>(null);

  // Scroll-triggered reveal: columns rise in a short stagger, links follow, the logo settles in. Reduced motion: none.
  useMotion(ref, () => {
    const root = ref.current!;
    const trigger = { trigger: root, start: "top 82%", once: true } as const;
    gsap.fromTo(
      root.querySelectorAll("[data-ft=band]"),
      { autoAlpha: 0, y: 28 },
      { autoAlpha: 1, y: 0, duration: 1, ease: CINE.out, scrollTrigger: trigger },
    );
    gsap.fromTo(
      root.querySelectorAll("[data-ft=col]"),
      { autoAlpha: 0, y: 26 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        ease: CINE.out,
        stagger: 0.09,
        delay: 0.15,
        scrollTrigger: trigger,
      },
    );
    gsap.fromTo(
      root.querySelectorAll("[data-ft=col] li"),
      { autoAlpha: 0, y: 10 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        ease: CINE.out,
        stagger: 0.03,
        delay: 0.35,
        scrollTrigger: trigger,
      },
    );
    gsap.fromTo(
      root.querySelector("[data-ft=logo]"),
      { autoAlpha: 0, scale: 0.94, y: 14 },
      {
        autoAlpha: 1,
        scale: 1,
        y: 0,
        duration: 1.3,
        ease: CINE.out,
        scrollTrigger: {
          trigger: root.querySelector("[data-ft=logo]"),
          start: "top 95%",
          once: true,
        },
      },
    );
  });

  const columns = GROUPS.map((g) => (
    <div key={g.title.en} data-ft="col">
      <h3 className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-sf-mauve rtl:tracking-normal">
        {g.title[loc]}
      </h3>
      <ul className="mt-3 space-y-0">
        {g.items.map((it) => (
          <li key={it.label.en}>
            <FooterLink item={it} loc={loc} />
          </li>
        ))}
      </ul>
    </div>
  ));

  return (
    <footer
      ref={ref}
      aria-label="IOMA Paris"
      style={{ backgroundColor: "#f3f0f8" }}
      className="relative z-10 -mt-8 rounded-t-[2rem] border-t border-sf-mauve/15 bg-[#f3f0f8] text-foreground [&_input]:border-sf-mauve/30 [&_input]:bg-white [&_input]:text-foreground [&_input]:placeholder:text-foreground/50 [&_button[type=submit]]:bg-sf-mauve [&_button[type=submit]]:text-white"
    >
      {/* Newsletter: one compact line */}
      <div className="border-b border-sf-mauve/15">
        <div
          data-ft="band"
          className="mx-auto flex max-w-[1440px] flex-col justify-between gap-5 px-4 py-8 md:flex-row md:items-center md:px-8"
        >
          <div className="max-w-md">
            <h2 className="font-display text-[clamp(1.35rem,2.2vw,1.8rem)] font-medium tracking-[-0.01em] rtl:tracking-normal">
              {t("newsletterTitle")}
            </h2>
            <p className="mt-1 text-sm text-foreground/65">{t("newsletterBody")}</p>
          </div>
          <div className="w-full max-w-md">
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* Brand + link groups side by side (accordion on phones) */}
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-10 md:px-8 lg:grid-cols-12 lg:gap-12">
        <div className="space-y-5 lg:col-span-4">
          <div data-ft="logo" className="w-40 md:w-44">
            <IomaLogo withClaim variant="black" />
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-foreground/65">
            {COPY.statement[loc]}
          </p>
          <ul className="flex flex-wrap gap-x-5" dir="ltr" aria-label={COPY.follow[loc]}>
            {SOCIAL.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${linkClass} gap-1`}
                >
                  {s.label}
                  <ArrowUpRight className="size-3.5" aria-hidden />
                  <span className="sr-only">({COPY.external[loc]})</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-8">
          <ManagedFooterLinks>
            <div className="hidden gap-8 md:grid md:grid-cols-4">{columns}</div>
            <Accordion type="single" collapsible className="md:hidden">
              {GROUPS.map((g) => (
                <AccordionItem
                  key={g.title.en}
                  value={g.title.en}
                  className="border-sf-mauve/15"
                >
                  <AccordionTrigger className="py-4 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-sf-mauve hover:no-underline rtl:tracking-normal">
                    {g.title[loc]}
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="pb-2">
                      {g.items.map((it) => (
                        <li key={it.label.en}>
                          <FooterLink item={it} loc={loc} />
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ManagedFooterLinks>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-sf-mauve/15">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-5 text-xs text-foreground/60 md:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p>{t("copyright", { year: new Date().getFullYear() })}</p>
            <p className="max-w-2xl leading-relaxed">{t("claimFootnote")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <p className="uppercase tracking-[0.16em] rtl:tracking-normal">
              {t("region")} — {t("currency")}
            </p>
            <div className="[&_button]:border-sf-mauve/35 [&_button]:bg-white [&_button]:text-foreground">
              <LocaleSwitcher />
            </div>
            <Link href="/faq" className={linkClass}>
              {COPY.faq[loc]}
            </Link>
            <Link href="/accessibility-statement" className={linkClass}>
              {COPY.accessibility[loc]}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
