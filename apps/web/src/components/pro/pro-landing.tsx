"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BadgePercent,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Cpu,
  FileText,
  FlaskConical,
  Gift,
  GraduationCap,
  ImageIcon,
  Lock,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Users,
  Video,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import { useRegisterLead } from "@/hooks/use-pro-access";
import { cn } from "@/lib/utils";
import { LANDING } from "@/content/pro-space";
import galleries from "@/content/galleries.json";
import { Eyebrow, primaryBtn, useTx } from "./pro-ui";
import { ImageReveal, MaskText, Reveal, StaggerGrid } from "@/components/motion/cine";

// Official cabin product visuals (client folder #19), first eight of the cabin gallery.
const CABIN_TILES = (
  (galleries as unknown as Record<string, { src: string; alt: string }[]>).cabin ?? []
).slice(0, 8);

const BULLET_ICONS = [Tag, ShoppingBag, Video];
const CARD_ICONS = {
  shop: ShoppingBag,
  cabin: FlaskConical,
  documents: FileText,
  videos: Video,
  gallery: ImageIcon,
  benefits: Gift,
} as const;

const field =
  "h-11 w-full rounded-lg border border-sf-mauve/25 bg-white px-3 text-xs outline-none transition-colors focus-visible:border-sf-mauve focus-visible:ring-2 focus-visible:ring-sf-mauve/20 aria-[invalid=true]:border-destructive";

const selectField =
  "h-11 w-full rounded-lg border border-sf-mauve/25 bg-white px-3 text-xs outline-none transition-colors focus-visible:border-sf-mauve focus-visible:ring-2 focus-visible:ring-sf-mauve/20";

type Errors = Partial<
  Record<
    | "firstName"
    | "lastName"
    | "companyName"
    | "businessType"
    | "phone"
    | "email"
    | "emirate",
    string
  >
>;

const EMIRATES_LIST = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Ras Al Khaimah",
  "Fujairah",
  "Umm Al Quwain",
];

const BUSINESS_TYPES = [
  { value: "spa", en: "Luxury Hotel Spa / Day Spa", ar: "سبا فندقي فاخر / سبا نهاري" },
  { value: "clinic", en: "Aesthetic Medical Clinic", ar: "عيادة طبية تجميلية" },
  {
    value: "beauty_institute",
    en: "Beauty Institute / Salon",
    ar: "معهد تجميل / صالون راقٍ",
  },
  { value: "hotel", en: "Luxury Hotel / Resort", ar: "فندق / منتجع فاخر" },
  { value: "retail", en: "High-end Retail / Concept Store", ar: "متجر تجزئة راقٍ" },
  { value: "distributor", en: "Authorized Distributor", ar: "موزع إقليمي معتمد" },
];

