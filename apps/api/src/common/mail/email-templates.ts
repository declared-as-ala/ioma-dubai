import { escapeHtml as esc } from "./mail.util";

export type EmailLocale = "en" | "fr" | "ar";
export interface Email {
  subject: string;
  html: string;
}

export const toEmailLocale = (v?: string | null): EmailLocale =>
  v === "fr" || v === "ar" ? v : "en";

const t = <T>(l: EmailLocale, v: { en: T; fr: T; ar: T }): T => v[l];

interface LayoutOpts {
  locale: EmailLocale;
  heading: string;
  /** Trusted HTML (callers escape any user text). */
  bodyHtml: string;
  button?: { label: string; url: string };
  /** Shown under the button, e.g. a plain link fallback. */
  note?: string;
  eyebrow?: string;
}

/** IOMA Paris luxury layout: ivory page, black masthead, champagne accents. Table-based for mail clients. */
export function layout(o: LayoutOpts): string {
  const dir = o.locale === "ar" ? "rtl" : "ltr";
  const align = o.locale === "ar" ? "right" : "left";
  const cta = o.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:30px 0 8px;"><tr><td style="background:#111111;">
<a href="${esc(o.button.url)}" style="display:inline-block;padding:16px 38px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#ffffff;text-decoration:none;">${esc(o.button.label)}</a></td></tr></table>`
    : "";
  const fallback = o.button
    ? `<p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#8a8478;word-break:break-all;">${esc(o.note ?? "")}<br><a href="${esc(o.button.url)}" style="color:#8a7f6d;">${esc(o.button.url)}</a></p>`
    : o.note
      ? `<p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#8a8478;">${esc(o.note)}</p>`
      : "";
  return `<!DOCTYPE html>
<html lang="${o.locale}" dir="${dir}"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${esc(o.heading)}</title></head>
<body style="margin:0;padding:0;background:#f5f1ea;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1ea;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;">
<tr><td style="background:#111111;padding:28px 40px;text-align:center;">
<span style="font-family:Georgia,'Times New Roman',serif;font-size:24px;letter-spacing:.34em;color:#ffffff;">IOMA</span>
<span style="display:block;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:.42em;color:#c8b690;margin-top:5px;">PARIS &middot; DUBAI</span></td></tr>
<tr><td style="padding:40px 40px 32px;direction:${dir};text-align:${align};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#2a2a2a;">
${o.eyebrow ? `<p style="margin:0 0 8px;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#8a7f6d;">${esc(o.eyebrow)}</p>` : ""}
<h1 style="margin:0 0 22px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;line-height:1.3;color:#111111;">${esc(o.heading)}</h1>
<div style="font-size:15px;line-height:1.75;color:#3b3b3b;">${o.bodyHtml}</div>
${cta}${fallback}
</td></tr>
<tr><td style="background:#faf7f1;padding:20px 40px;text-align:center;border-top:1px solid #e8e1d4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<p style="margin:0;font-size:11px;letter-spacing:.08em;color:#9a9285;">IOMA Paris Dubai &middot; iomaparis.ae</p></td></tr>
</table></td></tr></table></body></html>`;
}

const p = (html: string) => `<p style="margin:0 0 16px;">${html}</p>`;

// ───────────────────────── Account ─────────────────────────

