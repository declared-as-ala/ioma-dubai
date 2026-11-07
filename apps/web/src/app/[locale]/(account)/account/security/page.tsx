"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { changePasswordSchema, type ChangePasswordInput } from "@ioma/validation";
import { ApiError } from "@/lib/api";
import { useChangePasswordMutation } from "@/hooks/use-account";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AccountHeading } from "@/components/account/experience-ui";
import {
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function SecurityPage() {
  const t = useTranslations("Account");
  const changePassword = useChangePasswordMutation();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  const incorrectCurrent =
    changePassword.error instanceof ApiError &&
    changePassword.error.message === "Current password is incorrect.";

  return (
    <section aria-labelledby="security-title" className="space-y-8">
      <AccountHeading
        title={t("security.title")}
        description="Gérez vos identifiants d'accès, renforcez la sécurité de votre compte IOMA Paris et contrôlez vos sessions actives."
        badge="SÉCURITÉ & ACCÈS"
      />

      {/* Card 1: Change Password */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 border-b border-border/60 pb-4">
          <KeyRound className="size-4 text-muted-foreground" />
          <h2 className="font-display text-lg font-medium text-foreground">
            Modification du Mot de Passe
          </h2>
        </div>

        <form
          noValidate
          className="space-y-5 max-w-xl"
          onSubmit={form.handleSubmit((values) =>
            changePassword.mutate(values, {
              onSuccess: () => form.reset(),
            }),
          )}
        >
          <FieldGroup className="space-y-4">
            <Controller
              name="currentPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || incorrectCurrent}>
                  <FieldLabel
                    htmlFor="current-password"
                    className="text-xs uppercase tracking-wider text-muted-foreground"
                  >
                    {t("security.currentPassword")}
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      {...field}
                      id="current-password"
                      type={showCurrent ? "text" : "password"}
                      autoComplete="current-password"
                      className="min-h-11 rounded-xl pe-10"
                      aria-invalid={fieldState.invalid || incorrectCurrent}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrent ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  {fieldState.invalid && <FieldError>{t("invalidField")}</FieldError>}
                  {incorrectCurrent && (
                    <FieldError>{t("security.incorrectCurrent")}</FieldError>
                  )}
                </Field>
              )}
            />

            <Controller
              name="newPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor="new-password"
                    className="text-xs uppercase tracking-wider text-muted-foreground"
                  >
                    {t("security.newPassword")}
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      {...field}
                      id="new-password"
                      type={showNew ? "text" : "password"}
                      autoComplete="new-password"
                      className="min-h-11 rounded-xl pe-10"
                      aria-invalid={fieldState.invalid}
                      aria-describedby="new-password-hint"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowNew(!showNew)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNew ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  <p id="new-password-hint" className="text-xs text-muted-foreground">
                    {t("security.passwordHint")}
                  </p>
                  {fieldState.invalid && <FieldError>{t("invalidField")}</FieldError>}
                </Field>
              )}
            />

            {changePassword.isError && !incorrectCurrent && (
              <p role="alert" className="text-xs font-medium text-destructive">
                {t("saveError")}
              </p>
            )}
            {changePassword.isSuccess && (
              <p
                role="status"
                className="text-xs font-medium text-emerald-600 flex items-center gap-1.5"
              >
                <Check className="size-4" />
                <span>{t("security.changed")}</span>
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="rounded-full px-8 uppercase tracking-widest text-xs font-medium"
              disabled={changePassword.isPending}
            >
              {changePassword.isPending ? t("security.submitting") : t("security.submit")}
            </Button>
          </FieldGroup>
        </form>
      </div>

      {/* Card 2: Security & Encryption Guarantees */}
      <div className="rounded-2xl border border-border/80 bg-gradient-to-r from-muted/30 to-background p-6 shadow-xs flex items-start gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
          <Lock className="size-4" />
        </span>
        <div className="space-y-1">
          <h3 className="font-display text-base font-medium text-foreground">
            Chiffrement & Protection Haute Sécurité
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Vos identifiants sont chiffrés selon le standard cryptographique de pointe
            Argon2id. Les sessions mobiles et web bénéficient d&apos;une rotation
            automatique des jetons de rafraîchissement avec révocation immédiate en cas
            d&apos;activité anormale.
          </p>
        </div>
      </div>

      {/* Card 3: Danger Zone */}
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-medium text-foreground flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" />
            <span>Zone Sensible · Données Personnelles</span>
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Vous pouvez à tout moment demander l&apos;anonymisation et la suppression de
            votre compte conformément au RGPD et aux réglementations des EAU.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-full text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30 shrink-0"
        >
          <Link href="/account/delete">Demander la suppression</Link>
        </Button>
      </div>
    </section>
  );
}
