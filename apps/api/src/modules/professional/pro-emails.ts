// Transactional emails for the trade-access flow. Lead-supplied text is always escaped.

type Locale = "en" | "ar";
export interface Email {
  subject: string;
  html: string;
}

const esc = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function layout(
  locale: Locale,
  heading: string,
  bodyHtml: string,
  button?: { label: string; url: string },
) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const cta = button
    ? `<div style="text-align:center;margin:28px 0;"><a href="${esc(button.url)}" style="display:inline-block;background:#4a3f8f;color:#fff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:.12em;padding:15px 32px;border-radius:8px;">${esc(button.label)}</a></div>`
    : "";
  return `<!DOCTYPE html><html lang="${locale}" dir="${dir}"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1a1a1a;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:36px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#4a3f8f;padding:22px 36px;text-align:center;"><span style="font-size:20px;font-weight:700;color:#fff;letter-spacing:.15em;">IOMA PARIS · PRO</span></td></tr>
<tr><td style="padding:36px;direction:${dir};">
<h1 style="font-size:19px;margin:0 0 14px;">${esc(heading)}</h1>
<div style="font-size:15px;line-height:1.7;color:#444;">${bodyHtml}</div>${cta}
</td></tr>
<tr><td style="background:#f5f4f0;padding:16px 36px;text-align:center;font-size:11px;color:#999;">IOMA Paris – Dubai</td></tr>
</table></td></tr></table></body></html>`;
}

export interface LeadFacts {
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
  email: string;
}

/** To the IOMA team: a new registration to call back. */
export function teamNotification(lead: LeadFacts, adminUrl: string): Email {
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#888;">${k}</td><td style="padding:6px 0;"><strong>${esc(v)}</strong></td></tr>`;
  return {
    subject: `New trade access request — ${lead.companyName}`,
    html: layout(
      "en",
      "New trade access request",
      `<p>A professional asked for trade access. Call them, ask for the Trade License and the TRN, then validate the account in the back office.</p>
<table style="font-size:14px;margin-top:8px;">${row("Name", `${lead.firstName} ${lead.lastName}`)}${row("Company", lead.companyName)}${row("Phone", lead.phone)}${row("Email", lead.email)}</table>`,
      { label: "OPEN THE LEADS LIST", url: adminUrl },
    ),
  };
}

/** To the lead: we received the request and will call. */
export function leadConfirmation(locale: Locale, firstName: string): Email {
  if (locale === "ar") {
    return {
      subject: "استلمنا طلب الوصول المهني الخاص بك",
      html: layout(
        "ar",
        `شكراً ${firstName}`,
        "<p>استلمنا طلبك للحصول على الوصول المهني لدى IOMA. سيتصل بك فريقنا لطلب الرخصة التجارية ورقم التسجيل الضريبي (TRN) والتحقق من حسابك.</p><p>بعد الموافقة ستظهر لك الأسعار المهنية ويمكنك الطلب عبر الإنترنت.</p>",
      ),
    };
  }
  return {
    subject: "We received your trade access request",
    html: layout(
      "en",
      `Thank you, ${firstName}`,
      "<p>We received your request for IOMA trade access. Our team will call you to ask for your Trade License and Tax Registration Number (TRN) and to validate your account.</p><p>Once approved, you will see the trade prices and can order online.</p>",
    ),
  };
}

/** To a validated lead who has no password yet: set one to sign in. */
export function validationInvite(
  locale: Locale,
  firstName: string,
  setupUrl: string,
  hours: number,
): Email {
  if (locale === "ar") {
    return {
      subject: "تمت الموافقة على حسابك المهني لدى IOMA",
      html: layout(
        "ar",
        `مرحباً ${firstName}`,
        `<p>تمت الموافقة على حسابك المهني. يمكنك الآن رؤية الأسعار المهنية وتقديم طلبك الأول. سيفتح طلبك الأول أيضاً مقاطع التدريب ومعرض الكابينة ومزاياك.</p><p>عيّن كلمة المرور للدخول (الرابط صالح لمدة ${hours} ساعة).</p>`,
        { label: "تعيين كلمة المرور", url: setupUrl },
      ),
    };
  }
  return {
    subject: "Your IOMA trade account is validated",
    html: layout(
      "en",
      `Welcome, ${firstName}`,
      `<p>Your trade account is validated. You can now see the trade prices and place your first order. Your first order also unlocks the training videos, the cabin gallery and your benefits.</p><p>Set your password to sign in (this link is valid for ${hours} hours).</p>`,
      { label: "SET MY PASSWORD", url: setupUrl },
    ),
  };
}

/** To a validated lead who already had an IOMA login. */
export function validationNotice(
  locale: Locale,
  firstName: string,
  portalUrl: string,
): Email {
  if (locale === "ar") {
    return {
      subject: "تمت الموافقة على حسابك المهني لدى IOMA",
      html: layout(
        "ar",
        `مرحباً ${firstName}`,
        "<p>تمت الموافقة على حسابك المهني. سجّل الدخول بحسابك الحالي لرؤية الأسعار المهنية وتقديم طلبك الأول.</p>",
        { label: "الدخول إلى المساحة المهنية", url: portalUrl },
      ),
    };
  }
  return {
    subject: "Your IOMA trade account is validated",
    html: layout(
      "en",
      `Welcome, ${firstName}`,
      "<p>Your trade account is validated. Sign in with your existing IOMA login to see the trade prices and place your first order.</p>",
      { label: "OPEN THE PRO SPACE", url: portalUrl },
    ),
  };
}