export function verificationEmail(
  locale: EmailLocale,
  firstName: string,
  url: string,
  hours: number,
): Email {
  const name = esc(firstName);
  return {
    subject: t(locale, {
      en: "Confirm your email address | IOMA Paris",
      fr: "Confirmez votre adresse e-mail | IOMA Paris",
      ar: "أكّدوا بريدكم الإلكتروني | IOMA Paris",
    }),
    html: layout({
      locale,
      eyebrow: t(locale, { en: "Welcome", fr: "Bienvenue", ar: "أهلاً بكم" }),
      heading: t(locale, {
        en: "Confirm your email",
        fr: "Confirmez votre e-mail",
        ar: "أكّدوا بريدكم الإلكتروني",
      }),
      bodyHtml: t(locale, {
        en:
          p(`Hello ${name},`) +
          p(
            `Thank you for creating your IOMA Paris account. Please confirm your email address to activate it. This link is valid for <strong>${hours} hours</strong>.`,
          ),
        fr:
          p(`Bonjour ${name},`) +
          p(
            `Merci d'avoir créé votre compte IOMA Paris. Confirmez votre adresse e-mail pour l'activer. Ce lien est valable <strong>${hours} heures</strong>.`,
          ),
        ar:
          p(`مرحباً ${name}،`) +
          p(
            `شكراً لإنشاء حسابكم في IOMA Paris. يرجى تأكيد بريدكم الإلكتروني لتفعيله. هذا الرابط صالح لمدة <strong>${hours} ساعة</strong>.`,
          ),
      }),
      button: {
        label: t(locale, {
          en: "Confirm my email",
          fr: "Confirmer mon e-mail",
          ar: "تأكيد بريدي",
        }),
        url,
      },
      note: t(locale, {
        en: "If you did not create this account, you can ignore this message. If the button does not work, copy this link:",
        fr: "Si vous n'avez pas créé ce compte, ignorez ce message. Si le bouton ne fonctionne pas, copiez ce lien :",
        ar: "إذا لم تنشئوا هذا الحساب فتجاهلوا هذه الرسالة. وإن لم يعمل الزر فانسخوا هذا الرابط:",
      }),
    }),
  };
}

export function passwordResetEmail(
  locale: EmailLocale,
  url: string,
  minutes: number,
): Email {
  return {
    subject: t(locale, {
      en: "Reset your IOMA Paris password",
      fr: "Réinitialisez votre mot de passe IOMA Paris",
      ar: "إعادة تعيين كلمة مرور IOMA Paris",
    }),
    html: layout({
      locale,
      eyebrow: t(locale, { en: "Security", fr: "Sécurité", ar: "الأمان" }),
      heading: t(locale, {
        en: "Reset your password",
        fr: "Réinitialisez votre mot de passe",
        ar: "إعادة تعيين كلمة المرور",
      }),
      bodyHtml: t(locale, {
        en:
          p("We received a request to reset the password of your IOMA Paris account.") +
          p(
            `Choose a new password with the button below. The link expires in <strong>${minutes} minutes</strong> and works once.`,
          ),
        fr:
          p(
            "Nous avons reçu une demande de réinitialisation du mot de passe de votre compte IOMA Paris.",
          ) +
          p(
            `Choisissez un nouveau mot de passe avec le bouton ci-dessous. Le lien expire dans <strong>${minutes} minutes</strong> et ne fonctionne qu'une fois.`,
          ),
        ar:
          p("تلقّينا طلباً لإعادة تعيين كلمة مرور حسابكم في IOMA Paris.") +
          p(
            `اختاروا كلمة مرور جديدة بالزر أدناه. ينتهي الرابط خلال <strong>${minutes} دقيقة</strong> ويعمل مرة واحدة.`,
          ),
      }),
      button: {
        label: t(locale, {
          en: "Choose a new password",
          fr: "Choisir un nouveau mot de passe",
          ar: "اختيار كلمة مرور جديدة",
        }),
        url,
      },
      note: t(locale, {
        en: "If you did not ask for this, ignore this email: your password stays unchanged. We never send passwords by email.",
        fr: "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe reste inchangé. Nous n'envoyons jamais de mot de passe par e-mail.",
        ar: "إذا لم تطلبوا ذلك فتجاهلوا هذه الرسالة: كلمة مرورکم لا تتغير. لا نرسل كلمات المرور بالبريد أبداً.",
      }),
    }),
  };
}

// ───────────────────────── Partner applications ─────────────────────────

export interface PartnerApplicationFacts {
  reference: string;
  status: string;
  contactPerson?: string | null;
  applicantName?: string | null;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  businessType?: string | null;
  city?: string | null;
  emirate?: string | null;
  address?: string | null;
  tradeLicenceNumber?: string | null;
  vatNumber?: string | null;
  website?: string | null;
  socialMedia?: string | null;
  locationsCount?: number | null;
  expectedOrderVolume?: string | null;
  message?: string | null;
  submittedAt?: Date | null;
  documentsCount?: number;
}