function RegistrationForm() {
  const { tx, loc } = useTx();
  const ar = loc === "ar";
  const F = LANDING.form;
  const register = useRegisterLead();
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);

  function validate(v: Record<string, string>): Errors {
    const e: Errors = {};
    if (!v.firstName?.trim()) e.firstName = tx(F.required);
    if (!v.lastName?.trim()) e.lastName = tx(F.required);
    if (!v.companyName?.trim()) e.companyName = tx(F.required);
    if (!v.businessType?.trim()) e.businessType = tx(F.required);
    if (!v.emirate?.trim()) e.emirate = tx(F.required);
    if (!/^\+?[\d\s()-]{7,20}$/.test(v.phone?.trim() ?? "")) e.phone = tx(F.invalidPhone);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email?.trim() ?? ""))
      e.email = tx(F.invalidEmail);
    return e;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTopError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<
      string,
      string
    >;
    const found = validate(data);
    setErrors(found);
    if (Object.keys(found).length) return;

    try {
      await register.mutateAsync({
        firstName: data.firstName!.trim(),
        lastName: data.lastName!.trim(),
        companyName: data.companyName!.trim(),
        businessType: data.businessType?.trim() || undefined,
        emirate: data.emirate?.trim() || undefined,
        city: data.city?.trim() || undefined,
        address: data.address?.trim() || undefined,
        tradeLicenceNumber: data.tradeLicenceNumber?.trim() || undefined,
        website: data.webOrSocial?.trim() || undefined,
        message: data.message?.trim() || undefined,
        phone: data.phone!.trim(),
        email: data.email!.trim(),
        locale: loc,
        hp: data.hp_company_field || undefined,
      });
      setDone(true);
    } catch (err) {
      setTopError(
        tx(err instanceof ApiError && err.statusCode === 429 ? F.rateLimited : F.error),
      );
    }
  }

  if (done) {
    return (
      <div
        id="apply-form"
        role="status"
        className="rounded-2xl bg-white p-7 shadow-[0_10px_40px_rgba(74,63,143,0.12)] sm:p-9 border border-sf-mauve/20"
      >
        <span className="grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-700">
          <Check className="size-6" aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-2xl">{tx(F.successTitle)}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {tx(F.successBody)}
        </p>

        {/* 4-Step Partnership Progression */}
        <div className="mt-8 space-y-3 pt-6 border-t border-border">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
            {ar ? "مراحل معالجة الطلب" : "Application Workflow"}
          </p>
          <ol className="space-y-2 text-xs">
            <li className="flex items-center gap-2 text-emerald-700 font-medium">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>
                {ar
                  ? "١. تم استلام الطلب بنجاح (قيد المعالجة)"
                  : "1. Application Submitted (Under Review)"}
              </span>
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Clock className="size-4 shrink-0 text-sf-mauve" />
              <span>
                {ar
                  ? "٢. التحقق ومطابقة الرخصة التجارية (خلال ٢٤–٤٨ ساعة)"
                  : "2. Document & Trade Licence Verification (24–48h)"}
              </span>
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0 text-muted-foreground" />
              <span>
                {ar
                  ? "٣. اعتماد الحساب وإصدار بيانات الدخول الرسمية"
                  : "3. Account Approval & Official Credentials"}
              </span>
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <ShoppingBag className="size-4 shrink-0 text-muted-foreground" />
              <span>
                {ar
                  ? "٤. الوصول إلى البوابة المهنية وأسعار الجملة"
                  : "4. Full Access to B2B Wholesale Portal"}
              </span>
            </li>
          </ol>
        </div>
      </div>
    );
  }

  const textInput = (
    name: string,
    label: string,
    errorKey?: keyof Errors,
    extra: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => {
    const err = errorKey ? errors[errorKey] : undefined;
    return (
      <label className="block text-xs font-medium text-foreground">
        {label}
        <input
          name={name}
          className={cn(field, "mt-1")}
          aria-invalid={!!err}
          aria-describedby={err ? `err-${name}` : undefined}
          {...extra}
        />
        {err && (
          <span
            id={`err-${name}`}
            role="alert"
            className="mt-1 block text-xs text-destructive"
          >
            {err}
          </span>
        )}
      </label>
    );
  };

  return (
    <form
      id="apply-form"
      onSubmit={onSubmit}
      noValidate
      className="rounded-2xl bg-white p-7 shadow-[0_10px_40px_rgba(74,63,143,0.12)] sm:p-9 border border-sf-mauve/20"
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sf-mauve">
        <Sparkles className="size-3.5" />
        <span>{ar ? "طلب اعتماد شراكة B2B" : "Partnership Application"}</span>
      </div>
      <h2 className="mt-2 font-display text-2xl text-foreground">{tx(F.title)}</h2>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
        {tx(F.subtitle)}
      </p>

      <div className="mt-6 space-y-3.5">
        {/* Establishment name */}
        {textInput("companyName", tx(F.company), "companyName", {
          autoComplete: "organization",
          maxLength: 120,
          placeholder: ar
            ? "اسم السبا أو العيادة أو المعهد"
            : "Spa, clinic or establishment name",
        })}

        {/* Business Type & Emirate */}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-foreground">
            {ar ? "نوع المنشأة *" : "Establishment Type *"}
            <select
              name="businessType"
              defaultValue=""
              className={cn(selectField, "mt-1")}
              aria-invalid={!!errors.businessType}
            >
              <option value="" disabled>
                {ar ? "اختر النوع..." : "Select type..."}
              </option>
              {BUSINESS_TYPES.map((bt) => (
                <option key={bt.value} value={bt.value}>
                  {ar ? bt.ar : bt.en}
                </option>
              ))}
            </select>
            {errors.businessType && (
              <span role="alert" className="mt-1 block text-xs text-destructive">
                {errors.businessType}
              </span>
            )}
          </label>

          <label className="block text-xs font-medium text-foreground">
            {ar ? "الإمارة *" : "Emirate *"}
            <select
              name="emirate"
              defaultValue="Dubai"
              className={cn(selectField, "mt-1")}
              aria-invalid={!!errors.emirate}
            >
              {EMIRATES_LIST.map((em) => (
                <option key={em} value={em}>
                  {em}
                </option>
              ))}
            </select>
            {errors.emirate && (
              <span role="alert" className="mt-1 block text-xs text-destructive">
                {errors.emirate}
              </span>
            )}
          </label>
        </div>

        {/* Contact Person Name */}
        <div className="grid gap-3 sm:grid-cols-2">
          {textInput("firstName", tx(F.firstName), "firstName", {
            autoComplete: "given-name",
            maxLength: 60,
          })}
          {textInput("lastName", tx(F.lastName), "lastName", {
            autoComplete: "family-name",
            maxLength: 60,
          })}
        </div>

        {/* Phone & Email */}
        <div className="grid gap-3 sm:grid-cols-2">
          {textInput("phone", tx(F.phone), "phone", {
            type: "tel",
            autoComplete: "tel",
            defaultValue: "+971 ",
            dir: "ltr",
            inputMode: "tel",
            maxLength: 25,
          })}
          {textInput("email", tx(F.email), "email", {
            type: "email",
            autoComplete: "email",
            dir: "ltr",
            maxLength: 160,
          })}
        </div>

        {/* Address / City */}
        <div className="grid gap-3 sm:grid-cols-2">
          {textInput("city", ar ? "المدينة / المنطقة" : "City / Area", undefined, {
            placeholder: ar ? "مثال: جميرا، وسط المدينة" : "E.g. Jumeirah, Downtown",
            maxLength: 80,
          })}
          {textInput("address", ar ? "العنوان التجاري" : "Business Address", undefined, {
            placeholder: ar ? "الشارع، المبنى" : "Street, building, unit",
            maxLength: 180,
          })}
        </div>

        {/* Trade Licence & Website */}
        <div className="grid gap-3 sm:grid-cols-2">
          {textInput(
            "tradeLicenceNumber",
            ar ? "رقم الرخصة التجارية" : "Trade Licence Number",
            undefined,
            {
              placeholder: ar
                ? "رقم الرخصة بدبي / الإمارات"
                : "DED / Free Zone licence no.",
              maxLength: 80,
            },
          )}
          {textInput(
            "webOrSocial",
            ar ? "الموقع أو حساب إنستغرام" : "Website or Instagram",
            undefined,
            {
              placeholder: "https://... or @account",
              maxLength: 120,
              dir: "ltr",
            },
          )}
        </div>

        {/* Partnership Message */}
        <label className="block text-xs font-medium text-foreground">
          {ar
            ? "رسالة أو تفاصيل إضافية (اختياري)"
            : "Partnership message or requirements (optional)"}
          <textarea
            name="message"
            rows={2}
            maxLength={1000}
            placeholder={
              ar
                ? "أخبرنا عن غرف العلاج وعدد الأسرّة والخدمات المقدمة..."
                : "Tell us about your cabin setup, treatment rooms and interests..."
            }
            className="mt-1 w-full rounded-lg border border-sf-mauve/25 bg-white p-3 text-xs outline-none transition-colors focus-visible:border-sf-mauve focus-visible:ring-2 focus-visible:ring-sf-mauve/20"
          />
        </label>

        {/* Honeypot for bot suppression */}
        <input
          name="hp_company_field"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="absolute -start-[9999px] h-0 w-0 opacity-0"
        />
      </div>

      {topError && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-xs text-destructive"
        >
          {topError}
        </p>
      )}

      <button
        type="submit"
        disabled={register.isPending}
        className={cn(
          primaryBtn,
          "mt-6 w-full text-xs uppercase tracking-wider font-semibold",
        )}
      >
        {register.isPending
          ? tx(F.sending)
          : ar
            ? "إرسال طلب الانضمام"
            : "Submit Partnership Application"}
      </button>

      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        {tx(F.consent)}
      </p>

      <div className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground flex items-center justify-between">
        <span>{tx(F.signIn)}</span>
        <Link
          href="/login?redirect=/portal"
          className="font-semibold text-sf-mauve hover:underline inline-flex items-center gap-1"
        >
          <span>{tx(F.signInLink)}</span>
          <ArrowUpRight className="size-3.5 rtl:-scale-x-100" />
        </Link>
      </div>
    </form>
  );
}

