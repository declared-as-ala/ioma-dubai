"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@ioma/config";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@ioma/validation";
import { Link, useRouter } from "@/i18n/navigation";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRegisterMutation } from "@/hooks/use-auth";

import { useSearchParams } from "next/navigation";

export default function RegisterPage() {
  const t = useTranslations("Register");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect");
  const redirectUrl =
    rawRedirect?.startsWith("/") &&
    !rawRedirect.startsWith("//") &&
    !rawRedirect.includes("\\")
      ? rawRedirect
      : null;
  const mutation = useRegisterMutation();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", firstName: "", lastName: "", locale },
  });

  function onSubmit(values: RegisterInput) {
    mutation.mutate(values, {
      onSuccess: () => {
        if (redirectUrl) {
          router.push(redirectUrl);
          return;
        }
        router.push("/account");
      },
    });
  }

  return (
    <main className="bg-sf-ivory">
      <div className="mx-auto my-0 max-w-lg px-4 py-16 md:px-6 md:py-24">
        <div className="rounded-[2rem] bg-background p-8 md:p-12">
          <p className="text-xs uppercase tracking-heading text-muted-foreground">
            {t("kicker")}
          </p>
          <h1 className="mt-4 font-display text-4xl font-medium tracking-[-0.02em] rtl:tracking-normal">
            {t("title")}
          </h1>

          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="mt-10">
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  name="firstName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="register-firstname">
                        {t("firstNameLabel")}
                      </FieldLabel>
                      <Input
                        {...field}
                        id="register-firstname"
                        autoComplete="given-name"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name="lastName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="register-lastname">
                        {t("lastNameLabel")}
                      </FieldLabel>
                      <Input
                        {...field}
                        id="register-lastname"
                        autoComplete="family-name"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="register-email">{t("emailLabel")}</FieldLabel>
                    <Input
                      {...field}
                      id="register-email"
                      type="email"
                      autoComplete="email"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="register-password">
                      {t("passwordLabel")}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="register-password"
                      type="password"
                      autoComplete="new-password"
                      aria-invalid={fieldState.invalid}
                      aria-describedby="register-password-hint"
                    />
                    <p
                      id="register-password-hint"
                      className="text-xs text-muted-foreground"
                    >
                      {t("passwordHint")}
                    </p>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {mutation.isError && (
                <p role="alert" className="text-sm text-destructive">
                  {t("errorGeneric")}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={mutation.isPending}
                className="uppercase tracking-widest"
              >
                {mutation.isPending ? t("submitting") : t("submit")}
              </Button>
            </FieldGroup>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            {t("hasAccount")}{" "}
            <Link
              href={
                redirectUrl
                  ? `/login?redirect=${encodeURIComponent(redirectUrl)}`
                  : "/login"
              }
              className="inline-flex min-h-11 min-w-11 items-center text-foreground underline-offset-4 hover:underline xl:min-h-0"
            >
              {t("loginLink")}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