const BUSINESS_LABEL: Record<string, string> = {
  spa: "Spa",
  clinic: "Clinic",
  beauty_institute: "Beauty institute",
  hotel: "Hotel",
  retail: "Retail",
  distributor: "Distributor",
};

/** To the IOMA team (contact@): a partner application was submitted. Only fields that exist are shown. */
export function partnerApplicationTeamEmail(
  a: PartnerApplicationFacts,
  reviewUrl: string,
): Email {
  const rows: Array<[string, string | null | undefined]> = [
    ["Reference", a.reference],
    ["Status", a.status.replace(/_/g, " ")],
    ["Full name", a.contactPerson || a.applicantName],
    ["Email", a.email],
    ["Phone", a.phone],
    ["Company / salon", a.companyName],
    [
      "Business type",
      a.businessType ? (BUSINESS_LABEL[a.businessType] ?? a.businessType) : null,
    ],
    ["City", [a.city, a.emirate].filter(Boolean).join(", ") || null],
    ["Address", a.address],
    ["Trade licence", a.tradeLicenceNumber],
    ["VAT / TRN", a.vatNumber],
    ["Website", a.website],
    ["Social media", a.socialMedia],
    ["Locations", a.locationsCount ? String(a.locationsCount) : null],
    ["Expected volume", a.expectedOrderVolume],
    [
      "Documents uploaded",
      a.documentsCount !== undefined ? String(a.documentsCount) : null,
    ],
    [
      "Submitted",
      a.submittedAt
        ? new Intl.DateTimeFormat("en-GB", {
            dateStyle: "long",
            timeStyle: "short",
            timeZone: "Asia/Dubai",
          }).format(a.submittedAt) + " (Dubai)"
        : null,
    ],
  ];
  const table = rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:7px 18px 7px 0;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8a7f6d;white-space:nowrap;vertical-align:top;">${esc(k)}</td><td style="padding:7px 0;font-size:15px;color:#111;">${esc(String(v))}</td></tr>`,
    )
    .join("");
  const message = a.message
    ? `<div style="margin-top:20px;background:#faf7f1;padding:18px 20px;white-space:pre-wrap;font-size:14px;line-height:1.7;">${esc(a.message)}</div>`
    : "";
  return {
    subject: `New partner application: ${a.companyName || a.contactPerson || a.applicantName || a.reference}`,
    html: layout({
      locale: "en",
      eyebrow: "Partner application",
      heading: "A new partner application is waiting",
      bodyHtml: `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #e8e1d4;border-bottom:1px solid #e8e1d4;padding:6px 0;">${table}</table>${message}`,
      button: { label: "Review application", url: reviewUrl },
    }),
  };
}

