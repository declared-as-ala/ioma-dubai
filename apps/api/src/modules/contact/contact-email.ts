import { escapeHtml, stripLineBreaks } from "../../common/mail/mail.util";

export interface ContactEmailData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  locale: string;
  category?: string;
  orderReference?: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  order: "Order or delivery",
  return: "Return or refund",
  product: "Product advice",
  account: "Account",
  pro: "Professional or partnership",
  other: "Other",
};

/** Internal notification for the IOMA team. Customer text is always escaped. */
export function buildContactEmail(d: ContactEmailData): {
  subject: string;
  html: string;
} {
  const subject = `[IOMA contact] ${CATEGORY_LABEL[d.category ?? "other"] ?? "Other"}: ${stripLineBreaks(d.subject)}`;
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 16px 6px 0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#8a7f6d;white-space:nowrap;vertical-align:top;">${label}</td><td style="padding:6px 0;font-size:15px;color:#1a1a1a;">${value}</td></tr>`;
  const rows = [
    row("From", escapeHtml(stripLineBreaks(d.name))),
    row(
      "Email",
      `<a href="mailto:${escapeHtml(d.email)}" style="color:#1a1a1a;">${escapeHtml(d.email)}</a>`,
    ),
    d.phone ? row("Phone", escapeHtml(stripLineBreaks(d.phone))) : "",
    row("Topic", escapeHtml(CATEGORY_LABEL[d.category ?? "other"] ?? "Other")),
    d.orderReference ? row("Order", escapeHtml(stripLineBreaks(d.orderReference))) : "",
    row("Language", escapeHtml(d.locale.toUpperCase())),
  ].join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f5f1ea;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1ea;padding:32px 12px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;">
        <tr><td style="background:#111111;padding:26px 40px;text-align:center;">
          <span style="font-family:Georgia,serif;font-size:22px;letter-spacing:.32em;color:#ffffff;">IOMA</span>
          <span style="display:block;font-size:10px;letter-spacing:.4em;color:#c8b690;margin-top:4px;">PARIS &middot; DUBAI</span>
        </td></tr>
        <tr><td style="padding:36px 40px 8px;">
          <p style="margin:0 0 6px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#8a7f6d;">New message from the website</p>
          <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-weight:400;font-size:22px;line-height:1.3;">${escapeHtml(stripLineBreaks(d.subject))}</h1>
          <table cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #e8e1d4;border-bottom:1px solid #e8e1d4;margin-bottom:24px;padding:8px 0;">${rows}</table>
          <div style="background:#faf7f1;padding:20px 22px;font-size:15px;line-height:1.7;color:#2a2a2a;white-space:pre-wrap;">${escapeHtml(d.message)}</div>
        </td></tr>
        <tr><td style="padding:24px 40px 36px;">
          <p style="margin:0;font-size:13px;color:#6b6b6b;line-height:1.6;">Use <strong>Reply</strong> to answer the customer directly: the reply goes to ${escapeHtml(d.email)}.</p>
        </td></tr>
        <tr><td style="background:#faf7f1;padding:16px 40px;text-align:center;border-top:1px solid #e8e1d4;">
          <p style="margin:0;font-size:11px;color:#9a9285;">IOMA Paris Dubai &middot; iomaparis.ae</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  return { subject, html };
}
