"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  acceptAll,
  onOpenConsentSettings,
  openConsentSettings,
  rejectOptional,
  saveConsent,
  useConsent,
} from "@/lib/consent";

type Loc = "en" | "ar";
const T = {
  bannerTitle: { en: "Your cookie choices", ar: "خياراتكم بشأن ملفات تعريف الارتباط" },
  bannerBody: {
    en: "We use necessary cookies to run the site. With your consent we would also use analytics and marketing cookies. You can change your choice at any time.",
    ar: "نستخدم ملفات تعريف الارتباط الضرورية لتشغيل الموقع. وبموافقتكم قد نستخدم أيضًا ملفات التحليلات والتسويق. يمكنكم تغيير اختياركم في أي وقت.",
  },
  acceptAll: { en: "Accept all", ar: "قبول الكل" },
  reject: { en: "Reject optional", ar: "رفض الاختيارية" },
  customise: { en: "Customise", ar: "تخصيص" },
  policy: { en: "Cookie policy", ar: "سياسة ملفات تعريف الارتباط" },
  title: { en: "Cookie preferences", ar: "تفضيلات ملفات تعريف الارتباط" },
  intro: {
    en: "Choose which optional cookies you allow. Necessary cookies cannot be switched off because the site needs them.",
    ar: "اختاروا ملفات تعريف الارتباط الاختيارية التي تسمحون بها. لا يمكن إيقاف الضرورية لأن الموقع يحتاجها.",
  },
  save: { en: "Save my choices", ar: "حفظ اختياراتي" },
  always: { en: "Always on", ar: "مفعّلة دائمًا" },
  necessary: { en: "Necessary", ar: "ضرورية" },
  necessaryText: {
    en: "Keep the site working: your basket, language, security and this consent choice.",
    ar: "تُبقي الموقع يعمل: سلتكم واللغة والأمان وخيار الموافقة هذا.",
  },
  analytics: { en: "Analytics", ar: "التحليلات" },
  analyticsText: {
    en: "Help us understand how the site is used, in aggregate, so we can improve it.",
    ar: "تساعدنا على فهم كيفية استخدام الموقع بشكل مجمّع لتحسينه.",
  },
  marketing: { en: "Marketing", ar: "التسويق" },
  marketingText: {
    en: "Allow us and partners to measure campaigns and show relevant offers.",
    ar: "تتيح لنا ولشركائنا قياس الحملات وعرض عروض مناسبة.",
  },
  none: {
    en: "No analytics or marketing tool is active on this site at the moment. Your choice is saved and will apply as soon as one is added.",
    ar: "لا توجد أدوات تحليلات أو تسويق مفعّلة على الموقع حاليًا. يُحفظ اختياركم وسيُطبَّق فور إضافة أي منها.",
  },
} as const;
const tx = (k: keyof typeof T, loc: Loc) => T[k][loc];

/** The three consent controls, reused by the dialog and by the cookie policy page. */
export function ConsentPreferencesPanel({ onDone }: { onDone?: () => void }) {
  const loc = (useLocale() === "ar" ? "ar" : "en") as Loc;
  const c = useConsent();
  const [analytics, setAnalytics] = useState(c.analytics);
  const [marketing, setMarketing] = useState(c.marketing);

  // Follow changes made elsewhere (banner buttons, another tab) while the panel is mounted.
  useEffect(() => {
    setAnalytics(c.analytics);
    setMarketing(c.marketing);
  }, [c.analytics, c.marketing]);

  const rows = [
    {
      id: "necessary",
      label: tx("necessary", loc),
      text: tx("necessaryText", loc),
      checked: true,
      disabled: true,
      set: () => undefined,
    },
    {
      id: "analytics",
      label: tx("analytics", loc),
      text: tx("analyticsText", loc),
      checked: analytics,
      disabled: false,
      set: setAnalytics,
    },
    {
      id: "marketing",
      label: tx("marketing", loc),
      text: tx("marketingText", loc),
      checked: marketing,
      disabled: false,
      set: setMarketing,
    },
  ];

  return (
    <div>
      <ul className="divide-y divide-border border-y border-border">
        {rows.map((r) => (
          <li key={r.id} className="flex items-start justify-between gap-6 py-5">
            <div>
              <label htmlFor={`consent-${r.id}`} className="font-display text-lg">
                {r.label}
              </label>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
                {r.text}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 pt-1">
              {r.disabled ? (
                <span className="text-xs text-muted-foreground">{tx("always", loc)}</span>
              ) : null}
              <Switch
                id={`consent-${r.id}`}
                checked={r.checked}
                disabled={r.disabled}
                onCheckedChange={(v) => r.set(v)}
                aria-label={r.label}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        {tx("none", loc)}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          className="h-11 rounded-full px-7 uppercase tracking-widest"
          onClick={() => {
            saveConsent({ analytics, marketing });
            onDone?.();
          }}
        >
          {tx("save", loc)}
        </Button>
        <Button
          variant="outline"
          className="h-11 rounded-full px-7 uppercase tracking-widest"
          onClick={() => {
            acceptAll();
            onDone?.();
          }}
        >
          {tx("acceptAll", loc)}
        </Button>
        <Button
          variant="outline"
          className="h-11 rounded-full px-7 uppercase tracking-widest"
          onClick={() => {
            rejectOptional();
            onDone?.();
          }}
        >
          {tx("reject", loc)}
        </Button>
      </div>
    </div>
  );
}

/** Mounted once in the locale layout: first-visit banner + preferences dialog that the footer can reopen. */
export function ConsentManager() {
  const loc = (useLocale() === "ar" ? "ar" : "en") as Loc;
  const c = useConsent();
  const [open, setOpen] = useState(false);

  useEffect(() => onOpenConsentSettings(() => setOpen(true)), []);

  const showBanner = c.ready && !c.decided && !open;

  return (
    <>
      {showBanner ? (
        <div
          role="region"
          aria-label={tx("bannerTitle", loc)}
          className="consent-banner fixed inset-x-3 bottom-3 z-[9990] mx-auto max-w-3xl rounded-[1.5rem] bg-sf-charcoal p-5 text-white shadow-lg md:bottom-6 md:p-6 max-md:bottom-[4.5rem]"
        >
          <p className="font-display text-lg">{tx("bannerTitle", loc)}</p>
          <p className="mt-2 text-sm leading-relaxed text-white/75">
            {tx("bannerBody", loc)}{" "}
            <Link
              href="/cookie-policy"
              className="underline underline-offset-4 hover:text-white"
            >
              {tx("policy", loc)}
            </Link>
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              className="h-11 rounded-full bg-white px-6 text-xs uppercase tracking-widest text-sf-charcoal hover:bg-sf-champagne"
              onClick={acceptAll}
            >
              {tx("acceptAll", loc)}
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-full border-white/40 bg-transparent px-6 text-xs uppercase tracking-widest text-white hover:bg-white/10 hover:text-white"
              onClick={rejectOptional}
            >
              {tx("reject", loc)}
            </Button>
            <Button
              variant="ghost"
              className="h-11 rounded-full px-6 text-xs uppercase tracking-widest text-white hover:bg-white/10 hover:text-white"
              onClick={openConsentSettings}
            >
              {tx("customise", loc)}
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
          <DialogTitle className="font-display text-2xl">{tx("title", loc)}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {tx("intro", loc)}
          </DialogDescription>
          <ConsentPreferencesPanel onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
