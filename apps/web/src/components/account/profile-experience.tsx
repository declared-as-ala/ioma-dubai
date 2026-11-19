"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { MotionConfig, motion } from "motion/react";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Check,
  KeyRound,
  Mail,
  MailWarning,
  Package,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import type { Locale } from "@ioma/config";
import { profileSchema, type ProfileInput } from "@ioma/validation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LOCALE_LABELS } from "@ioma/config";
import { useProfileQuery, useUpdateProfileMutation } from "@/hooks/use-account";
import { useResendMyVerificationMutation } from "@/hooks/use-auth";
import { useOrdersQuery } from "@/hooks/use-orders";
import { useApplications } from "@/hooks/use-professional";
import {
  useCancelAppointmentMutation,
  useMyAppointmentsQuery,
  type MyAppointment,
} from "@/hooks/use-appointments";
import { formatMinor } from "@/lib/money";
import { tr, toLoc } from "@/lib/l10n";

// ───────────────────────── building blocks ─────────────────────────

const label = "text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground";

function Card({
  id,
  icon: Icon,
  title,
  hint,
  action,
  children,
}: {
  id?: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="scroll-mt-24 rounded-[1.75rem] border border-border/60 bg-card p-6 shadow-xs sm:p-9"
    >
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-start gap-3.5">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-sf-champagne/15 text-sf-champagne">
            <Icon className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-xl font-medium sm:text-2xl">{title}</h2>
            {hint ? (
              <p className="mt-1 text-xs leading-6 text-muted-foreground">{hint}</p>
            ) : null}
          </div>
        </div>
        {action}
      </header>
      <div className="pt-6">{children}</div>
    </motion.section>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-muted/50 ${className}`} />;
}

function Empty({ children, cta }: { children: React.ReactNode; cta?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/80 bg-sf-ivory/60 px-6 py-8 text-center">
      <p className="text-sm text-muted-foreground">{children}</p>
      {cta ? <div className="mt-4">{cta}</div> : null}
    </div>
  );
}

function ErrorState({ onRetry, text }: { onRetry: () => void; text: string }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-destructive/25 bg-destructive/5 p-5 text-center"
    >
      <p className="text-sm text-destructive">{text}</p>
      <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={onRetry}>
        ↻
      </Button>
    </div>
  );
}

function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-10 items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-foreground/80 transition-colors hover:text-foreground"
    >
      <span>{children}</span>
      <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-rotate-90" />
    </Link>
  );
}

// ───────────────────────── sections ─────────────────────────

function Overview() {
  const loc = toLoc(useLocale());
  const profile = useProfileQuery();
  const resend = useResendMyVerificationMutation();
  const p = profile.data;
  if (!p) return <Skeleton className="h-44" />;
  const initials =
    [p.firstName?.[0], p.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "IO";
  const links: Array<[string, string]> = [
    ["#orders", tr(loc, { en: "My orders", fr: "Mes commandes", ar: "طلباتي" })],
    ["#bookings", tr(loc, { en: "My bookings", fr: "Mes rendez-vous", ar: "مواعيدي" })],
    ["#security", tr(loc, { en: "Security", fr: "Sécurité", ar: "الأمان" })],
    ["#partner", tr(loc, { en: "Partner", fr: "Partenaire", ar: "الشراكة" })],
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-[2rem] border border-sf-champagne/30 bg-gradient-to-br from-sf-ivory via-background to-sf-champagne/10 p-7 sm:p-10"
    >
      <p className={label}>
        {tr(loc, { en: "My account", fr: "Mon compte", ar: "حسابي" })}
      </p>
      <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center">
        <span
          aria-hidden
          className="flex size-20 shrink-0 items-center justify-center rounded-full bg-foreground font-display text-2xl tracking-[0.18em] text-background"
        >
          {initials}
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-light leading-tight sm:text-4xl">
            {tr(loc, {
              en: `Hello, ${p.firstName}`,
              fr: `Bonjour, ${p.firstName}`,
              ar: `مرحباً، ${p.firstName}`,
            })}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="size-3.5" />
              <bdi>{p.email}</bdi>
            </span>
            {p.emailVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[0.7rem] font-medium text-emerald-700">
                <BadgeCheck className="size-3.5" />
                {tr(loc, {
                  en: "Email verified",
                  fr: "E-mail vérifié",
                  ar: "البريد مؤكَّد",
                })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[0.7rem] font-medium text-amber-700">
                <MailWarning className="size-3.5" />
                {tr(loc, {
                  en: "Email not verified",
                  fr: "E-mail non vérifié",
                  ar: "البريد غير مؤكَّد",
                })}
              </span>
            )}
          </p>
        </div>
      </div>

      {!p.emailVerified && (
        <div
          role="status"
          className="mt-7 flex flex-col gap-3 rounded-2xl border border-amber-500/25 bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm leading-6 text-muted-foreground">
            {resend.data?.status === "sent"
              ? tr(loc, {
                  en: "A new email is on its way. Check your inbox and spam folder.",
                  fr: "Un nouvel e-mail est en route. Vérifiez vos spams.",
                  ar: "رسالة جديدة في الطريق. تفقّدوا الرسائل غير المرغوبة.",
                })
              : resend.data?.status === "cooldown"
                ? tr(loc, {
                    en: "An email was just sent. Please wait a minute.",
                    fr: "Un e-mail vient d'être envoyé. Patientez une minute.",
                    ar: "تم إرسال رسالة للتو. انتظروا دقيقة.",
                  })
                : resend.isError
                  ? tr(loc, {
                      en: "Too many requests. Try again in a few minutes.",
                      fr: "Trop de demandes. Réessayez dans quelques minutes.",
                      ar: "طلبات كثيرة. حاولوا لاحقاً.",
                    })
                  : tr(loc, {
                      en: "Confirm your email to order, book and apply as a partner.",
                      fr: "Confirmez votre e-mail pour commander, réserver et candidater.",
                      ar: "أكّدوا بريدكم للطلب والحجز والتقدّم كشريك.",
                    })}
          </p>
          <Button
            variant="outline"
            className="h-10 shrink-0 rounded-full px-5 text-xs uppercase tracking-widest"
            disabled={resend.isPending}
            onClick={() => resend.mutate()}
          >
            {tr(loc, {
              en: "Resend email",
              fr: "Renvoyer l'e-mail",
              ar: "إعادة الإرسال",
            })}
          </Button>
        </div>
      )}

      <nav
        aria-label={tr(loc, { en: "Quick access", fr: "Accès rapide", ar: "وصول سريع" })}
        className="mt-7 flex flex-wrap gap-2.5"
      >
        {links.map(([href, text]) => (
          <a
            key={href}
            href={href}
            className="inline-flex min-h-11 items-center rounded-full border border-border/70 bg-background/80 px-5 text-xs font-medium uppercase tracking-[0.16em] transition-colors hover:border-foreground/40 hover:bg-background"
          >
            {text}
          </a>
        ))}
      </nav>
    </motion.div>
  );
}

function PersonalInfo() {
  const t = useTranslations("Account");
  const locale = useLocale() as Locale;
  const loc = toLoc(locale);
  const profile = useProfileQuery();
  const update = useUpdateProfileMutation();
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      dateOfBirth: "",
      skinConcerns: [],
      newsletterOptIn: false,
      preferredLocale: locale,
    },
  });

  useEffect(() => {
    if (!profile.data) return;
    form.reset({
      firstName: profile.data.firstName,
      lastName: profile.data.lastName,
      phone: profile.data.phone ?? "",
      dateOfBirth: profile.data.dateOfBirth?.slice(0, 10) ?? "",
      skinConcerns: profile.data.skinConcerns,
      newsletterOptIn: profile.data.newsletterOptIn,
      preferredLocale: profile.data.preferredLocale,
    });
  }, [form, profile.data]);

  const bad = tr(loc, {
    en: "Please check this field.",
    fr: "Veuillez vérifier ce champ.",
    ar: "يرجى التحقق من هذا الحقل.",
  });

  return (
    <Card
      id="personal"
      icon={UserRound}
      title={tr(loc, {
        en: "Personal information",
        fr: "Informations personnelles",
        ar: "المعلومات الشخصية",
      })}
      hint={tr(loc, {
        en: "Keep your details up to date for deliveries and appointments.",
        fr: "Gardez vos informations à jour pour les livraisons et les rendez-vous.",
        ar: "حافظوا على تحديث بياناتكم للتوصيل والمواعيد.",
      })}
    >
      {profile.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : profile.isError || !profile.data ? (
        <ErrorState text={t("loadError")} onRetry={() => profile.refetch()} />
      ) : (
        <form
          noValidate
          className="space-y-8"
          onSubmit={form.handleSubmit((values) => update.mutate(values))}
        >
          <FieldGroup>
            <div className="grid gap-5 sm:grid-cols-2">
              <Controller
                name="firstName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="pf-first" className={label}>
                      {t("profile.firstName")}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="pf-first"
                      autoComplete="given-name"
                      className="min-h-12 rounded-xl"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError>{bad}</FieldError>}
                  </Field>
                )}
              />
              <Controller
                name="lastName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="pf-last" className={label}>
                      {t("profile.lastName")}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="pf-last"
                      autoComplete="family-name"
                      className="min-h-12 rounded-xl"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError>{bad}</FieldError>}
                  </Field>
                )}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="pf-email" className={label}>
                  {t("profile.email")}
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="pf-email"
                    dir="ltr"
                    value={profile.data.email}
                    readOnly
                    aria-readonly="true"
                    className="min-h-12 cursor-not-allowed rounded-xl bg-muted/40 pe-11 text-muted-foreground"
                  />
                  {profile.data.emailVerified && (
                    <BadgeCheck className="absolute end-3 top-1/2 size-4 -translate-y-1/2 text-emerald-600" />
                  )}
                </div>
              </Field>
              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="pf-phone" className={label}>
                      {t("profile.phone")}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="pf-phone"
                      type="tel"
                      dir="ltr"
                      autoComplete="tel"
                      placeholder="+971 50 000 0000"
                      className="min-h-12 rounded-xl"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError>
                        {tr(loc, {
                          en: "Enter a valid phone number.",
                          fr: "Saisissez un numéro valide.",
                          ar: "أدخلوا رقم هاتف صحيحاً.",
                        })}
                      </FieldError>
                    )}
                  </Field>
                )}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Controller
                name="dateOfBirth"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="pf-dob" className={label}>
                      {t("profile.dateOfBirth")}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="pf-dob"
                      type="date"
                      autoComplete="bday"
                      className="min-h-12 rounded-xl"
                    />
                  </Field>
                )}
              />
              <Controller
                name="preferredLocale"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="pf-lang" className={label}>
                      {t("profile.preferredLocale")}
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="pf-lang" className="min-h-12 w-full rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["en", "fr", "ar"] as const).map((value) => (
                          <SelectItem key={value} value={value}>
                            {LOCALE_LABELS[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            </div>
          </FieldGroup>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-6">
            <div aria-live="polite" className="min-h-5 text-sm">
              {update.isSuccess && !form.formState.isDirty && (
                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                  <Check className="size-4" />
                  {t("profile.saved")}
                </span>
              )}
              {update.isError && (
                <span role="alert" className="text-destructive">
                  {t("saveError")}
                </span>
              )}
            </div>
            <Button
              type="submit"
              disabled={update.isPending}
              className="h-12 rounded-full px-9 text-xs uppercase tracking-widest"
            >
              {update.isPending ? t("profile.saving") : t("profile.save")}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

function Security() {
  const loc = toLoc(useLocale());
  const profile = useProfileQuery();
  const resend = useResendMyVerificationMutation();
  const verified = profile.data?.emailVerified;
  return (
    <Card
      id="security"
      icon={ShieldCheck}
      title={tr(loc, { en: "Security", fr: "Sécurité", ar: "الأمان" })}
      hint={tr(loc, {
        en: "Protect your account and keep your email confirmed.",
        fr: "Protégez votre compte et gardez votre e-mail confirmé.",
        ar: "احموا حسابكم وأبقوا بريدكم مؤكَّداً.",
      })}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/60 p-5">
          <KeyRound className="size-5 text-sf-champagne" />
          <h3 className="mt-3 text-sm font-medium">
            {tr(loc, { en: "Password", fr: "Mot de passe", ar: "كلمة المرور" })}
          </h3>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            {tr(loc, {
              en: "Change your password regularly. Other sessions are signed out when you do.",
              fr: "Changez-le régulièrement. Les autres sessions sont déconnectées à ce moment.",
              ar: "غيّروها بانتظام. تُسجَّل الجلسات الأخرى خروجاً عند ذلك.",
            })}
          </p>
          <div className="mt-3">
            <TextLink href="/account/security">
              {tr(loc, {
                en: "Change password",
                fr: "Changer le mot de passe",
                ar: "تغيير كلمة المرور",
              })}
            </TextLink>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 p-5">
          {verified ? (
            <BadgeCheck className="size-5 text-emerald-600" />
          ) : (
            <MailWarning className="size-5 text-amber-600" />
          )}
          <h3 className="mt-3 text-sm font-medium">
            {tr(loc, {
              en: "Email address",
              fr: "Adresse e-mail",
              ar: "البريد الإلكتروني",
            })}
          </h3>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            {verified
              ? tr(loc, {
                  en: "Your email is verified.",
                  fr: "Votre e-mail est vérifié.",
                  ar: "بريدكم مؤكَّد.",
                })
              : resend.data?.status === "sent"
                ? tr(loc, {
                    en: "New email sent. Check your inbox.",
                    fr: "Nouvel e-mail envoyé. Consultez votre boîte.",
                    ar: "تم إرسال رسالة جديدة.",
                  })
                : tr(loc, {
                    en: "Not verified yet. Ordering, booking and partner applications are paused until you confirm.",
                    fr: "Pas encore vérifié. Commandes, rendez-vous et candidatures sont suspendus jusqu'à confirmation.",
                    ar: "غير مؤكَّد بعد. الطلب والحجز وطلبات الشراكة متوقفة حتى التأكيد.",
                  })}
          </p>
          {!verified && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 rounded-full text-xs uppercase tracking-widest"
              disabled={resend.isPending}
              onClick={() => resend.mutate()}
            >
              {tr(loc, {
                en: "Resend email",
                fr: "Renvoyer l'e-mail",
                ar: "إعادة الإرسال",
              })}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function Orders() {
  const t = useTranslations("Account.orders");
  const locale = useLocale() as Locale;
  const loc = toLoc(locale);
  const q = useOrdersQuery();
  const date = (v: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(v));
  return (
    <Card
      id="orders"
      icon={Package}
      title={tr(loc, { en: "My orders", fr: "Mes commandes", ar: "طلباتي" })}
      action={
        q.data?.length ? (
          <TextLink href="/account/orders">
            {tr(loc, { en: "Order history", fr: "Historique", ar: "السجل" })}
          </TextLink>
        ) : undefined
      }
    >
      {q.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : q.isError ? (
        <ErrorState
          text={tr(loc, {
            en: "Your orders could not be loaded.",
            fr: "Impossible de charger vos commandes.",
            ar: "تعذّر تحميل طلباتكم.",
          })}
          onRetry={() => q.refetch()}
        />
      ) : q.data?.length ? (
        <ul className="space-y-3">
          {q.data.slice(0, 4).map((o) => (
            <li
              key={o.orderNumber}
              className="flex flex-col gap-3 rounded-2xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-mono text-sm font-semibold tracking-wider">
                  <bdi>{o.orderNumber}</bdi>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {date(o.createdAt)} ·{" "}
                  <span className="rounded-full bg-sf-champagne/15 px-2 py-0.5 text-[0.68rem] font-medium text-foreground">
                    {t(`status.${o.fulfillmentStatus}`)}
                  </span>
                </p>
              </div>
              <div className="flex items-center justify-between gap-6 sm:justify-end">
                <p className="font-display text-lg">
                  <bdi>{formatMinor(o.totalMinor, locale)}</bdi>
                </p>
                <TextLink href={`/account/orders/${o.orderNumber}`}>
                  {tr(loc, { en: "Details", fr: "Détails", ar: "التفاصيل" })}
                </TextLink>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty
          cta={
            <TextLink href="/shop">
              {tr(loc, {
                en: "Discover the shop",
                fr: "Découvrir la boutique",
                ar: "اكتشفوا المتجر",
              })}
            </TextLink>
          }
        >
          {tr(loc, {
            en: "You have not placed an order yet.",
            fr: "Vous n'avez pas encore passé de commande.",
            ar: "لم تُجروا أي طلب بعد.",
          })}
        </Empty>
      )}
    </Card>
  );
}

function Bookings() {
  const locale = useLocale() as Locale;
  const loc = toLoc(locale);
  const q = useMyAppointmentsQuery();
  const cancel = useCancelAppointmentMutation();
  const [confirming, setConfirming] = useState<string | null>(null);
  const when = (v: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "short" }).format(
      new Date(v),
    );
  const statusLabel = (s: string) =>
    tr(loc, {
      en:
        {
          confirmed: "Confirmed",
          rescheduled: "Rescheduled",
          cancelled: "Cancelled",
          completed: "Completed",
          pending: "Pending",
        }[s] ?? s,
      fr:
        {
          confirmed: "Confirmé",
          rescheduled: "Reporté",
          cancelled: "Annulé",
          completed: "Terminé",
          pending: "En attente",
        }[s] ?? s,
      ar:
        {
          confirmed: "مؤكَّد",
          rescheduled: "أُعيدت جدولته",
          cancelled: "ملغى",
          completed: "مكتمل",
          pending: "قيد الانتظار",
        }[s] ?? s,
    });

  const now = Date.now();
  const list = q.data ?? [];
  const upcoming = list
    .filter((a) => new Date(a.startsAt).getTime() >= now && a.status !== "cancelled")
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  const previous = list.filter((a) => !upcoming.includes(a));

  const row = (a: MyAppointment, canEdit: boolean) => (
    <li key={a.id} className="rounded-2xl border border-border/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            <bdi>{a.service.name[locale] ?? a.service.name.en}</bdi>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            <bdi>{a.partner.name}</bdi> · {a.partner.city}
          </p>
          <p className="mt-2 text-sm">{when(a.startsAt)}</p>
        </div>
        <span className="rounded-full bg-sf-champagne/15 px-2.5 py-1 text-[0.68rem] font-medium">
          {statusLabel(a.status)}
        </span>
      </div>
      {canEdit && (
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-border/50 pt-3">
          <TextLink href={`/account/appointments/reschedule/${a.id}`}>
            {tr(loc, { en: "Reschedule", fr: "Reporter", ar: "إعادة الجدولة" })}
          </TextLink>
          {confirming === a.id ? (
            <span className="inline-flex flex-wrap items-center gap-2 text-xs">
              <span>
                {tr(loc, {
                  en: "Cancel this booking?",
                  fr: "Annuler ce rendez-vous ?",
                  ar: "إلغاء هذا الموعد؟",
                })}
              </span>
              <Button
                size="sm"
                variant="destructive"
                className="h-8 rounded-full text-xs"
                disabled={cancel.isPending}
                onClick={() =>
                  cancel.mutate(a.id, { onSettled: () => setConfirming(null) })
                }
              >
                {tr(loc, { en: "Yes, cancel", fr: "Oui, annuler", ar: "نعم، إلغاء" })}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 rounded-full text-xs"
                onClick={() => setConfirming(null)}
              >
                {tr(loc, { en: "Keep it", fr: "Conserver", ar: "إبقاء" })}
              </Button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(a.id)}
              className="min-h-10 text-xs font-medium uppercase tracking-[0.16em] text-destructive/90 hover:text-destructive"
            >
              {tr(loc, { en: "Cancel", fr: "Annuler", ar: "إلغاء" })}
            </button>
          )}
        </div>
      )}
    </li>
  );

  return (
    <Card
      id="bookings"
      icon={CalendarDays}
      title={tr(loc, { en: "My bookings", fr: "Mes rendez-vous", ar: "مواعيدي" })}
    >
      {q.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : q.isError ? (
        <ErrorState
          text={tr(loc, {
            en: "Your bookings could not be loaded.",
            fr: "Impossible de charger vos rendez-vous.",
            ar: "تعذّر تحميل مواعيدكم.",
          })}
          onRetry={() => q.refetch()}
        />
      ) : list.length === 0 ? (
        <Empty
          cta={
            <TextLink href="/partners">
              {tr(loc, {
                en: "Find a partner",
                fr: "Trouver un partenaire",
                ar: "ابحثوا عن شريك",
              })}
            </TextLink>
          }
        >
          {tr(loc, {
            en: "You have no bookings yet.",
            fr: "Vous n'avez pas encore de rendez-vous.",
            ar: "ليست لديكم مواعيد بعد.",
          })}
        </Empty>
      ) : (
        <div className="space-y-7">
          <div>
            <h3 className={label}>
              {tr(loc, { en: "Upcoming", fr: "À venir", ar: "القادمة" })}
            </h3>
            {upcoming.length ? (
              <ul className="mt-3 space-y-3">{upcoming.map((a) => row(a, true))}</ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                {tr(loc, {
                  en: "No upcoming appointment.",
                  fr: "Aucun rendez-vous à venir.",
                  ar: "لا مواعيد قادمة.",
                })}
              </p>
            )}
          </div>
          {previous.length > 0 && (
            <div>
              <h3 className={label}>
                {tr(loc, { en: "Previous", fr: "Passés", ar: "السابقة" })}
              </h3>
              <ul className="mt-3 space-y-3">
                {previous.slice(0, 5).map((a) => row(a, false))}
              </ul>
            </div>
          )}
          {cancel.isError && (
            <p role="alert" className="text-sm text-destructive">
              {tr(loc, {
                en: "The booking could not be cancelled.",
                fr: "Le rendez-vous n'a pas pu être annulé.",
                ar: "تعذّر إلغاء الموعد.",
              })}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function Partner() {
  const t = useTranslations("AccountExperience");
  const loc = toLoc(useLocale());
  const q = useApplications();
  // Only the latest application matters: the API allows one active application per customer.
  const app = q.data?.[0];
  const pending = ["submitted", "pending_review", "documents_requested"];
  return (
    <Card
      id="partner"
      icon={Store}
      title={tr(loc, {
        en: "IOMA partner",
        fr: "Partenaire IOMA",
        ar: "شريك IOMA",
      })}
    >
      {q.isLoading ? (
        <Skeleton className="h-24" />
      ) : q.isError ? (
        <ErrorState
          text={tr(loc, {
            en: "Your partner status could not be loaded.",
            fr: "Impossible de charger votre statut partenaire.",
            ar: "تعذّر تحميل حالة الشراكة.",
          })}
          onRetry={() => q.refetch()}
        />
      ) : !app || app.status === "rejected" ? (
        <div className="space-y-4">
          {app?.status === "rejected" && (
            <p className="rounded-2xl border border-border/60 bg-sf-ivory/60 p-4 text-sm leading-7 text-muted-foreground">
              {t("descriptions.rejected")}
            </p>
          )}
          <p className="max-w-xl text-sm leading-7 text-muted-foreground">
            {tr(loc, {
              en: "Run a spa, clinic, institute or hotel? Apply to join the IOMA Paris partner network for professional prices, online ordering and training.",
              fr: "Vous dirigez un spa, une clinique, un institut ou un hôtel ? Candidatez au réseau partenaire IOMA Paris : tarifs professionnels, commande en ligne et formation.",
              ar: "تديرون سبا أو عيادة أو معهداً أو فندقاً؟ قدّموا طلب الانضمام إلى شبكة شركاء IOMA Paris: أسعار مهنية وطلب عبر الإنترنت وتدريب.",
            })}
          </p>
          <Button
            asChild
            className="h-12 rounded-full px-8 text-xs uppercase tracking-widest"
          >
            <Link href="/professionals/apply">
              {tr(loc, {
                en: "Become a partner",
                fr: "Devenir partenaire",
                ar: "كونوا شركاء",
              })}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span
              data-testid="partner-status"
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                app.status === "approved"
                  ? "bg-emerald-500/10 text-emerald-700"
                  : app.status === "suspended"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-amber-500/10 text-amber-700"
              }`}
            >
              {pending.includes(app.status)
                ? tr(loc, {
                    en: "Pending review",
                    fr: "En cours d'examen",
                    ar: "قيد المراجعة",
                  })
                : t(`statuses.${app.status}`)}
            </span>
            {app.companyName && (
              <span className="text-sm text-muted-foreground">
                <bdi>{app.companyName}</bdi>
              </span>
            )}
          </div>
          <p className="max-w-xl text-sm leading-7 text-muted-foreground">
            {t(`descriptions.${app.status}`)}
          </p>
          {(app.status === "approved" ||
            app.status === "draft" ||
            app.status === "documents_requested") && (
            <Button
              asChild
              className="h-12 rounded-full px-8 text-xs uppercase tracking-widest"
            >
              <Link
                href={
                  app.status === "approved"
                    ? "/account/professional"
                    : "/professionals/apply"
                }
              >
                {app.status === "approved"
                  ? tr(loc, {
                      en: "Open my partner space",
                      fr: "Accéder à mon espace partenaire",
                      ar: "فتح مساحة الشريك",
                    })
                  : tr(loc, {
                      en: "Continue my application",
                      fr: "Poursuivre ma candidature",
                      ar: "متابعة طلبي",
                    })}
              </Link>
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

export function ProfileExperience() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto max-w-4xl space-y-7">
        <Overview />
        <PersonalInfo />
        <Orders />
        <Bookings />
        <Security />
        <Partner />
      </div>
    </MotionConfig>
  );
}
