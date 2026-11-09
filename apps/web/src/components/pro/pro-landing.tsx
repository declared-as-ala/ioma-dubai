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
import { tr } from "@/lib/l10n";
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
  {
    value: "spa",
    en: "Luxury Hotel Spa / Day Spa",
    fr: "Spa d'hôtel de luxe / Day spa",
    ar: "سبا فندقي فاخر / سبا نهاري",
  },
  {
    value: "clinic",
    en: "Aesthetic Medical Clinic",
    fr: "Clinique médicale esthétique",
    ar: "عيادة طبية تجميلية",
  },
  {
    value: "beauty_institute",
    en: "Beauty Institute / Salon",
    fr: "Institut de beauté / Salon haut de gamme",
    ar: "معهد تجميل / صالون راقٍ",
  },
  {
    value: "hotel",
    en: "Luxury Hotel / Resort",
    fr: "Hôtel / Resort de luxe",
    ar: "فندق / منتجع فاخر",
  },
  {
    value: "retail",
    en: "High-end Retail / Concept Store",
    fr: "Boutique haut de gamme / Concept store",
    ar: "متجر تجزئة راقٍ",
  },
  {
    value: "distributor",
    en: "Authorized Distributor",
    fr: "Distributeur agréé",
    ar: "موزع إقليمي معتمد",
  },
];

