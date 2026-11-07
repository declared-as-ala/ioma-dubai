"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { LOCALE_LABELS, type Locale } from "@ioma/config";
import { profileSchema, type ProfileInput } from "@ioma/validation";
import { useConcernsQuery } from "@/hooks/use-catalog-queries";
import { useProfileQuery, useUpdateProfileMutation } from "@/hooks/use-account";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Globe,
  Sparkles,
  ShieldCheck,
  Check,
  Award,
} from "lucide-react";
import { AccountHeading } from "@/components/account/experience-ui";

export default function ProfilePage() {
  const t = useTranslations("Account");
  const locale = useLocale() as Locale;
  const profile = useProfileQuery();
  const concerns = useConcernsQuery();
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

  if (profile.isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 w-64 rounded-xl bg-muted/60" />
        <div className="h-64 rounded-2xl bg-muted/40" />
        <div className="h-64 rounded-2xl bg-muted/40" />
      </div>
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <section
        role="alert"
        className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center"
      >
        <h1 className="font-display text-2xl font-light">{t("profile.title")}</h1>
        <p className="mt-3 text-sm text-destructive">{t("loadError")}</p>
        <Button
          variant="outline"
          className="mt-5 uppercase tracking-wider text-xs"
          onClick={() => profile.refetch()}
        >
          {t("retry")}
        </Button>
      </section>
    );
  }

  const initials =
    [profile.data.firstName?.[0], profile.data.lastName?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "IP";

  return (
    <section aria-labelledby="profile-title" className="space-y-10">
      <AccountHeading
        title={t("profile.title")}
        description="Gérez vos données personnelles, vos préférences de communication et vos besoins cutanés pour personnaliser vos recommandations IOMA Paris."
        badge="PROFIL PERSONNEL"
      />

      {/* Member Identity Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-background to-muted/30 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background font-display text-xl font-medium tracking-widest shadow-md">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl sm:text-2xl font-medium text-foreground">
                  {profile.data.firstName} {profile.data.lastName}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 border border-emerald-500/20">
                  <ShieldCheck className="size-3" />
                  Compte Vérifié
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1.5">
                <Mail className="size-3" />
                <span>{profile.data.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/80 px-4 py-2.5 backdrop-blur-xs">
            <Award className="size-5 text-sf-champagne shrink-0" />
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Privilège Skincare
              </p>
              <p className="text-xs font-semibold text-foreground">Membre Élite UAE</p>
            </div>
          </div>
        </div>
      </div>

      <form
        className="space-y-8"
        noValidate
        onSubmit={form.handleSubmit((values) => update.mutate(values))}
      >
        {/* Section 1: Identité Personnelle */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 border-b border-border/60 pb-4">
            <User className="size-4 text-muted-foreground" />
            <h3 className="font-display text-lg font-medium text-foreground">
              Identité & État Civil
            </h3>
          </div>

          <FieldGroup>
            <div className="grid gap-5 sm:grid-cols-2">
              <Controller
                name="firstName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      htmlFor="profile-first-name"
                      className="text-xs uppercase tracking-wider text-muted-foreground"
                    >
                      {t("profile.firstName")}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="profile-first-name"
                      autoComplete="given-name"
                      className="min-h-11 rounded-xl"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError>{t("invalidField")}</FieldError>}
                  </Field>
                )}
              />
              <Controller
                name="lastName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      htmlFor="profile-last-name"
                      className="text-xs uppercase tracking-wider text-muted-foreground"
                    >
                      {t("profile.lastName")}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="profile-last-name"
                      autoComplete="family-name"
                      className="min-h-11 rounded-xl"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError>{t("invalidField")}</FieldError>}
                  </Field>
                )}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Controller
                name="dateOfBirth"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      htmlFor="profile-date-of-birth"
                      className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
                    >
                      <Calendar className="size-3" />
                      <span>{t("profile.dateOfBirth")}</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id="profile-date-of-birth"
                      type="date"
                      autoComplete="bday"
                      className="min-h-11 rounded-xl"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError>{t("invalidField")}</FieldError>}
                  </Field>
                )}
              />

              <Field>
                <FieldLabel
                  htmlFor="profile-email"
                  className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
                >
                  <Mail className="size-3" />
                  <span>{t("profile.email")}</span>
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="profile-email"
                    type="email"
                    dir="ltr"
                    value={profile.data.email}
                    readOnly
                    className="min-h-11 rounded-xl bg-muted/40 pe-10 text-muted-foreground cursor-not-allowed"
                    aria-readonly="true"
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-medium text-emerald-600 flex items-center gap-1">
                    <Check className="size-3.5" />
                  </span>
                </div>
              </Field>
            </div>
          </FieldGroup>
        </div>

        {/* Section 2: Contact & Langue */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 border-b border-border/60 pb-4">
            <Globe className="size-4 text-muted-foreground" />
            <h3 className="font-display text-lg font-medium text-foreground">
              Coordonnées & Préférences
            </h3>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor="profile-phone"
                    className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
                  >
                    <Phone className="size-3" />
                    <span>{t("profile.phone")}</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="profile-phone"
                    type="tel"
                    dir="ltr"
                    placeholder="+971 50 000 0000"
                    autoComplete="tel"
                    className="min-h-11 rounded-xl"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError>{t("invalidField")}</FieldError>}
                </Field>
              )}
            />

            <Controller
              name="preferredLocale"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor="profile-language"
                    className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
                  >
                    <Globe className="size-3" />
                    <span>{t("profile.preferredLocale")}</span>
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="profile-language"
                      className="min-h-11 w-full rounded-xl"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["en", "ar"] as const).map((value) => (
                        <SelectItem key={value} value={value}>
                          {LOCALE_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError>{t("invalidField")}</FieldError>}
                </Field>
              )}
            />
          </div>
        </div>

        {/* Section 3: Diagnostic & Besoins Cutanés (Interactive Chips) */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div className="flex items-center gap-2.5">
              <Sparkles className="size-4 text-sf-champagne" />
              <div>
                <h3 className="font-display text-lg font-medium text-foreground">
                  Besoins Cutanés & Diagnostic
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sélectionnez vos priorités pour guider l&apos;IA et les recommandations
                  cliniques
                </p>
              </div>
            </div>
          </div>

          <Controller
            name="skinConcerns"
            control={form.control}
            render={({ field }) => (
              <div>
                {concerns.isLoading ? (
                  <div className="h-24 animate-pulse rounded-xl bg-muted/50" />
                ) : concerns.isError ? (
                  <p role="alert" className="text-sm text-destructive">
                    {t("profile.concernsError")}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {concerns.data?.map((concern) => {
                      const isSelected = field.value.includes(concern.slug);
                      return (
                        <button
                          key={concern.slug}
                          type="button"
                          onClick={() => {
                            field.onChange(
                              isSelected
                                ? field.value.filter((s) => s !== concern.slug)
                                : [...field.value, concern.slug],
                            );
                          }}
                          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 border ${
                            isSelected
                              ? "bg-foreground text-background border-foreground shadow-xs"
                              : "bg-background text-foreground/80 border-border/80 hover:border-foreground/40 hover:bg-muted/40"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              isSelected ? "bg-sf-champagne" : "bg-muted-foreground/40"
                            }`}
                          />
                          <span>{concern.name[locale]}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          />
        </div>

        {/* Section 4: Newsletter & Privilèges */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8 shadow-xs">
          <Controller
            name="newsletterOptIn"
            control={form.control}
            render={({ field }) => (
              <label className="flex cursor-pointer items-start gap-3.5">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(value) => field.onChange(Boolean(value))}
                  className="mt-1"
                />
                <div className="text-xs sm:text-sm">
                  <span className="font-medium text-foreground block">
                    {t("profile.newsletterOptIn")}
                  </span>
                  <span className="text-muted-foreground text-xs mt-0.5 block leading-relaxed">
                    Recevez en avant-première nos invitations exclusives, lancements de
                    soins sur-mesure et actualités du diagnostic scientifique à Dubai.
                  </span>
                </div>
              </label>
            )}
          />
        </div>

        {/* Submit Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/70">
          <div>
            {update.isError && (
              <p role="alert" className="text-xs font-medium text-destructive">
                {t("saveError")}
              </p>
            )}
            {update.isSuccess && (
              <p
                role="status"
                className="text-xs font-medium text-emerald-600 flex items-center gap-1.5"
              >
                <Check className="size-4" />
                <span>{t("profile.saved")}</span>
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="rounded-full px-8 uppercase tracking-widest text-xs font-medium shadow-sm transition-transform active:scale-95"
            disabled={update.isPending}
          >
            {update.isPending ? t("profile.saving") : t("profile.save")}
          </Button>
        </div>
      </form>
    </section>
  );
}
