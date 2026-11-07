"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@ioma/validation";
import { Link, useRouter } from "@/i18n/navigation";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLoginMutation } from "@/hooks/use-auth";
import { motion } from "motion/react";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  UserCheck,
  Building2,
  CheckCircle2,
} from "lucide-react";

import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const t = useTranslations("Login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect");
  const redirectUrl =
    rawRedirect?.startsWith("/") &&
    !rawRedirect.startsWith("//") &&
    !rawRedirect.includes("\\")
      ? rawRedirect
      : null;
  const mutation = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<"client" | "pro">("client");

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginInput) {
    mutation.mutate(values, {
      onSuccess: () => {
        if (redirectUrl) {
          router.push(redirectUrl);
          return;
        }
        if (accountType === "pro") {
          router.push("/portal");
        } else {
          router.push("/account");
        }
      },
    });
  }

  return (
    <main className="relative flex min-h-[calc(100vh-5rem)] bg-background">
      <div className="grid w-full lg:grid-cols-2">
        <div className="contents">
          {/* LEFT COLUMN: Luxury Form Container */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center justify-center px-5 py-12 md:px-10 lg:px-16 lg:py-20"
          >
            <div className="relative w-full max-w-md">
              {/* Header Badge & Titles */}
              <div className="space-y-3">
                <p className="flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
                  <span className="h-px w-8 bg-foreground/40" aria-hidden />
                  {t("privatePortal")}
                </p>

                <h1 className="font-display text-4xl tracking-tight text-foreground md:text-5xl">
                  {t("title")}
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("description")}
                </p>
              </div>

              {/* Role Switcher Tabs */}
              <div className="mt-8 grid grid-cols-2 gap-1.5 rounded-full bg-muted p-1.5">
                <button
                  type="button"
                  onClick={() => setAccountType("client")}
                  aria-pressed={accountType === "client"}
                  className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full py-2 focus-visible:outline-2 focus-visible:outline-offset-2 text-xs uppercase tracking-wider font-medium transition-all ${
                    accountType === "client"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <UserCheck className="size-3.5" />
                  <span>{t("clientTab")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("pro")}
                  aria-pressed={accountType === "pro"}
                  className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full py-2 focus-visible:outline-2 focus-visible:outline-offset-2 text-xs uppercase tracking-wider font-medium transition-all ${
                    accountType === "pro"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Building2 className="size-3.5" />
                  <span>{t("proTab")}</span>
                </button>
              </div>

              {/* B2B Application Notice if Pro tab selected */}
              {accountType === "pro" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2"
                >
                  <Building2 className="size-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span>{t("professionalPrompt")} </span>
                    <Link
                      href="/professionals/apply"
                      className="inline-flex min-h-11 cursor-pointer items-center gap-2 font-semibold underline underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sf-champagne"
                    >
                      {t("applyLink")}{" "}
                      <ArrowRight
                        aria-hidden="true"
                        className="size-4 shrink-0 rtl:rotate-180"
                      />
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* Form Element */}
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                noValidate
                className="mt-10 space-y-5"
              >
                <FieldGroup className="space-y-4">
                  {/* Email Field */}
                  <Controller
                    name="email"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} className="space-y-1.5">
                        <FieldLabel
                          htmlFor="login-email"
                          className="text-xs uppercase tracking-wider text-muted-foreground"
                        >
                          {t("emailLabel")}
                        </FieldLabel>
                        <div className="relative flex items-center">
                          <Mail className="absolute start-3.5 size-4 text-muted-foreground" />
                          <Input
                            {...field}
                            id="login-email"
                            type="email"
                            autoComplete="email"
                            placeholder="your.email@ioma-paris.com"
                            aria-invalid={fieldState.invalid}
                            className="ps-10 h-13 min-h-12 rounded-full border-border bg-white text-sm shadow-sm transition-all focus:border-foreground focus:ring-1 focus:ring-foreground"
                          />
                        </div>
                        {fieldState.invalid && <FieldError>{t("emailError")}</FieldError>}
                      </Field>
                    )}
                  />

                  {/* Password Field */}
                  <Controller
                    name="password"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} className="space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <FieldLabel
                            htmlFor="login-password"
                            className="text-xs uppercase tracking-wider text-muted-foreground"
                          >
                            {t("passwordLabel")}
                          </FieldLabel>
                          <Link
                            href="/forgot-password"
                            className="text-[0.75rem] text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {t("forgotPassword")}
                          </Link>
                        </div>
                        <div className="relative flex items-center">
                          <Lock className="absolute start-3.5 size-4 text-muted-foreground" />
                          <Input
                            {...field}
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="••••••••••••"
                            aria-invalid={fieldState.invalid}
                            className="ps-10 pe-10 h-13 min-h-12 rounded-full border-border bg-white text-sm shadow-sm transition-all focus:border-foreground focus:ring-1 focus:ring-foreground"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute end-1 flex size-11 items-center justify-center text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-2"
                            aria-label={
                              showPassword ? t("hidePassword") : t("showPassword")
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </button>
                        </div>
                        {fieldState.invalid && (
                          <FieldError>{t("passwordError")}</FieldError>
                        )}
                      </Field>
                    )}
                  />

                  {/* Generic Error Notification */}
                  {mutation.isError && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      role="alert"
                      className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2"
                    >
                      <span>{t("errorGeneric")}</span>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="lg"
                    disabled={mutation.isPending}
                    className="group mt-3 h-13 min-h-12 w-full rounded-full bg-foreground text-xs font-semibold uppercase tracking-[0.2em] text-background shadow-lg shadow-black/10 transition-all hover:bg-foreground/90"
                  >
                    {mutation.isPending ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="size-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        <span>{t("submitting")}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span>{t("submit")}</span>
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    )}
                  </Button>
                </FieldGroup>
              </form>

              {/* Registration Link */}
              <div className="mt-8 border-t border-border/60 pt-6 text-center text-sm text-muted-foreground">
                <span>{t("noAccount")} </span>
                <Link
                  href={
                    redirectUrl
                      ? `/register?redirect=${encodeURIComponent(redirectUrl)}`
                      : "/register"
                  }
                  className="font-semibold text-foreground underline underline-offset-4 hover:text-sf-champagne transition-colors ms-1"
                >
                  {t("registerLink")}
                </Link>
              </div>

              {/* Trust Badge */}
              <div className="mt-6 flex items-center justify-center gap-2 text-[0.7rem] uppercase tracking-wider text-muted-foreground/80">
                <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t("secure")}</span>
              </div>
            </div>
          </motion.div>

          {/* RIGHT: full-height editorial photo (IOMA campaign) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative hidden min-h-[40rem] lg:block"
          >
            <Image
              src="/images/brand/login-hero.webp"
              alt={t("imageAlt")}
              fill
              priority
              sizes="50vw"
              className="object-cover object-[50%_30%]"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 p-10 text-white xl:p-14">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-white/75">
                {t("editorialBadge")}
              </p>
              <p className="mt-4 max-w-md font-display text-3xl leading-tight xl:text-4xl">
                {t("quote")}
              </p>
              <p className="mt-5 flex items-center gap-2 text-sm text-white/85">
                <CheckCircle2 className="size-4 text-white" aria-hidden />
                {t("routineBenefit")}
              </p>
              <p className="mt-8 text-[0.68rem] uppercase tracking-[0.24em] text-white/60">
                {t("locations")}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
