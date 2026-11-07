import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import type { EnvConfig } from "../../config/env.validation";

const SUBJECTS: Record<string, string> = {
  en: "Reset your IOMA Paris password",
  fr: "Reinitialisez votre mot de passe IOMA Paris",
  ar: "إعادة تعيين كلمة مرور IOMA Paris الخاصة بك",
};

function buildEmailHtml(locale: string, resetUrl: string, expiryMinutes: number): string {
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const headingMap: Record<string, string> = {
    en: "Password Reset",
    fr: "Reinitialisation du mot de passe",
    ar: "إعادة تعيين كلمة المرور",
  };
  const bodyMap: Record<string, string> = {
    en: `You requested a password reset for your IOMA Paris account.<br>Click the button below to set a new password. This link expires in <strong>${expiryMinutes} minutes</strong>.`,
    fr: `Vous avez demande la reinitialisation du mot de passe de votre compte IOMA Paris.<br>Cliquez sur le bouton ci-dessous pour definir un nouveau mot de passe. Ce lien expire dans <strong>${expiryMinutes} minutes</strong>.`,
    ar: `لقد طلبت إعادة تعيين كلمة مرور حسابك في IOMA Paris.<br>انقر على الزر أدناه لتعيين كلمة مرور جديدة. تنتهي صلاحية هذا الرابط خلال <strong>${expiryMinutes} دقيقة</strong>.`,
  };
  const btnMap: Record<string, string> = {
    en: "RESET MY PASSWORD",
    fr: "REINITIALISER MON MOT DE PASSE",
    ar: "إعادة تعيين كلمة المرور",
  };
  const securityMap: Record<string, string> = {
    en: "If you did not request this, you can safely ignore this email. Your account remains secure.",
    fr: "Si vous n'avez pas fait cette demande, ignorez cet e-mail. Votre compte reste securise.",
    ar: "إذا لم تطلب ذلك، يمكنك تجاهل هذا البريد الإلكتروني بأمان. حسابك لا يزال آمناً.",
  };
  const footerMap: Record<string, string> = {
    en: "This is an automated message from IOMA Paris - Dubai. Do not reply.",
    fr: "Ce message est automatiquement envoye par IOMA Paris - Dubai. Ne repondez pas.",
    ar: "هذه رسالة تلقائية من IOMA Paris - Dubai. لا ترد على هذا البريد.",
  };

  const heading = headingMap[locale] ?? headingMap["en"];
  const body = bodyMap[locale] ?? bodyMap["en"];
  const btn = btnMap[locale] ?? btnMap["en"];
  const security = securityMap[locale] ?? securityMap["en"];
  const footer = footerMap[locale] ?? footerMap["en"];

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${SUBJECTS[locale] ?? SUBJECTS["en"]}</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#4a3f8f;padding:24px 40px;text-align:center;">
            <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.15em;font-family:Georgia,serif;">IOMA PARIS</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px;direction:${dir};">
            <h1 style="font-size:20px;font-weight:700;margin:0 0 16px;color:#1a1a1a;letter-spacing:0.02em;">${heading}</h1>
            <p style="font-size:15px;line-height:1.7;margin:0 0 32px;color:#444;">${body}</p>
            <div style="text-align:center;margin:0 0 32px;">
              <a href="${resetUrl}" style="display:inline-block;background:#4a3f8f;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:0.12em;padding:16px 36px;border-radius:8px;">${btn}</a>
            </div>
            <p style="font-size:12px;color:#888;line-height:1.6;margin:0 0 8px;">${security}</p>
            <p style="font-size:12px;color:#bbb;margin:0;word-break:break-all;">
              <a href="${resetUrl}" style="color:#4a3f8f;">${resetUrl}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f5f4f0;padding:20px 40px;border-top:1px solid #e8e6e0;text-align:center;">
            <p style="font-size:11px;color:#aaa;margin:0;">${footer}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {
    const provider = this.configService.get("EMAIL_PROVIDER", { infer: true });
    const host = this.configService.get("SMTP_HOST", { infer: true });
    const port = this.configService.get("SMTP_PORT", { infer: true });
    const user = this.configService.get("SMTP_USER", { infer: true });
    const pass = this.configService.get("SMTP_PASS", { infer: true });

    if (provider !== "smtp-dev" && host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`MailService: SMTP transport configured (${host}:${port})`);
    } else {
      this.logger.warn(
        "MailService: No SMTP credentials configured — emails will be logged to console. " +
          "Set EMAIL_PROVIDER=smtp + SMTP_HOST/PORT/USER/PASS to enable real delivery.",
      );
    }
  }

  /** Generic transactional email. Logs to the console without SMTP; never throws. */
  async sendHtml(to: string, subject: string, html: string): Promise<void> {
    const from = this.configService.get("EMAIL_FROM", { infer: true });
    if (!this.transporter) {
      this.logger.warn(`[DEV EMAIL] To: ${to}
[DEV EMAIL] Subject: ${subject}`);
      return;
    }
    try {
      await this.transporter.sendMail({ from, to, subject, html });
    } catch (err) {
      this.logger.error(`Failed to send email "${subject}" to ${to}`, err);
    }
  }

  async sendPasswordResetEmail(
    to: string,
    locale: string,
    resetUrl: string,
    expiryMinutes: number,
  ): Promise<void> {
    const lang = ["en", "fr", "ar"].includes(locale) ? locale : "en";
    const subject = SUBJECTS[lang] ?? SUBJECTS["en"];
    const html = buildEmailHtml(lang, resetUrl, expiryMinutes);
    const from = this.configService.get("EMAIL_FROM", { infer: true });

    if (!this.transporter) {
      this.logger.warn(
        `[DEV EMAIL] To: ${to}\n[DEV EMAIL] Subject: ${subject}\n[DEV EMAIL] Reset URL: ${resetUrl}`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({ from, to, subject, html });
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (err) {
      // Never rethrow — prevents account enumeration via delivery failure timing
      this.logger.error(`Failed to send password reset email to ${to}`, err);
    }
  }
}
