"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useResetPasswordMutation } from "@/hooks/use-auth";
import { motion } from "motion/react";
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  AlertTriangle,
} from "lucide-react";

function ResetPasswordForm() {
  const t = useTranslations("ResetPassword");
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetSchema = z
    .object({
      password: z
        .string()
        .min(10, t("requirements"))
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, t("requirements")),
      confirmPassword: z.string().min(1, t("passwordError")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("confirmError"),
      path: ["confirmPassword"],
    });

  type ResetFormValues = z.infer<typeof resetSchema>;

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const mutation = useResetPasswordMutation();

  function onSubmit(values: ResetFormValues) {
    setErrorMessage(null);
    mutation.mutate(
      {
        token,
        password: values.password,
      },
      {
        onSuccess: () => {
          setIsSuccess(true);
        },
        onError: (err: any) => {
          const detail = err?.message || err?.error || t("errorGeneric");
          setErrorMessage(detail);
        },
      },
    );
  }

  // Token is missing from URL
  if (!token) {
    return (
      <div className="space-y-6 py-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <AlertTriangle className="size-7" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-foreground">
            {t("noTokenTitle")}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("noTokenMessage")}
          </p>
        </div>

        <div className="pt-4 border-t border-border/60">
          <Button
            asChild
            className="w-full h-12 rounded-xl bg-ioma-noir text-white hover:bg-ioma-noir/90 font-medium tracking-wide text-xs uppercase shadow-md transition-all cursor-pointer"
          >
            <Link href="/forgot-password">
              <span>{t("noTokenCta")}</span>
              <ArrowRight className="size-4 ms-2 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6 py-4"
      >
        <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="size-7" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-foreground">
            {t("successTitle")}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("successMessage")}
          </p>
        </div>

        <div className="pt-4 border-t border-border/60">
          <Button
            asChild
            className="w-full h-12 rounded-xl bg-ioma-noir text-white hover:bg-ioma-noir/90 font-medium tracking-wide text-xs uppercase shadow-md transition-all cursor-pointer"
          >
            <Link href="/login">
              <span>{t("successCta")}</span>
              <ArrowRight className="size-4 ms-2 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-sf-champagne/10 text-sf-champagne">
            <KeyRound className="size-3.5" />
          </span>
          <span className="text-[0.7rem] uppercase tracking-widest text-muted-foreground font-semibold">
            {t("kicker")}
          </span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("description")}
        </p>
      </div>

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-700 dark:text-rose-300 space-y-2"
        >
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="size-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
          <div className="pt-1">
            <Link
              href="/forgot-password"
              className="font-semibold underline underline-offset-4 hover:text-rose-900 dark:hover:text-rose-100 transition-colors"
            >
              {t("expiredCta")}
            </Link>
          </div>
        </motion.div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
        <FieldGroup className="space-y-4">
          {/* New Password Field */}
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="space-y-1.5">
                <FieldLabel
                  htmlFor="new-password"
                  className="text-xs uppercase tracking-wider text-muted-foreground"
                >
                  {t("newPasswordLabel")}
                </FieldLabel>
                <div className="relative flex items-center">
                  <Lock className="absolute start-3.5 size-4 text-muted-foreground" />
                  <Input
                    {...field}
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••••••"
                    aria-invalid={fieldState.invalid}
                    className="ps-10 pe-10 h-12 rounded-xl border-border bg-background text-sm transition-all focus:border-sf-champagne focus:ring-1 focus:ring-sf-champagne"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                    className="absolute end-3.5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {fieldState.error?.message && (
                  <FieldError className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3 shrink-0" />
                    {fieldState.error.message}
                  </FieldError>
                )}
              </Field>
            )}
          />

          {/* Confirm Password Field */}
          <Controller
            name="confirmPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="space-y-1.5">
                <FieldLabel
                  htmlFor="confirm-password"
                  className="text-xs uppercase tracking-wider text-muted-foreground"
                >
                  {t("confirmPasswordLabel")}
                </FieldLabel>
                <div className="relative flex items-center">
                  <Lock className="absolute start-3.5 size-4 text-muted-foreground" />
                  <Input
                    {...field}
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••••••"
                    aria-invalid={fieldState.invalid}
                    className="ps-10 pe-10 h-12 rounded-xl border-border bg-background text-sm transition-all focus:border-sf-champagne focus:ring-1 focus:ring-sf-champagne"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? t("hidePassword") : t("showPassword")}
                    className="absolute end-3.5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirm ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {fieldState.error?.message && (
                  <FieldError className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3 shrink-0" />
                    {fieldState.error.message}
                  </FieldError>
                )}
              </Field>
            )}
          />

          {/* Password Requirements Notice */}
          <div className="rounded-lg bg-muted/40 p-3 text-[0.75rem] text-muted-foreground">
            {t("requirements")}
          </div>
        </FieldGroup>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full h-12 rounded-xl bg-ioma-noir text-white hover:bg-ioma-noir/90 font-medium tracking-wide text-xs uppercase shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {mutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t("submitting")}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>{t("submit")}</span>
                <ArrowRight className="size-4 rtl:rotate-180" />
              </span>
            )}
          </Button>
        </div>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  const t = useTranslations("ResetPassword");

  return (
    <main className="relative min-h-[calc(100vh-5rem)] bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Subtle Accent Gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -start-40 size-96 rounded-full bg-sf-champagne/5 blur-3xl" />
        <div className="absolute -bottom-40 -end-40 size-96 rounded-full bg-ioma-gold/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* LEFT COLUMN: Form / Confirmation Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="lg:col-span-6 xl:col-span-7"
          >
            <div className="rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xl p-8 sm:p-10 shadow-xl">
              <Suspense
                fallback={
                  <div className="flex h-48 items-center justify-center">
                    <span className="size-6 animate-spin rounded-full border-2 border-sf-champagne border-t-transparent" />
                  </div>
                }
              >
                <ResetPasswordForm />
              </Suspense>

              {/* Trust Badge */}
              <div className="mt-8 flex items-center justify-center gap-2 text-[0.7rem] uppercase tracking-wider text-muted-foreground/80">
                <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t("secure")}</span>
              </div>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: Editorial Visual Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className="hidden lg:col-span-6 lg:block xl:col-span-5"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-border/50 shadow-2xl">
              <Image
                src="/images/login-hero.png"
                alt={t("imageAlt")}
                fill
                priority
                unoptimized
                className="object-cover object-center transition-transform duration-700 hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              <div className="absolute inset-0 p-8 flex flex-col justify-between">
                <div className="flex justify-start">
                  <span className="rounded-full bg-white/20 backdrop-blur-md px-3.5 py-1.5 text-[0.65rem] font-medium uppercase tracking-widest text-white border border-white/30 shadow-sm">
                    {t("editorialBadge")}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-5 text-white shadow-lg space-y-3">
                    <p className="font-display text-lg leading-snug tracking-tight text-white">
                      {t("quote")}
                    </p>
                  </div>

                  <p className="text-[0.7rem] uppercase tracking-widest text-white/70 text-center">
                    Paris • Dubai
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