export function partnerApprovedEmail(
  locale: EmailLocale,
  name: string,
  dashboardUrl: string,
  supportEmail: string,
): Email {
  const n = esc(name);
  const se = esc(supportEmail);
  const li = (s: string) => `<li style="margin:0 0 8px;">${s}</li>`;
  const benefits = t(locale, {
    en: [
      "Professional (trade) prices on the IOMA catalogue",
      "Online ordering for your institute",
      "Access to the IOMA training videos and the cabin gallery",
    ],
    fr: [
      "Tarifs professionnels sur le catalogue IOMA",
      "Commande en ligne pour votre établissement",
      "Accès aux vidéos de formation IOMA et à la galerie cabine",
    ],
    ar: [
      "الأسعار المهنية على كتالوج IOMA",
      "الطلب عبر الإنترنت لمؤسستكم",
      "الوصول إلى فيديوهات التدريب ومعرض الكابينة",
    ],
  });
  const side = locale === "ar" ? "padding-right" : "padding-left";
  return {
    subject: t(locale, {
      en: "Welcome to the IOMA Paris partner network",
      fr: "Bienvenue dans le réseau partenaire IOMA Paris",
      ar: "أهلاً بكم في شبكة شركاء IOMA Paris",
    }),
    html: layout({
      locale,
      eyebrow: t(locale, {
        en: "Partner application approved",
        fr: "Candidature partenaire acceptée",
        ar: "تمت الموافقة على طلب الشراكة",
      }),
      heading: t(locale, {
        en: `Welcome, ${name}`,
        fr: `Bienvenue, ${name}`,
        ar: `أهلاً بكم، ${name}`,
      }),
      bodyHtml: t(locale, {
        en:
          p(`Hello ${n},`) +
          p(
            "We are delighted to confirm that your partner application has been <strong>approved</strong>. Welcome to the IOMA Paris partner network.",
          ) +
          p("Your account now gives you:") +
          `<ul style="margin:0 0 16px;${side}:20px;">${benefits.map(li).join("")}</ul>` +
          p(`Need help? Write to <a href="mailto:${se}" style="color:#111;">${se}</a>.`),
        fr:
          p(`Bonjour ${n},`) +
          p(
            "Nous avons le plaisir de vous confirmer que votre candidature partenaire a été <strong>acceptée</strong>. Bienvenue dans le réseau partenaire IOMA Paris.",
          ) +
          p("Votre compte vous donne désormais accès à :") +
          `<ul style="margin:0 0 16px;${side}:20px;">${benefits.map(li).join("")}</ul>` +
          p(
            `Besoin d'aide ? Écrivez à <a href="mailto:${se}" style="color:#111;">${se}</a>.`,
          ),
        ar:
          p(`مرحباً ${n}،`) +
          p(
            "يسعدنا تأكيد <strong>الموافقة</strong> على طلب الشراكة الخاص بكم. أهلاً بكم في شبكة شركاء IOMA Paris.",
          ) +
          p("يتيح لكم حسابكم الآن:") +
          `<ul style="margin:0 0 16px;${side}:20px;">${benefits.map(li).join("")}</ul>` +
          p(
            `هل تحتاجون إلى مساعدة؟ راسلونا على <a href="mailto:${se}" style="color:#111;">${se}</a>.`,
          ),
      }),
      button: {
        label: t(locale, {
          en: "Open my partner space",
          fr: "Accéder à mon espace partenaire",
          ar: "فتح مساحة الشريك",
        }),
        url: dashboardUrl,
      },
    }),
  };
}

export function partnerRejectedEmail(
  locale: EmailLocale,
  name: string,
  reason: string | null,
  supportEmail: string,
): Email {
  const n = esc(name);
  const se = esc(supportEmail);
  const why = reason
    ? `<div style="margin:0 0 16px;background:#faf7f1;padding:16px 18px;white-space:pre-wrap;">${esc(reason)}</div>`
    : "";
  return {
    subject: t(locale, {
      en: "Your IOMA Paris partner application",
      fr: "Votre candidature partenaire IOMA Paris",
      ar: "طلب الشراكة الخاص بكم لدى IOMA Paris",
    }),
    html: layout({
      locale,
      eyebrow: t(locale, {
        en: "Partner application",
        fr: "Candidature partenaire",
        ar: "طلب الشراكة",
      }),
      heading: t(locale, {
        en: "An update on your application",
        fr: "Une réponse à votre candidature",
        ar: "بخصوص طلبكم",
      }),
      bodyHtml: t(locale, {
        en:
          p(`Hello ${n},`) +
          p(
            "Thank you for your interest in becoming an IOMA Paris partner. After review, we are unable to approve your application at this time.",
          ) +
          why +
          p(
            `If you would like to discuss it, please write to <a href="mailto:${se}" style="color:#111;">${se}</a>.`,
          ),
        fr:
          p(`Bonjour ${n},`) +
          p(
            "Merci de l'intérêt que vous portez au réseau partenaire IOMA Paris. Après examen, nous ne pouvons pas donner suite à votre candidature pour le moment.",
          ) +
          why +
          p(
            `Pour en discuter, écrivez-nous à <a href="mailto:${se}" style="color:#111;">${se}</a>.`,
          ),
        ar:
          p(`مرحباً ${n}،`) +
          p(
            "نشكركم على اهتمامكم بالانضمام إلى شبكة شركاء IOMA Paris. بعد المراجعة، لا يمكننا قبول طلبكم في الوقت الحالي.",
          ) +
          why +
          p(
            `للنقاش يمكنكم مراسلتنا على <a href="mailto:${se}" style="color:#111;">${se}</a>.`,
          ),
      }),
    }),
  };
}
