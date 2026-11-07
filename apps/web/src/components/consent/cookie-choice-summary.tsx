"use client";

import { useConsent } from "@/lib/consent";

/** Live read-out of the saved choice on the cookie page (updates the moment a button is pressed). */
export function CookieChoiceSummary({
  labels,
}: {
  labels: {
    title: string;
    none: string;
    analytics: string;
    marketing: string;
    on: string;
    off: string;
  };
}) {
  const c = useConsent();
  return (
    <div role="status" aria-live="polite" className="rounded-2xl bg-sf-ivory p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60 rtl:tracking-normal">
        {labels.title}
      </p>
      <p className="mt-2 text-base">
        {!c.ready || !c.decided
          ? labels.none
          : `${labels.analytics}: ${c.analytics ? labels.on : labels.off} · ${labels.marketing}: ${c.marketing ? labels.on : labels.off}`}
      </p>
    </div>
  );
}