const eyebrowCls =
  "flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-sf-mauve rtl:tracking-normal";
const h2Cls =
  "text-balance font-display text-[clamp(1.9rem,3.6vw,3rem)] font-medium leading-[1.1] tracking-[-0.02em] text-foreground rtl:leading-[1.35] rtl:tracking-normal";
const pillBtn =
  "inline-flex min-h-12 items-center gap-2 rounded-full px-7 text-xs font-semibold uppercase tracking-[0.16em] transition-[background-color,color,transform,border-color] duration-200 ease-[var(--ease-out-strong)] active:scale-[0.97] rtl:tracking-normal";

function SectionEyebrow({
  children,
  center = false,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <p className={cn(eyebrowCls, center && "justify-center")}>
      <span aria-hidden className="h-px w-8 bg-sf-mauve" />
      {children}
    </p>
  );
}

export default function ProLanding() {
  const { tx, loc } = useTx();
  const ar = loc === "ar";
  const L = LANDING;

  const proof = [
    {
      icon: Cpu,
      v: ar ? "MEMS" : "MEMS",
      l: ar ? "حساسات دقيقة للقياس الموضوعي" : "Objective skin measurement",
    },
    {
      icon: FlaskConical,
      v: "40,000+",
      l: ar ? "تركيبة ممكنة مع In.Lab" : "possible In.Lab formulas",
    },
    {
      icon: BadgePercent,
      v: "B2B",
      l: ar ? "أسعار جملة مخصصة بالدرهم" : "dedicated wholesale pricing in AED",
    },
    {
      icon: GraduationCap,
      v: ar ? "تدريب" : "Training",
      l: ar ? "فيديوهات وبروتوكولات خطوة بخطوة" : "videos and step-by-step protocols",
    },
  ];

  const pillars = [
    {
      icon: Cpu,
      t: ar ? "أجهزة i-Diag و In.Lab" : "i-Diag & In.Lab Devices",
      b: ar
        ? "أجهزة تشخيص وتركيب مصغرة توضع في عيادتكم أو السبا الخاص بكم لتوفير تجربة استثنائية."
        : "Turnkey diagnostic and drop-by-drop compounding hardware for prestigious treatment rooms.",
    },
    {
      icon: FlaskConical,
      t: ar ? "منتجات الكابينة الحصرية" : "Exclusive Cabin Formats",
      b: ar
        ? "أحجام مهنية مخصصة للمعالجين مع بروتوكولات تدليك وتقشير متقدمة."
        : "Professional-sized cleansers, peelings, serums and massage concentrates formulated exclusively for therapists.",
    },
    {
      icon: BadgePercent,
      t: ar ? "أسعار الجملة وهوامش ربح مجزية" : "B2B Wholesale Margins",
      b: ar
        ? "قائمة أسعار مخصصة للشركاء المعتمدين مع شروط طلب مرنة ودعم لإعادة البيع بالتجزئة."
        : "Dedicated wholesale tier with transparent AED pricing, low MOQs, and retail resale support.",
    },
    {
      icon: GraduationCap,
      t: ar ? "أكاديمية تدريب معتمدة" : "Masterclass Certification",
      b: ar
        ? "فيديوهات تدريبية وكتيبات بروتوكولية خطوة بخطوة تضمن احترافية طاقم السبا لديكم."
        : "Comprehensive video training modules and protocol step guides empowering your aesthetic team.",
    },
  ];

  return (
    <main className="bg-background">
      {/* 1. Hero + application form */}
      <section className="bg-sf-ivory">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-14 md:px-8 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)] lg:items-start lg:gap-16">
          <div>
            <p className={eyebrowCls}>
              <span aria-hidden className="h-px w-8 bg-sf-mauve" />
              {tx(L.kicker)}
            </p>

            <MaskText
              as="h1"
              immediate
              text={
                ar
                  ? "تميّز العناية الشخصية الفرنسية في مساحتكم المهنية."
                  : "French bespoke skincare, for luxury spas & clinics."
              }
              className="mt-6 text-balance font-display text-[clamp(2.3rem,5.2vw,4.6rem)] font-medium leading-[1.04] tracking-[-0.03em] text-foreground rtl:leading-[1.3] rtl:tracking-normal"
            />

            <Reveal className="mt-7 max-w-xl space-y-8">
              <p
                data-cine-item
                className="text-base font-light leading-relaxed text-muted-foreground sm:text-lg"
              >
                {ar
                  ? "انضموا إلى شبكة شركاء آيوما باريس في الإمارات: أحجام كابينة حصرية، أجهزة تشخيص MEMS المتقدمة، تدريب معتمد، وأسعار جملة مخصصة للمحترفين."
                  : "Join the official IOMA Paris partner network across the UAE: exclusive treatment-room formats, high-precision MEMS diagnostic technology, masterclass protocols and dedicated wholesale pricing."}
              </p>

              <ul data-cine-item className="space-y-3">
                {L.bullets.map((b, i) => {
                  const Icon = BULLET_ICONS[i]!;
                  return (
                    <li
                      key={b.en}
                      className="flex items-center gap-3 text-sm font-medium text-foreground"
                    >
                      <span className="grid size-7 place-items-center rounded-full bg-sf-mauve/10 text-sf-mauve">
                        <Icon className="size-3.5" aria-hidden />
                      </span>
                      <span>{tx(b)}</span>
                    </li>
                  );
                })}
              </ul>

              <div data-cine-item className="flex flex-wrap items-center gap-3">
                <a
                  href="#apply-form"
                  className={cn(
                    pillBtn,
                    "bg-foreground text-background hover:bg-sf-mauve",
                  )}
                >
                  <span>{ar ? "قدّم طلب الاعتماد" : "Apply to become a partner"}</span>
                  <ArrowDown className="size-4" aria-hidden />
                </a>
                <Link
                  href="/login?redirect=/portal"
                  className={cn(
                    pillBtn,
                    "border border-foreground/25 bg-white text-foreground hover:border-sf-mauve hover:bg-sf-mauve/10",
                  )}
                >
                  <span>{ar ? "تسجيل دخول الشركاء" : "Partner sign in"}</span>
                  <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
                </Link>
              </div>
            </Reveal>
          </div>

          <RegistrationForm />
        </div>
      </section>

      {/* 3. Proof strip */}
      <section className="border-b border-border bg-white">
        <StaggerGrid
          revision="proof"
          className="mx-auto grid max-w-[1440px] grid-cols-2 gap-px px-4 py-10 md:grid-cols-4 md:px-8 md:py-12"
        >
          {proof.map(({ icon: Icon, v, l }) => (
            <div key={l} className="px-2 py-3 md:px-6">
              <Icon className="size-5 text-sf-mauve" aria-hidden />
              <p
                className="mt-3 font-display text-2xl tabular-nums md:text-3xl"
                dir="ltr"
              >
                {v}
              </p>
              <p className="mt-1 text-xs leading-snug text-muted-foreground md:text-sm">
                {l}
              </p>
            </div>
          ))}
        </StaggerGrid>
      </section>

      {/* 4. Scientific heritage + pillars */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-4 md:px-8 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <ImageReveal className="relative aspect-[4/5] rounded-[2rem] bg-sf-ivory">
              <Image
                src="/images/pro/advisor.jpg"
                alt={
                  ar
                    ? "مستشارة آيوما تقدّم منتجًا"
                    : "An IOMA advisor presenting a product"
                }
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover object-[50%_25%]"
              />
            </ImageReveal>
          </div>
          <div className="lg:col-span-7">
            <SectionEyebrow>
              {ar ? "الريادة العلمية لآيوما" : "Scientific heritage"}
            </SectionEyebrow>
            <MaskText
              as="h2"
              className={cn("mt-5", h2Cls)}
              text={
                ar
                  ? "أكثر من ٤٠٬٠٠٠ تركيبة ودقة ميكروإلكترونية مثبتة"
                  : "Proven precision: 40,000+ formulations & MEMS technology"
              }
            />
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
              {ar
                ? "تعتمد آيوما باريس على مستشعرات دقيقة مستمدة من صناعة الإلكترونيات المتقدمة لقياس رطوبة البشرة وتجددها واحمرارها بدقة موضوعية، قبل اقتراح التركيبات المخصصة أو تحضيرها."
                : "Founded in Paris, IOMA harnesses micro-electromechanical sensors (MEMS) to read skin hydration, cellular renewal and redness with objective precision before recommending or compounding bespoke formulas."}
            </p>
            <StaggerGrid revision="pillars" className="mt-10 grid gap-4 sm:grid-cols-2">
              {pillars.map(({ icon: Icon, t, b }) => (
                <div
                  key={t}
                  className="rounded-[1.5rem] border border-sf-mauve/15 bg-sf-ivory p-6 transition-[transform,box-shadow] duration-300 ease-[var(--ease-out-strong)] [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-[0_24px_50px_-30px_rgba(110,94,147,0.5)]"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-white text-sf-mauve">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 font-display text-lg">{t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {b}
                  </p>
                </div>
              ))}
            </StaggerGrid>
          </div>
        </div>
      </section>

      {/* 5. Devices in the cabin */}
      <section className="bg-sf-ivory py-20 md:py-28">
        <div className="mx-auto max-w-[1440px] px-4 md:px-8">
          <div className="grid gap-6 md:grid-cols-2 md:items-end">
            <div>
              <SectionEyebrow>
                {ar ? "التقنية في كابينتكم" : "Technology in your cabin"}
              </SectionEyebrow>
              <MaskText
                as="h2"
                className={cn("mt-5", h2Cls)}
                text={
                  ar
                    ? "أجهزة تقرأ البشرة وتصنع التركيبة"
                    : "Devices that read the skin and create the formula"
                }
              />
            </div>
            <p className="text-base leading-relaxed text-muted-foreground">
              {ar
                ? "يقدّم الشريك المعتمد لعملائه تشخيصًا حيًّا ثم عناية مصممة لبشرتهم، في تجربة واحدة داخل الكابينة."
                : "An approved partner offers clients a live diagnosis followed by care made for their skin, in a single cabin experience."}
            </p>
          </div>
          <StaggerGrid revision="devices" className="mt-12 grid gap-4 md:grid-cols-5">
            <div className="group relative aspect-[16/10] overflow-hidden rounded-[1.5rem] bg-white md:col-span-3">
              <Image
                src="/images/pro/gallery-1.jpg"
                alt={
                  ar
                    ? "جهاز IOMA Sphere أثناء استشارة"
                    : "An IOMA Sphere during a consultation"
                }
                fill
                sizes="(min-width: 768px) 60vw, 100vw"
                className="object-cover transition-transform duration-[900ms] ease-[var(--ease-out-strong)] motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-[1.04]"
              />
            </div>
            <div className="group relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-white md:col-span-2 md:aspect-auto">
              <Image
                src="/images/pro/gallery-3.jpg"
                alt={ar ? "شاشة التشخيص التفاعلية" : "The interactive diagnosis screen"}
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover transition-transform duration-[900ms] ease-[var(--ease-out-strong)] motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-[1.04]"
              />
            </div>
          </StaggerGrid>
        </div>
      </section>

      {/* 6. Partnership workflow */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-[1440px] px-4 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow center>{tx(L.how.kicker)}</SectionEyebrow>
            <MaskText
              as="h2"
              className={cn("mt-5", h2Cls)}
              text={
                ar
                  ? "مسار الانضمام والاعتماد الرسمي"
                  : "Four steps to official partnership"
              }
            />
            <p className="mt-4 text-sm text-muted-foreground sm:text-base">
              {ar
                ? "عملية بسيطة وواضحة من الطلب إلى تفعيل البوابة المهنية."
                : "A clear workflow from first application to your official trade credentials."}
            </p>
          </div>
          <StaggerGrid
            revision="steps"
            className="relative mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-[12%] top-5 hidden h-px bg-sf-mauve/25 lg:block"
            />
            {L.how.steps.map((s, i) => (
              <div key={s.title.en} className="relative">
                <span className="relative grid size-10 place-items-center rounded-full bg-sf-mauve text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-5 font-display text-xl">{tx(s.title)}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {tx(s.body)}
                </p>
              </div>
            ))}
          </StaggerGrid>
          <p className="mt-10 text-center text-xs italic text-muted-foreground">
            {tx(L.how.note)}
          </p>
        </div>
      </section>

      {/* 7. Inside the B2B portal */}
      <section className="bg-sf-ivory py-20 md:py-28">
        <div className="mx-auto max-w-[1440px] px-4 md:px-8">
          <div className="grid gap-6 md:grid-cols-2 md:items-end">
            <div>
              <SectionEyebrow>{tx(L.inside.kicker)}</SectionEyebrow>
              <MaskText as="h2" className={cn("mt-5", h2Cls)} text={tx(L.inside.title)} />
            </div>
            <p className="text-base leading-relaxed text-muted-foreground">
              {tx(L.inside.note)}
            </p>
          </div>
          <StaggerGrid revision="portal" className="mt-12 grid gap-4 md:grid-cols-3">
            {L.inside.cards.map((c) => {
              const Icon = CARD_ICONS[c.key as keyof typeof CARD_ICONS];
              return (
                <div
                  key={c.key}
                  className="rounded-[1.5rem] border border-sf-mauve/15 bg-white p-7 transition-[transform,border-color] duration-300 ease-[var(--ease-out-strong)] [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:border-sf-mauve/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-11 place-items-center rounded-full bg-sf-mauve/10 text-sf-mauve">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-sf-mauve rtl:tracking-normal">
                      <Lock className="size-3" aria-hidden />
                      {tx(
                        c.unlock === "validation"
                          ? L.inside.afterValidation
                          : L.inside.afterFirstOrder,
                      )}
                    </span>
                  </div>
                  <h3 className="mt-6 font-display text-xl">{tx(c.title)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {tx(c.body)}
                  </p>
                </div>
              );
            })}
          </StaggerGrid>
        </div>
      </section>

      {/* 8. Official cabin formats */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-[1440px] px-4 md:px-8">
          <div className="mx-auto max-w-xl text-center">
            <SectionEyebrow center>
              {ar ? "منتجات الكابينة الاحترافية" : "Official cabin catalogue"}
            </SectionEyebrow>
            <MaskText
              as="h2"
              className={cn("mt-5", h2Cls)}
              text={
                ar
                  ? "أحجام مهنية لجلسات السبا والعيادات"
                  : "Treatment-room formats & cabin sizes"
              }
            />
            <p className="mt-4 text-sm text-muted-foreground sm:text-base">
              {ar
                ? "تنسيقات كبيرة مصنّعة في فرنسا ومخصصة للاستخدام الاحترافي فقط."
                : "Large-format products made in France, for licensed therapists and clinicians only."}
            </p>
          </div>
          <StaggerGrid
            revision="cabin"
            className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4"
          >
            {CABIN_TILES.map((img) => (
              <div
                key={img.src}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-sf-mauve/15 bg-sf-ivory"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 640px) 25vw, 45vw"
                  className="object-cover transition-transform duration-[900ms] ease-[var(--ease-out-strong)] motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-105"
                />
              </div>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* 9. FAQ */}
      <section className="bg-sf-ivory py-20 md:py-28">
        <div className="mx-auto max-w-[800px] px-4 md:px-6">
          <div className="text-center">
            <SectionEyebrow center>{tx(L.faq.kicker)}</SectionEyebrow>
            <MaskText as="h2" className={cn("mt-5", h2Cls)} text={tx(L.faq.title)} />
          </div>
          <div className="mt-10 divide-y divide-sf-mauve/15 rounded-[1.5rem] border border-sf-mauve/15 bg-white px-6">
            {L.faq.items.map((item) => (
              <details key={item.q.en} className="group py-4">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.12em] text-foreground transition-colors hover:text-sf-mauve rtl:tracking-normal [&::-webkit-details-marker]:hidden">
                  <span>{tx(item.q)}</span>
                  <ChevronDown
                    className="size-4 shrink-0 text-sf-mauve transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="mt-2 pb-2 text-sm leading-relaxed text-muted-foreground">
                  {tx(item.a)}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Closing call to action */}
      <section className="bg-white px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-sf-mauve/15 bg-sf-ivory px-6 py-14 text-center md:px-16 md:py-20">
          <SectionEyebrow center>
            {ar ? "انضموا إلينا" : "Join the network"}
          </SectionEyebrow>
          <MaskText
            as="h2"
            className={cn("mt-5", h2Cls)}
            text={
              ar
                ? "هل أنتم مستعدون لتقديم آيوما باريس لعملائكم؟"
                : "Ready to offer IOMA Paris to your clients?"
            }
          />
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a
              href="#apply-form"
              className={cn(pillBtn, "bg-foreground text-background hover:bg-sf-mauve")}
            >
              <span>{ar ? "قدّم طلبك الآن" : "Apply now"}</span>
              <ArrowDown className="size-4" aria-hidden />
            </a>
            <Link
              href="/partners"
              className={cn(
                pillBtn,
                "border border-foreground/25 bg-white text-foreground hover:border-sf-mauve hover:bg-sf-mauve/10",
              )}
            >
              <MapPin className="size-4" aria-hidden />
              <span>{ar ? "اكتشف شركاءنا" : "See our partners"}</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
