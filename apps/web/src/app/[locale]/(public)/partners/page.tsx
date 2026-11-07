"use client";

import { MaskText } from "@/components/motion/cine";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowUpRight,
  BadgePercent,
  ChevronDown,
  Compass,
  FlaskConical,
  GraduationCap,
  LayoutGrid,
  LocateFixed,
  Map,
  MapPinOff,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { PartnerListItem } from "@ioma/types";
import { EMIRATES } from "@ioma/config";
import { Link } from "@/i18n/navigation";
import { usePartnersQuery } from "@/hooks/use-partners";
import { PartnerLocatorMap } from "@/components/partners/partner-locator-map";
import { PartnerCard } from "@/components/partners/partner-card";
import { cn } from "@/lib/utils";

const TYPE_FILTERS = [
  { value: "", key: "all" },
  { value: "spa", key: "spa" },
  { value: "clinic", key: "clinic" },
  { value: "beauty_institute", key: "institute" },
  { value: "hotel", key: "hotel" },
  { value: "retail", key: "retail" },
  { value: "distributor", key: "distributor" },
] as const;

export default function PartnersPage() {
  const t = useTranslations("Partners");
  const locale = useLocale() as "en" | "ar" | "fr";
  const ar = locale === "ar";
  const [selectedEmirate, setSelectedEmirate] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPartner, setSelectedPartner] = useState<PartnerListItem | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [viewMode, setViewMode] = useState<"both" | "list" | "map">("both");

  const filters = useMemo(
    () => ({
      emirate: selectedEmirate || undefined,
      type: selectedType || undefined,
      ...(userLocation
        ? { lat: userLocation.lat, lng: userLocation.lng, radius: 50000 }
        : {}),
    }),
    [selectedEmirate, selectedType, userLocation],
  );

  const { data: rawPartners = [], isLoading } = usePartnersQuery(filters);
  const { data: allPartners = [] } = usePartnersQuery({});

  // Filter partners in memory by search query (name, address, city, emirate)
  const partners = useMemo(() => {
    if (!searchQuery.trim()) return rawPartners;
    const q = searchQuery.toLowerCase().trim();
    return rawPartners.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.emirate.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q),
    );
  }, [rawPartners, searchQuery]);

  const stats = useMemo(
    () => [
      { label: t("heroStats.partners"), value: allPartners.length },
      {
        label: t("heroStats.emirates"),
        value: new Set(allPartners.map((p) => p.emirate)).size,
      },
      {
        label: t("heroStats.cities"),
        value: new Set(allPartners.map((p) => p.city)).size,
      },
    ],
    [allPartners, t],
  );

  const hasFilters = Boolean(
    selectedEmirate || selectedType || userLocation || searchQuery,
  );
  const clearFilters = () => {
    setSelectedEmirate("");
    setSelectedType("");
    setSearchQuery("");
    setUserLocation(null);
    setLocationError(false);
    setSelectedPartner(null);
  };

  const toggleLocation = () => {
    if (userLocation) {
      setUserLocation(null);
      return;
    }
    if (!navigator.geolocation) {
      setLocationError(true);
      return;
    }
    setLocating(true);
    setLocationError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocationError(true);
        setLocating(false);
      },
      { timeout: 10000 },
    );
  };

  return (
    <main>
      {/* Editorial Luxury Hero */}
      <section className="bg-sf-ivory">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-sf-champagne">
              <span aria-hidden className="h-px w-8 bg-sf-champagne" />
              {t("kicker")}
            </p>
            <MaskText
              as="h1"
              immediate
              text={ar ? "اكتشفوا معاهدنا وشركاءنا" : "Discover Our Partners"}
              className="mt-5 max-w-4xl font-display text-[clamp(2.6rem,7vw,6rem)] font-medium uppercase leading-[0.96] tracking-[-0.03em] text-foreground rtl:normal-case rtl:leading-[1.2] rtl:tracking-normal"
            />
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg font-light">
              {ar
                ? "تفضلوا بزيارة شركائنا المعتمدين في جميع أنحاء الإمارات لاختبار دقة تشخيص آيوما وبروتوكولات العناية الفاخرة."
                : "Locate our official approved luxury spas, clinics and beauty institutes across the UAE to discover in-person diagnostic precision and bespoke cabin rituals."}
            </p>
          </div>

          {allPartners.length > 0 && (
            <dl className="grid grid-cols-3 gap-6 border-t border-border pt-6 lg:min-w-[380px] lg:border-t-0 lg:border-s lg:ps-10 lg:pt-0">
              {stats.map((s) => (
                <div key={s.label}>
                  <dd className="font-display text-4xl tabular-nums sm:text-5xl text-foreground">
                    {s.value}
                  </dd>
                  <dt className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    {s.label}
                  </dt>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      {/* Locator & Filter Workspace */}
      <section className="mx-auto max-w-[1440px] px-4 py-10 md:px-6 md:py-14">
        {/* Search Bar + Controls */}
        <div className="mb-6 grid gap-4 lg:grid-cols-12 lg:items-center">
          {/* Keyword Search */}
          <div className="lg:col-span-5 relative">
            <Search className="size-4 text-muted-foreground absolute start-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                ar
                  ? "ابحث باسم الشريك أو المدينة أو العنوان..."
                  : "Search partner name, city or emirate..."
              }
              className="h-12 w-full rounded-full border border-border bg-background ps-11 pe-10 text-xs font-medium uppercase tracking-wider outline-none transition-colors hover:border-foreground/40 focus:border-sf-champagne focus:ring-2 focus:ring-sf-champagne/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Emirate Dropdown + Near Me + View Mode */}
          <div className="lg:col-span-7 flex flex-wrap items-center justify-start lg:justify-end gap-3">
            <div className="relative">
              <select
                value={selectedEmirate}
                onChange={(e) => {
                  setSelectedEmirate(e.target.value);
                  setSelectedPartner(null);
                }}
                aria-label={t("filterEmirate")}
                className="h-12 appearance-none rounded-full border border-border bg-background ps-5 pe-11 text-xs font-semibold uppercase tracking-wider outline-none transition-colors hover:border-foreground/50 focus-visible:ring-2 focus-visible:ring-sf-champagne"
              >
                <option value="">{t("filterAllEmirates")}</option>
                {EMIRATES.map((em) => (
                  <option key={em.code} value={em.code}>
                    {em.name[locale as "en" | "ar"] ?? em.name.en}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden
                className="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
            </div>

            <button
              type="button"
              onClick={toggleLocation}
              disabled={locating}
              aria-pressed={Boolean(userLocation)}
              className={cn(
                "inline-flex h-12 items-center gap-2 rounded-full border px-5 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-60",
                userLocation
                  ? "border-sf-champagne bg-sf-champagne/15 text-foreground"
                  : "border-border bg-background hover:border-foreground/50",
              )}
            >
              <LocateFixed
                className={cn("size-4", locating && "animate-pulse")}
                aria-hidden
              />
              {locating
                ? t("locating")
                : userLocation
                  ? t("nearMeActive")
                  : t("useMyLocation")}
              {userLocation && <X className="size-3.5" aria-hidden />}
            </button>

            {/* View Mode Toggle (hidden on mobile, visible on desktop) */}
            <div className="hidden sm:inline-flex rounded-full border border-border p-1 bg-muted/30">
              <button
                type="button"
                onClick={() => setViewMode("both")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                  viewMode === "both"
                    ? "bg-foreground text-background shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {ar ? "الكل" : "Both"}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                  viewMode === "list"
                    ? "bg-foreground text-background shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {ar ? "قائمة" : "List"}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                  viewMode === "map"
                    ? "bg-foreground text-background shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {ar ? "خريطة" : "Map"}
              </button>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-12 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {t("clearFilters")}
              </button>
            )}
          </div>
        </div>

        {/* Type Category Filters */}
        <div
          role="group"
          aria-label={t("filterType")}
          className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
        >
          {TYPE_FILTERS.map((f) => {
            const active = selectedType === f.value;
            const label = t.has(`filterTypes.${f.key}`)
              ? t(`filterTypes.${f.key}`)
              : f.key;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setSelectedType(f.value);
                  setSelectedPartner(null);
                }}
                className={cn(
                  "min-h-10 shrink-0 rounded-full border px-4 text-xs font-semibold uppercase tracking-wider transition-colors",
                  active
                    ? "border-sf-charcoal bg-sf-charcoal text-white"
                    : "border-border bg-background text-foreground hover:border-foreground/50",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {locationError && (
          <p
            role="alert"
            className="mb-6 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground"
          >
            {t("locationError")}
          </p>
        )}

        <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
          <p aria-live="polite">
            {isLoading ? "…" : t("resultsCount", { count: partners.length })}
          </p>
        </div>

        {/* Dynamic Map & List Grid */}
        <div
          className={cn(
            "grid gap-6 items-start",
            viewMode === "both" && "lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)]",
            viewMode === "list" && "grid-cols-1 max-w-3xl mx-auto",
            viewMode === "map" && "grid-cols-1",
          )}
        >
          {/* Map */}
          {viewMode !== "list" && (
            <div
              role="region"
              aria-label={t("mapLabel")}
              className={cn(
                "ioma-map overflow-hidden rounded-2xl border border-border sm:h-[460px]",
                viewMode === "both"
                  ? "order-1 h-[320px] lg:sticky lg:top-36 lg:order-2 lg:h-[calc(100vh-10rem)] lg:max-h-[760px]"
                  : "h-[540px] sm:h-[640px]",
              )}
            >
              <PartnerLocatorMap
                partners={partners}
                selectedPartner={selectedPartner}
                onSelectPartner={setSelectedPartner}
                userLocation={userLocation}
              />
            </div>
          )}

          {/* List */}
          {viewMode !== "map" && (
            <div
              className={cn(
                "space-y-4",
                viewMode === "both"
                  ? "order-2 lg:order-1 lg:max-h-[760px] lg:overflow-y-auto lg:pe-2"
                  : "w-full",
              )}
            >
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-44 animate-pulse rounded-xl bg-muted"
                    aria-hidden
                  />
                ))
              ) : partners.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
                  <MapPinOff
                    className="mx-auto size-8 text-muted-foreground"
                    aria-hidden
                  />
                  <p className="mt-4 font-display text-xl">{t("noPartners")}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("noPartnersHint")}
                  </p>
                  {hasFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="mt-6 inline-flex min-h-11 items-center rounded-full bg-foreground px-6 text-xs font-semibold uppercase tracking-wider text-background hover:bg-foreground/85"
                    >
                      {t("clearFilters")}
                    </button>
                  )}
                </div>
              ) : (
                partners.map((partner) => (
                  <PartnerCard
                    key={partner.id}
                    partner={partner}
                    isSelected={selectedPartner?.id === partner.id}
                    onSelect={setSelectedPartner}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </section>

      {/* Become an IOMA Partner (B2B Recruitment Section) */}
      <section className="relative overflow-hidden bg-sf-champagne/15 border-t border-border">
        {/* Subtle decorative rings */}
        <svg
          aria-hidden
          viewBox="0 0 600 600"
          className="pointer-events-none absolute -end-40 top-1/2 hidden size-[640px] -translate-y-1/2 text-sf-champagne/40 md:block rtl:-scale-x-100"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="300" cy="300" r="120" strokeWidth="1" opacity="0.7" />
          <circle cx="300" cy="300" r="190" strokeWidth="1" opacity="0.5" />
          <circle cx="300" cy="300" r="260" strokeWidth="1" opacity="0.35" />
          <circle cx="300" cy="300" r="330" strokeWidth="1" opacity="0.2" />
        </svg>

        <div className="relative mx-auto grid max-w-[1440px] gap-12 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:items-center">
          <div>
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-foreground">
              <span aria-hidden className="h-px w-8 bg-foreground" />
              {t("ctaKicker")}
            </p>
            <h2 className="mt-5 max-w-xl font-display text-3xl leading-[1.1] tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {t("ctaTitle")}
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-foreground/80 font-light">
              {t("ctaBody")}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/professionals"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-foreground px-8 text-xs font-semibold uppercase tracking-wider text-background transition-colors hover:bg-foreground/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                <span>{t("ctaButton")}</span>
                <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
              </Link>
            </div>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {(
              [
                { key: "pricing", icon: BadgePercent },
                { key: "protocols", icon: FlaskConical },
                { key: "training", icon: GraduationCap },
                { key: "team", icon: Users },
              ] as const
            ).map(({ key, icon: Icon }) => (
              <li
                key={key}
                className="rounded-2xl border border-foreground/10 bg-background p-5 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
              >
                <span className="grid size-10 place-items-center rounded-full bg-sf-champagne/25 text-foreground">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-lg text-foreground">
                  {t(`ctaBenefits.${key}.title`)}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {t(`ctaBenefits.${key}.body`)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
