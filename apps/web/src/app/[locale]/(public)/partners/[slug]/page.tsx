"use client";

import { use } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Clock,
  Compass,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { usePartnerQuery } from "@/hooks/use-partners";
import { Button } from "@/components/ui/button";

const FALLBACK_INSTITUTE_IMAGES = [
  "/images/pro/shop.jpg",
  "/images/pro/advisor.jpg",
  "/images/pro/inlab.jpg",
];

export default function PartnerDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug } = use(params);
  const t = useTranslations("PartnerDetail");
  const tp = useTranslations("Partners");
  const locale = useLocale() as "en" | "fr" | "ar";
  const ar = locale === "ar";
  const { data: partner, isLoading } = usePartnerQuery(slug);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-[1440px] px-4 md:px-6 py-20 animate-pulse space-y-8">
        <div className="h-6 w-40 bg-muted rounded" />
        <div className="h-12 w-96 bg-muted rounded" />
        <div className="h-80 w-full bg-muted rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-64 bg-muted rounded-xl" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </main>
    );
  }

  if (!partner) {
    return (
      <main className="mx-auto max-w-[1440px] px-4 md:px-6 py-32 text-center">
        <h1 className="font-display text-3xl sm:text-4xl">{t("notFound")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {ar
            ? "تعذر العثور على هذا الشريك أو أنه غير متاح حاليًا."
            : "The partner you requested could not be found or is currently inactive."}
        </p>
        <Button
          asChild
          variant="outline"
          className="mt-8 rounded-full uppercase tracking-wider text-xs"
        >
          <Link href="/partners" className="inline-flex items-center gap-2">
            <ArrowLeft className="size-4 rtl:rotate-180" />
            <span>{t("backToPartners")}</span>
          </Link>
        </Button>
      </main>
    );
  }

  const typeLabels: Record<string, string> = {
    spa: t("types.spa"),
    clinic: t("types.clinic"),
    beauty_institute: t("types.institute"),
    hotel: t("types.hotel"),
    retail: t("types.retail"),
    diagnostic_center: t("types.diagnostic"),
    distributor: t("types.distributor"),
  };

  const typeLabel = typeLabels[partner.type] ?? partner.type;
  const description =
    (partner.description as any)?.[locale] ||
    partner.description.en ||
    partner.description.ar ||
    "";

  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${partner.coordinates.lat},${partner.coordinates.lng}`;
  const phoneHref = `tel:${partner.phone.replace(/\s+/g, "")}`;
  const whatsappHref = partner.whatsapp
    ? `https://wa.me/${partner.whatsapp.replace(/[^\d]/g, "")}`
    : null;
  const emailHref = partner.email ? `mailto:${partner.email}` : null;

  const galleryImages =
    partner.mediaIds && partner.mediaIds.length > 0
      ? partner.mediaIds
      : FALLBACK_INSTITUTE_IMAGES;

  const openingHoursText =
    typeof partner.openingHours === "string"
      ? partner.openingHours
      : (partner.openingHours as any)?.[locale] ||
        (partner.openingHours as any)?.en ||
        (ar ? "يوميًا: ١٠:٠٠ ص – ١٠:٠٠ م" : "Daily: 10:00 AM – 10:00 PM");

  return (
    <main className="bg-background pb-24">
      {/* Editorial Header */}
      <section className="border-b border-border bg-ioma-grey-50/50 py-12 md:py-16">
        <div className="mx-auto max-w-[1440px] px-4 md:px-6">
          <Link
            href="/partners"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5 rtl:rotate-180" />
            <span>{t("backToPartners")}</span>
          </Link>

          <div className="mt-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sf-champagne/30 bg-sf-champagne/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-sf-champagne">
                  <Building2 className="size-3" />
                  {typeLabel}
                </span>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {partner.city} · {partner.emirate}
                </span>
              </div>
              <h1 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground">
                {partner.name}
              </h1>
            </div>

            {/* Quick Action Shortcuts */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                asChild
                className="rounded-full uppercase tracking-wider text-xs px-6"
              >
                <a
                  href={directionsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2"
                >
                  <Compass className="size-4" />
                  <span>{t("getDirections")}</span>
                </a>
              </Button>
              {partner.phone && (
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full uppercase tracking-wider text-xs px-5"
                >
                  <a href={phoneHref} className="flex items-center gap-2">
                    <Phone className="size-4" />
                    <span>{t("phone")}</span>
                  </a>
                </Button>
              )}
              {whatsappHref && (
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full uppercase tracking-wider text-xs px-5 text-emerald-700 hover:text-emerald-800"
                >
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="size-4" />
                    <span>WhatsApp</span>
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Media Gallery Grid */}
      <section className="mx-auto max-w-[1440px] px-4 md:px-6 pt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted border border-border/80">
            <Image
              src={galleryImages[0]!}
              alt={partner.name}
              fill
              priority
              sizes="(min-width: 1024px) 66vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
            <div className="relative aspect-[16/10] md:aspect-auto overflow-hidden rounded-2xl bg-muted border border-border/80">
              <Image
                src={galleryImages[1] || galleryImages[0]!}
                alt={`${partner.name} interior`}
                fill
                sizes="(min-width: 1024px) 33vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="relative aspect-[16/10] md:aspect-auto overflow-hidden rounded-2xl bg-muted border border-border/80">
              <Image
                src={galleryImages[2] || galleryImages[0]!}
                alt={`${partner.name} protocol`}
                fill
                sizes="(min-width: 1024px) 33vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Details & Services */}
      <section className="mx-auto max-w-[1440px] px-4 md:px-6 pt-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Story & Treatments */}
          <div className="lg:col-span-7 space-y-12">
            {/* About */}
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-light text-foreground">
                {t("about")}
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-line">
                {description}
              </p>
            </div>

            {/* Diagnostic Technology Spotlight */}
            {partner.diagnosisAvailable && (
              <div className="rounded-2xl border border-sf-champagne/30 bg-sf-champagne/5 p-6 sm:p-8 flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-sf-champagne/20 text-foreground">
                  <Sparkles className="size-6 text-sf-champagne" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-medium text-foreground">
                    {t("diagnosisAvailable")}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {t("diagnosisDescription")}
                  </p>
                  <p className="mt-3 text-xs text-sf-champagne font-semibold uppercase tracking-wider">
                    {ar
                      ? "فحص بدقة أجهزة MEMS ومختبر In.Lab متاح لدى هذا الشريك"
                      : "High-precision MEMS sensors & In.Lab custom compounding available on-site"}
                  </p>
                </div>
              </div>
            )}

            {/* Offered Treatments & Cabin Services */}
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-light text-foreground">
                  {t("services")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {ar
                    ? "البروتوكولات والعلاجات الحصرية المعتمدة من آيوما باريس المتوفرة لدى هذا الشريك."
                    : "Exclusive IOMA Paris certified protocols and treatments available at this partner."}
                </p>
              </div>

              {partner.services.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  {t("noServices")}
                </div>
              ) : (
                <div className="grid gap-3">
                  {partner.services.map((svc) => (
                    <article
                      key={svc.id}
                      className="rounded-xl border border-border/70 bg-card p-5 transition-colors hover:border-foreground/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-base font-medium text-foreground">
                            {(svc.name as any)?.[locale] || svc.name.en || svc.name.ar}
                          </h3>
                          {svc.category && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase font-semibold text-muted-foreground">
                              {svc.category}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Clock className="size-3.5 text-muted-foreground" />
                          <span>{svc.durationMinutes} min</span>
                        </p>
                      </div>

                      <div className="text-end shrink-0">
                        <span className="text-xs font-semibold uppercase tracking-wider text-sf-champagne">
                          {ar ? "متوفر في هذا المعهد" : "In-Cabin Ritual"}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Establishment Info & Contact Card */}
          <div className="lg:col-span-5 lg:sticky lg:top-36">
            <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-6">
              <h3 className="font-display text-xl font-medium text-foreground pb-4 border-b border-border">
                {ar ? "معلومات التواصل والزيارة" : "Establishment & Contact"}
              </h3>

              <div className="space-y-4 text-sm">
                {/* Address */}
                <div className="flex items-start gap-3">
                  <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">{partner.address}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {partner.city}, {partner.emirate} · United Arab Emirates
                    </p>
                  </div>
                </div>

                {/* Opening Hours */}
                <div className="flex items-start gap-3">
                  <Clock className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {ar ? "أوقات العمل" : "Opening Hours"}
                    </p>
                    <p className="text-sm font-medium text-foreground mt-0.5">
                      {openingHoursText}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3">
                  <Phone className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("phone")}
                    </p>
                    <a
                      href={phoneHref}
                      className="text-sm font-medium text-foreground hover:underline"
                      dir="ltr"
                    >
                      {partner.phone}
                    </a>
                  </div>
                </div>

                {/* WhatsApp */}
                {partner.whatsapp && (
                  <div className="flex items-start gap-3">
                    <MessageCircle className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        WhatsApp
                      </p>
                      <a
                        href={whatsappHref!}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-emerald-700 hover:underline"
                        dir="ltr"
                      >
                        {partner.whatsapp}
                      </a>
                    </div>
                  </div>
                )}

                {/* Email */}
                {partner.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Email
                      </p>
                      <a
                        href={emailHref!}
                        className="text-sm font-medium text-foreground hover:underline"
                        dir="ltr"
                      >
                        {partner.email}
                      </a>
                    </div>
                  </div>
                )}

                {/* Website */}
                {partner.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {ar ? "الموقع الرسمي" : "Official Website"}
                      </p>
                      <a
                        href={partner.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-sf-champagne hover:underline"
                        dir="ltr"
                      >
                        <span>{partner.website.replace(/^https?:\/\//, "")}</span>
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons in Card */}
              <div className="pt-4 border-t border-border space-y-2.5">
                <Button
                  asChild
                  className="w-full rounded-full uppercase tracking-widest text-xs font-semibold"
                >
                  <a
                    href={directionsHref}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <Compass className="size-4" />
                    <span>{t("getDirections")}</span>
                  </a>
                </Button>

                {partner.phone && (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full rounded-full uppercase tracking-widest text-xs font-semibold"
                  >
                    <a
                      href={phoneHref}
                      className="flex items-center justify-center gap-2"
                    >
                      <Phone className="size-4" />
                      <span>{t("contactPartner")}</span>
                    </a>
                  </Button>
                )}

                {partner.website && (
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full rounded-full uppercase tracking-widest text-xs"
                  >
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5"
                    >
                      <Globe className="size-3.5" />
                      <span>{t("visitWebsite")}</span>
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* B2B Acquisition Banner */}
      <section className="mx-auto max-w-[1440px] px-4 md:px-6 pt-20">
        <div className="rounded-2xl border border-border/80 bg-gradient-to-r from-muted/30 via-background to-muted/20 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-sf-champagne flex items-center gap-2">
              <ShieldCheck className="size-4" />
              <span>{tp("ctaKicker")}</span>
            </p>
            <h3 className="font-display text-2xl sm:text-3xl font-light text-foreground">
              {tp("ctaTitle")}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {tp("ctaBody")}
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="rounded-full bg-foreground text-background hover:bg-foreground/85 uppercase tracking-widest text-xs font-semibold px-8 shrink-0"
          >
            <Link href="/professionals" className="flex items-center gap-2">
              <span>{tp("ctaButton")}</span>
              <ArrowUpRight className="size-4 rtl:-scale-x-100" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
