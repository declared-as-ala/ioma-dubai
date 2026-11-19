"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, MailWarning, ShieldAlert } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { tr, toLoc } from "@/lib/l10n";
import { useAuthStore } from "@/stores/auth-store";
import {
  useResendMyVerificationMutation,
  useResendVerificationMutation,
  useVerifyEmailMutation,
} from "@/hooks/use-auth";

type State = "loading" | "verified" | "expired" | "invalid";

function VerifyEmail() {
  const loc = toLoc(useLocale());
  const token = useSearchParams().get("token") ?? "";
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setSession = useAuthStore((s) => s.setSession);
  const verify = useVerifyEmailMutation();
  const resendMine = useResendMyVerificationMutation();
  const resendPublic = useResendVerificationMutation();
  const [state, setState] = useState<State>(token ? "loading" : "invalid");
  const [email, setEmail] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true; // React strict mode runs effects twice; a link must be consumed once
    verify.mutate(token, {
      onSuccess: () => {
        setState("verified");
        // Keep the signed-in session and the profile in step with the new status.
        const current = useAuthStore.getState().user;
        if (current && accessToken && refreshToken)
          setSession({
            user: { ...current, emailVerifiedAt: new Date().toISOString() },
            accessToken,
            refreshToken,
          });
        void qc.invalidateQueries({ queryKey: ["account", "profile"] });
      },
      onError: (err) =>
        setState(
          err instanceof ApiError && err.errorCode === "TOKEN_EXPIRED"
            ? "expired"
            : "invalid",
        ),
    });
  }, [token]);

  const card = "rounded-[2rem] bg-background p-8 text-center md:p-12";

  return (
    <main className="bg-sf-ivory">
      <div className="mx-auto max-w-lg px-4 py-16 md:px-6 md:py-28" aria-live="polite">
        {state === "loading" && (
          <div className={card} role="status">
            <Loader2 className="mx-auto size-8 animate-spin text-sf-champagne" />
            <p className="mt-6 text-sm text-muted-foreground">
              {tr(loc, {
                en: "Confirming your email…",
                fr: "Confirmation de votre e-mail…",
                ar: "جارٍ تأكيد بريدكم…",
              })}
            </p>
          </div>
        )}

        {state === "verified" && (
          <div className={card}>
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="size-8" />
            </span>
            <p className="mt-8 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              IOMA Paris
            </p>
            <h1 className="mt-3 font-display text-3xl font-medium md:text-4xl">
              {tr(loc, {
                en: "Your email is confirmed",
                fr: "Votre e-mail est confirmé",
                ar: "تم تأكيد بريدكم",
              })}
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-muted-foreground">
              {tr(loc, {
                en: "Thank you. Your account is now fully active: you can order, book appointments and apply to become a partner.",
                fr: "Merci. Votre compte est désormais actif : vous pouvez commander, réserver un rendez-vous et candidater pour devenir partenaire.",
                ar: "شكراً لكم. حسابكم مفعّل بالكامل: يمكنكم الطلب وحجز المواعيد والتقدّم لتصبحوا شركاء.",
              })}
            </p>
            <Button
              asChild
              className="mt-8 h-12 rounded-full px-8 text-xs uppercase tracking-widest"
            >
              <Link href={user ? "/account/profile" : "/login"}>
                {user
                  ? tr(loc, {
                      en: "Go to my profile",
                      fr: "Accéder à mon profil",
                      ar: "الانتقال إلى ملفي",
                    })
                  : tr(loc, { en: "Sign in", fr: "Se connecter", ar: "تسجيل الدخول" })}
              </Link>
            </Button>
          </div>
        )}

        {(state === "expired" || state === "invalid") && (
          <div className={card}>
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
              {state === "expired" ? (
                <MailWarning className="size-8" />
              ) : (
                <ShieldAlert className="size-8" />
              )}
            </span>
            <h1 className="mt-8 font-display text-3xl font-medium">
              {state === "expired"
                ? tr(loc, {
                    en: "This link has expired",
                    fr: "Ce lien a expiré",
                    ar: "انتهت صلاحية هذا الرابط",
                  })
                : tr(loc, {
                    en: "This link is not valid",
                    fr: "Ce lien n'est pas valide",
                    ar: "هذا الرابط غير صالح",
                  })}
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-muted-foreground">
              {tr(loc, {
                en: "Request a new confirmation email below. Links are valid for 24 hours and work once.",
                fr: "Demandez un nouvel e-mail de confirmation ci-dessous. Les liens sont valables 24 heures et ne servent qu'une fois.",
                ar: "اطلبوا رسالة تأكيد جديدة أدناه. الروابط صالحة 24 ساعة وتعمل مرة واحدة.",
              })}
            </p>

            {user ? (
              <div className="mt-8">
                <Button
                  className="h-12 rounded-full px-8 text-xs uppercase tracking-widest"
                  disabled={resendMine.isPending}
                  onClick={() => resendMine.mutate()}
                >
                  {tr(loc, {
                    en: "Send a new link",
                    fr: "Envoyer un nouveau lien",
                    ar: "إرسال رابط جديد",
                  })}
                </Button>
                {resendMine.isSuccess && (
                  <p role="status" className="mt-4 text-sm text-emerald-700">
                    {resendMine.data.status === "cooldown"
                      ? tr(loc, {
                          en: "An email was just sent. Please wait a minute before asking again.",
                          fr: "Un e-mail vient d'être envoyé. Patientez une minute avant de réessayer.",
                          ar: "تم إرسال رسالة للتو. انتظروا دقيقة قبل المحاولة مجدداً.",
                        })
                      : tr(loc, {
                          en: "A new link is on its way. Check your inbox.",
                          fr: "Un nouveau lien est en route. Consultez votre boîte de réception.",
                          ar: "الرابط الجديد في طريقه. تفقّدوا بريدكم.",
                        })}
                  </p>
                )}
              </div>
            ) : (
              <form
                className="mx-auto mt-8 max-w-sm space-y-3 text-start"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email.trim()) resendPublic.mutate(email.trim());
                }}
              >
                <label htmlFor="ve-email" className="text-sm font-medium">
                  {tr(loc, { en: "Email", fr: "E-mail", ar: "البريد الإلكتروني" })}
                </label>
                <Input
                  id="ve-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl"
                />
                <Button
                  type="submit"
                  disabled={resendPublic.isPending}
                  className="h-12 w-full rounded-full text-xs uppercase tracking-widest"
                >
                  {tr(loc, {
                    en: "Send a new link",
                    fr: "Envoyer un nouveau lien",
                    ar: "إرسال رابط جديد",
                  })}
                </Button>
                {resendPublic.isSuccess && (
                  <p role="status" className="text-sm text-emerald-700">
                    {tr(loc, {
                      en: "If this address needs verification, a new email is on its way.",
                      fr: "Si cette adresse doit être vérifiée, un nouvel e-mail est en route.",
                      ar: "إذا كان هذا العنوان بحاجة إلى تأكيد فسيصله بريد جديد.",
                    })}
                  </p>
                )}
                {resendPublic.isError && (
                  <p role="alert" className="text-sm text-destructive">
                    {tr(loc, {
                      en: "Too many attempts. Please try again in a few minutes.",
                      fr: "Trop de tentatives. Réessayez dans quelques minutes.",
                      ar: "محاولات كثيرة. حاولوا مجدداً بعد دقائق.",
                    })}
                  </p>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmail />
    </Suspense>
  );
}
