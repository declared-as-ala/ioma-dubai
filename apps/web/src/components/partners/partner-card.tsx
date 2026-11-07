"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight, MapPin, Navigation, Phone } from "lucide-react";
import type { PartnerListItem } from "@ioma/types";
import { EMIRATES } from "@ioma/config";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface PartnerCardProps {
  partner: PartnerListItem;
  isSelected: boolean;
  onSelect: (partner: PartnerListItem) => void;
}

const formatDistance = (meters: number | null) => {
  if (meters === null) return null;
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

export function PartnerCard({ partner, isSelected, onSelect }: PartnerCardProps) {
  const t = useTranslations("Partners");
  const locale = useLocale() as "en" | "ar";
  const emirate = EMIRATES.find((e) => e.code === partner.emirate);
  const emirateName = emirate
    ? (emirate.name[locale] ?? emirate.name.en)
    : partner.emirate;
  const typeLabel = t.has(`typeLabels.${partner.type}`)
    ? t(`typeLabels.${partner.type}`)
    : partner.type;
  const distance = formatDistance(partner.distanceMeters);
  const visibleServices = partner.services.slice(0, 3);
  const extraServices = partner.services.length - visibleServices.length;
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${partner.coordinates.lat},${partner.coordinates.lng}`;

  return (
    <article
      onClick={() => onSelect(partner)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(partner);
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${partner.name} — ${partner.city}`}
      className={cn(
        "group relative cursor-pointer rounded-xl border bg-background p-5 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sf-champagne focus-visible:ring-offset-2",
        isSelected
          ? "border-foreground shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
          : "border-border hover:border-foreground/40 hover:shadow-[0_6px_24px_rgba(0,0,0,0.05)]",
      )}
    >
      {/* Selected accent */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-4 start-0 w-[3px] rounded-full bg-sf-champagne transition-opacity",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-50",
        )}
      />

      <div className="flex items-start gap-4">
        <div
          aria-hidden
          className="grid size-12 shrink-0 place-items-center rounded-lg bg-foreground font-display text-base text-background"
        >
          {initials(partner.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-sf-champagne">
                {typeLabel}
              </p>
              <h3 className="mt-0.5 font-display text-lg leading-snug text-foreground">
                {partner.name}
              </h3>
            </div>
            {distance && (
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[0.7rem] font-medium tabular-nums text-foreground">
                {distance}
              </span>
            )}
          </div>

          <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              {partner.city}, {emirateName}
              {partner.address ? (
                <span className="block text-xs">{partner.address}</span>
              ) : null}
            </span>
          </p>

          {visibleServices.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Services">
              {visibleServices.map((s) => (
                <li
                  key={s.slug}
                  className="rounded-full border border-border px-2.5 py-0.5 text-[0.7rem] text-muted-foreground"
                >
                  {s.name[locale] ?? s.name.en}
                </li>
              ))}
              {extraServices > 0 && (
                <li className="rounded-full px-1.5 py-0.5 text-[0.7rem] text-muted-foreground">
                  {t("moreServices", { count: extraServices })}
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <Link
          href={`/partners/${partner.slug}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold uppercase tracking-wider text-foreground underline-offset-4 hover:underline"
        >
          {t("viewDetails")}
          <ArrowUpRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
        </Link>

        <div className="flex items-center gap-1.5">
          <a
            href={directionsHref}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label={t("directions")}
            title={t("directions")}
            className="grid size-11 place-items-center rounded-full border border-border text-foreground transition-colors hover:bg-muted"
          >
            <Navigation className="size-4" aria-hidden />
          </a>
          {partner.phone && (
            <a
              href={`tel:${partner.phone.replace(/\s+/g, "")}`}
              onClick={(e) => e.stopPropagation()}
              aria-label={`${t("call")} ${partner.name}`}
              title={t("call")}
              className="grid size-11 place-items-center rounded-full border border-border text-foreground transition-colors hover:bg-muted"
            >
              <Phone className="size-4" aria-hidden />
            </a>
          )}
          <Link
            href={`/partners/${partner.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex min-h-11 items-center rounded-full bg-foreground px-5 text-xs font-semibold uppercase tracking-wider text-background transition-colors hover:bg-foreground/85"
          >
            {locale === "ar" ? "عرض الشريك" : "View Partner"}
          </Link>
        </div>
      </div>
    </article>
  );
}
