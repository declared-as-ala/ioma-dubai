"use client";

import { useLocale } from "next-intl";
import { MailWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tr, toLoc } from "@/lib/l10n";
import { useProfileQuery } from "@/hooks/use-account";
import { useResendMyVerificationMutation } from "@/hooks/use-auth";

/** Shown to signed-in customers whose email is not verified yet. Renders nothing otherwise. */
export function VerifyEmailBanner() {
  const loc = toLoc(useLocale());
  const profile = useProfileQuery();
  const resend = useResendMyVerificationMutation();
  if (!profile.data || profile.data.emailVerified) return null;

  const status = resend.data?.status;
  return (
    <div
      role="status"
      className="mb-8 flex flex-col gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <MailWarning className="mt-0.5 size-5 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-medium">
            {tr(loc, {
              en: "Please confirm your email address",
              fr: "Veuillez confirmer votre adresse e-mail",
              ar: "يرجى تأكيد بريدكم الإلكتروني",
            })}
          </p>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            {status === "sent"
              ? tr(loc, {
                  en: "A new email is on its way. Check your inbox and spam folder.",
                  fr: "Un nouvel e-mail est en route. Vérifiez votre boîte de réception et vos spams.",
                  ar: "رسالة جديدة في طريقها. تفقّدوا بريدكم والرسائل غير المرغوبة.",
                })
              : status === "cooldown"
                ? tr(loc, {
                    en: "An email was just sent. Please wait a minute before asking again.",
                    fr: "Un e-mail vient d'être envoyé. Patientez une minute avant de réessayer.",
                    ar: "تم إرسال رسالة للتو. انتظروا دقيقة قبل المحاولة مجدداً.",
                  })
                : resend.isError
                  ? tr(loc, {
                      en: "Too many requests. Please try again in a few minutes.",
                      fr: "Trop de demandes. Réessayez dans quelques minutes.",
                      ar: "طلبات كثيرة. حاولوا مجدداً بعد دقائق.",
                    })
                  : tr(loc, {
                      en: `We sent a link to ${profile.data.email}. Ordering, booking and partner applications unlock once it is confirmed.`,
                      fr: `Nous avons envoyé un lien à ${profile.data.email}. Les commandes, rendez-vous et candidatures partenaires s'activent une fois l'adresse confirmée.`,
                      ar: `أرسلنا رابطاً إلى ${profile.data.email}. يتم تفعيل الطلب والحجز وطلبات الشراكة بعد التأكيد.`,
                    })}
          </p>
        </div>
      </div>
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
  );
}