function RegistrationForm() {
  const { tx, loc } = useTx();
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
            {tr(loc, {
              en: "Application Workflow",
              fr: "Étapes du traitement de la demande",
              ar: "مراحل معالجة الطلب",
            })}
          </p>
          <ol className="space-y-2 text-xs">
            <li className="flex items-center gap-2 text-emerald-700 font-medium">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>
                {tr(loc, {
                  en: "1. Application Submitted (Under Review)",
                  fr: "1. Demande envoyée (en cours d'examen)",
                  ar: "١. تم استلام الطلب بنجاح (قيد المعالجة)",
                })}
              </span>
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Clock className="size-4 shrink-0 text-sf-mauve" />
              <span>
                {tr(loc, {
                  en: "2. Document & Trade Licence Verification (24–48h)",
                  fr: "2. Vérification des documents et de la licence commerciale (24–48 h)",
                  ar: "٢. التحقق ومطابقة الرخصة التجارية (خلال ٢٤–٤٨ ساعة)",
                })}
              </span>
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0 text-muted-foreground" />
              <span>
                {tr(loc, {
                  en: "3. Account Approval & Official Credentials",
                  fr: "3. Validation du compte et identifiants officiels",
                  ar: "٣. اعتماد الحساب وإصدار بيانات الدخول الرسمية",
                })}
              </span>
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <ShoppingBag className="size-4 shrink-0 text-muted-foreground" />
              <span>
                {tr(loc, {
                  en: "4. Full Access to B2B Wholesale Portal",
                  fr: "4. Accès complet au portail B2B de vente en gros",
                  ar: "٤. الوصول إلى البوابة المهنية وأسعار الجملة",
                })}
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
        <span>
          {tr(loc, {
            en: "Partnership Application",
            fr: "Demande de partenariat",
            ar: "طلب اعتماد شراكة B2B",
          })}
        </span>
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
          placeholder: tr(loc, {
            en: "Spa, clinic or establishment name",
            fr: "Nom du spa, de la clinique ou de l'établissement",
            ar: "اسم السبا أو العيادة أو المعهد",
          }),
        })}

        {/* Business Type & Emirate */}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-foreground">
            {tr(loc, {
              en: "Establishment Type *",
              fr: "Type d'établissement *",
              ar: "نوع المنشأة *",
            })}
            <select
              name="businessType"
              defaultValue=""
              className={cn(selectField, "mt-1")}
              aria-invalid={!!errors.businessType}
            >
              <option value="" disabled>
                {tr(loc, {
                  en: "Select type...",
                  fr: "Choisir le type…",
                  ar: "اختر النوع...",
                })}
              </option>
              {BUSINESS_TYPES.map((bt) => (
                <option key={bt.value} value={bt.value}>
                  {bt[loc]}
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
            {tr(loc, { en: "Emirate *", fr: "Émirat *", ar: "الإمارة *" })}
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
          {textInput(
            "city",
            tr(loc, {
              en: "City / Area",
              fr: "Ville / Quartier",
              ar: "المدينة / المنطقة",
            }),
            undefined,
            {
              placeholder: tr(loc, {
                en: "E.g. Jumeirah, Downtown",
                fr: "Ex. : Jumeirah, Downtown",
                ar: "مثال: جميرا، وسط المدينة",
              }),
              maxLength: 80,
            },
          )}
          {textInput(
            "address",
            tr(loc, {
              en: "Business Address",
              fr: "Adresse professionnelle",
              ar: "العنوان التجاري",
            }),
            undefined,
            {
              placeholder: tr(loc, {
                en: "Street, building, unit",
                fr: "Rue, bâtiment, unité",
                ar: "الشارع، المبنى",
              }),
              maxLength: 180,
            },
          )}
        </div>

        {/* Trade Licence & Website */}
        <div className="grid gap-3 sm:grid-cols-2">
          {textInput(
            "tradeLicenceNumber",
            tr(loc, {
              en: "Trade Licence Number",
              fr: "Numéro de licence commerciale",
              ar: "رقم الرخصة التجارية",
            }),
            undefined,
            {
              placeholder: tr(loc, {
                en: "DED / Free Zone licence no.",
                fr: "N° de licence DED / zone franche",
                ar: "رقم الرخصة بدبي / الإمارات",
              }),
              maxLength: 80,
            },
          )}
          {textInput(
            "webOrSocial",
            tr(loc, {
              en: "Website or Instagram",
              fr: "Site web ou Instagram",
              ar: "الموقع أو حساب إنستغرام",
            }),
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
          {tr(loc, {
            en: "Partnership message or requirements (optional)",
            fr: "Message ou besoins du partenariat (facultatif)",
            ar: "رسالة أو تفاصيل إضافية (اختياري)",
          })}
          <textarea
            name="message"
            rows={2}
            maxLength={1000}
            placeholder={tr(loc, {
              en: "Tell us about your cabin setup, treatment rooms and interests...",
              fr: "Parlez-nous de votre cabine, de vos salles de soins et de vos attentes…",
              ar: "أخبرنا عن غرف العلاج وعدد الأسرّة والخدمات المقدمة...",
            })}
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
          : tr(loc, {
              en: "Submit Partnership Application",
              fr: "Envoyer la demande de partenariat",
              ar: "إرسال طلب الانضمام",
            })}
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
  const L = LANDING;

  const proof = [
    {
      icon: Cpu,
      v: tr(loc, { en: "MEMS", fr: "MEMS", ar: "MEMS" }),
      l: tr(loc, {
        en: "Objective skin measurement",
        fr: "Mesure objective de la peau",
        ar: "حساسات دقيقة للقياس الموضوعي",
      }),
    },
    {
      icon: FlaskConical,
      v: "40,000+",
      l: tr(loc, {
        en: "possible In.Lab formulas",
        fr: "formules In.Lab possibles",
        ar: "تركيبة ممكنة مع In.Lab",
      }),
    },
    {
      icon: BadgePercent,
      v: "B2B",
      l: tr(loc, {
        en: "dedicated wholesale pricing in AED",
        fr: "tarifs de gros dédiés en AED",
        ar: "أسعار جملة مخصصة بالدرهم",
      }),
    },
    {
      icon: GraduationCap,
      v: tr(loc, { en: "Training", fr: "Formation", ar: "تدريب" }),
      l: tr(loc, {
        en: "videos and step-by-step protocols",
        fr: "vidéos et protocoles pas à pas",
        ar: "فيديوهات وبروتوكولات خطوة بخطوة",
      }),
    },
  ];

  const pillars = [
    {
      icon: Cpu,
      t: tr(loc, {
        en: "i-Diag & In.Lab Devices",
        fr: "Appareils i-Diag et In.Lab",
        ar: "أجهزة i-Diag و In.Lab",
      }),
      b: tr(loc, {
        en: "Turnkey diagnostic and drop-by-drop compounding hardware for prestigious treatment rooms.",
        fr: "Matériel clé en main de diagnostic et de préparation goutte à goutte pour des cabines de soins d'exception.",
        ar: "أجهزة تشخيص وتركيب مصغرة توضع في عيادتكم أو السبا الخاص بكم لتوفير تجربة استثنائية.",
      }),
    },
    {
      icon: FlaskConical,
      t: tr(loc, {
        en: "Exclusive Cabin Formats",
        fr: "Formats cabine exclusifs",
        ar: "منتجات الكابينة الحصرية",
      }),
      b: tr(loc, {
        en: "Professional-sized cleansers, peelings, serums and massage concentrates formulated exclusively for therapists.",
        fr: "Nettoyants, peelings, sérums et concentrés de massage en formats professionnels, formulés exclusivement pour les praticiens.",
        ar: "أحجام مهنية مخصصة للمعالجين مع بروتوكولات تدليك وتقشير متقدمة.",
      }),
    },
    {
      icon: BadgePercent,
      t: tr(loc, {
        en: "B2B Wholesale Margins",
        fr: "Tarifs de gros et marges B2B",
        ar: "أسعار الجملة وهوامش ربح مجزية",
      }),
      b: tr(loc, {
        en: "Dedicated wholesale tier with transparent AED pricing, low MOQs, and retail resale support.",
        fr: "Grille de gros dédiée avec tarifs transparents en AED, minimums de commande réduits et accompagnement à la revente.",
        ar: "قائمة أسعار مخصصة للشركاء المعتمدين مع شروط طلب مرنة ودعم لإعادة البيع بالتجزئة.",
      }),
    },
    {
      icon: GraduationCap,
      t: tr(loc, {
        en: "Masterclass Certification",
        fr: "Certification Masterclass",
        ar: "أكاديمية تدريب معتمدة",
      }),
      b: tr(loc, {
        en: "Comprehensive video training modules and protocol step guides empowering your aesthetic team.",
        fr: "Modules de formation vidéo complets et guides de protocoles pas à pas pour accompagner votre équipe esthétique.",
        ar: "فيديوهات تدريبية وكتيبات بروتوكولية خطوة بخطوة تضمن احترافية طاقم السبا لديكم.",
      }),
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
              text={tr(loc, {
                en: "French bespoke skincare, for luxury spas & clinics.",
                fr: "Le soin sur mesure à la française, pour les spas et cliniques de luxe.",
                ar: "تميّز العناية الشخصية الفرنسية في مساحتكم المهنية.",
              })}
              className="mt-6 text-balance font-display text-[clamp(2.3rem,5.2vw,4.6rem)] font-medium leading-[1.04] tracking-[-0.03em] text-foreground rtl:leading-[1.3] rtl:tracking-normal"
            />

            <Reveal className="mt-7 max-w-xl space-y-8">
              <p
                data-cine-item
                className="text-base font-light leading-relaxed text-muted-foreground sm:text-lg"
              >
                {tr(loc, {
                  en: "Join the official IOMA Paris partner network across the UAE: exclusive treatment-room formats, high-precision MEMS diagnostic technology, masterclass protocols and dedicated wholesale pricing.",
                  fr: "Rejoignez le réseau officiel de partenaires IOMA Paris aux Émirats : formats cabine exclusifs, technologie de diagnostic MEMS de haute précision, protocoles masterclass et tarifs de gros dédiés.",
                  ar: "انضموا إلى شبكة شركاء آيوما باريس في الإمارات: أحجام كابينة حصرية، أجهزة تشخيص MEMS المتقدمة، تدريب معتمد، وأسعار جملة مخصصة للمحترفين.",
                })}
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
                  <span>
                    {tr(loc, {
                      en: "Apply to become a partner",
                      fr: "Devenir partenaire",
                      ar: "قدّم طلب الاعتماد",
                    })}
                  </span>
                  <ArrowDown className="size-4" aria-hidden />
                </a>
                <Link
                  href="/login?redirect=/portal"
                  className={cn(
                    pillBtn,
                    "border border-foreground/25 bg-white text-foreground hover:border-sf-mauve hover:bg-sf-mauve/10",
                  )}
                >
                  <span>
                    {tr(loc, {
                      en: "Partner sign in",
                      fr: "Connexion partenaires",
                      ar: "تسجيل دخول الشركاء",
                    })}
                  </span>
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
                alt={tr(loc, {
                  en: "An IOMA advisor presenting a product",
                  fr: "Une conseillère IOMA présentant un produit",
                  ar: "مستشارة آيوما تقدّم منتجًا",
                })}
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover object-[50%_25%]"
              />
            </ImageReveal>
          </div>
          <div className="lg:col-span-7">
            <SectionEyebrow>
              {tr(loc, {
                en: "Scientific heritage",
                fr: "Héritage scientifique",
                ar: "الريادة العلمية لآيوما",
              })}
            </SectionEyebrow>
            <MaskText
              as="h2"
              className={cn("mt-5", h2Cls)}
              text={tr(loc, {
                en: "Proven precision: 40,000+ formulations & MEMS technology",
                fr: "Une précision éprouvée : plus de 40 000 formulations et la technologie MEMS",
                ar: "أكثر من ٤٠٬٠٠٠ تركيبة ودقة ميكروإلكترونية مثبتة",
              })}
            />
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
              {tr(loc, {
                en: "Founded in Paris, IOMA harnesses micro-electromechanical sensors (MEMS) to read skin hydration, cellular renewal and redness with objective precision before recommending or compounding bespoke formulas.",
                fr: "Née à Paris, IOMA s'appuie sur des capteurs micro-électromécaniques (MEMS) pour lire l'hydratation, le renouvellement cellulaire et les rougeurs de la peau avec une précision objective, avant de recommander ou de préparer des formules sur mesure.",
                ar: "تعتمد آيوما باريس على مستشعرات دقيقة مستمدة من صناعة الإلكترونيات المتقدمة لقياس رطوبة البشرة وتجددها واحمرارها بدقة موضوعية، قبل اقتراح التركيبات المخصصة أو تحضيرها.",
              })}
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
                {tr(loc, {
                  en: "Technology in your cabin",
                  fr: "La technologie dans votre cabine",
                  ar: "التقنية في كابينتكم",
                })}
              </SectionEyebrow>
              <MaskText
                as="h2"
                className={cn("mt-5", h2Cls)}
                text={tr(loc, {
                  en: "Devices that read the skin and create the formula",
                  fr: "Des appareils qui lisent la peau et créent la formule",
                  ar: "أجهزة تقرأ البشرة وتصنع التركيبة",
                })}
              />
            </div>
            <p className="text-base leading-relaxed text-muted-foreground">
              {tr(loc, {
                en: "An approved partner offers clients a live diagnosis followed by care made for their skin, in a single cabin experience.",
                fr: "Un partenaire agréé offre à ses clientes un diagnostic en direct suivi d'un soin pensé pour leur peau, au sein d'une seule et même expérience en cabine.",
                ar: "يقدّم الشريك المعتمد لعملائه تشخيصًا حيًّا ثم عناية مصممة لبشرتهم، في تجربة واحدة داخل الكابينة.",
              })}
            </p>
          </div>
          <StaggerGrid revision="devices" className="mt-12 grid gap-4 md:grid-cols-5">
            <div className="group relative aspect-[16/10] overflow-hidden rounded-[1.5rem] bg-white md:col-span-3">
              <Image
                src="/images/pro/gallery-1.jpg"
                alt={tr(loc, {
                  en: "An IOMA Sphere during a consultation",
                  fr: "Une IOMA Sphere lors d'une consultation",
                  ar: "جهاز IOMA Sphere أثناء استشارة",
                })}
                fill
                sizes="(min-width: 768px) 60vw, 100vw"
                className="object-cover transition-transform duration-[900ms] ease-[var(--ease-out-strong)] motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-[1.04]"
              />
            </div>
            <div className="group relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-white md:col-span-2 md:aspect-auto">
              <Image
                src="/images/pro/gallery-3.jpg"
                alt={tr(loc, {
                  en: "The interactive diagnosis screen",
                  fr: "L'écran de diagnostic interactif",
                  ar: "شاشة التشخيص التفاعلية",
                })}
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
              text={tr(loc, {
                en: "Four steps to official partnership",
                fr: "Quatre étapes vers le partenariat officiel",
                ar: "مسار الانضمام والاعتماد الرسمي",
              })}
            />
            <p className="mt-4 text-sm text-muted-foreground sm:text-base">
              {tr(loc, {
                en: "A clear workflow from first application to your official trade credentials.",
                fr: "Un parcours clair, de la première demande à vos identifiants professionnels officiels.",
                ar: "عملية بسيطة وواضحة من الطلب إلى تفعيل البوابة المهنية.",
              })}
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
              {tr(loc, {
                en: "Official cabin catalogue",
                fr: "Catalogue cabine officiel",
                ar: "منتجات الكابينة الاحترافية",
              })}
            </SectionEyebrow>
            <MaskText
              as="h2"
              className={cn("mt-5", h2Cls)}
              text={tr(loc, {
                en: "Treatment-room formats & cabin sizes",
                fr: "Formats cabine et tailles professionnelles",
                ar: "أحجام مهنية لجلسات السبا والعيادات",
              })}
            />
            <p className="mt-4 text-sm text-muted-foreground sm:text-base">
              {tr(loc, {
                en: "Large-format products made in France, for licensed therapists and clinicians only.",
                fr: "Produits grand format fabriqués en France, réservés aux praticiens et cliniciens agréés.",
                ar: "تنسيقات كبيرة مصنّعة في فرنسا ومخصصة للاستخدام الاحترافي فقط.",
              })}
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
            {tr(loc, {
              en: "Join the network",
              fr: "Rejoindre le réseau",
              ar: "انضموا إلينا",
            })}
          </SectionEyebrow>
          <MaskText
            as="h2"
            className={cn("mt-5", h2Cls)}
            text={tr(loc, {
              en: "Ready to offer IOMA Paris to your clients?",
              fr: "Prêt(e) à proposer IOMA Paris à vos clients ?",
              ar: "هل أنتم مستعدون لتقديم آيوما باريس لعملائكم؟",
            })}
          />
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a
              href="#apply-form"
              className={cn(pillBtn, "bg-foreground text-background hover:bg-sf-mauve")}
            >
              <span>
                {tr(loc, {
                  en: "Apply now",
                  fr: "Candidater maintenant",
                  ar: "قدّم طلبك الآن",
                })}
              </span>
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
              <span>
                {tr(loc, {
                  en: "See our partners",
                  fr: "Voir nos partenaires",
                  ar: "اكتشف شركاءنا",
                })}
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
