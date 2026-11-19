import { randomUUID } from "node:crypto";
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import type { EnvConfig } from "../../config/env.validation";
import { htmlToText, stripLineBreaks } from "./mail.util";

/** Which IOMA mailbox a message is sent from. */
export type MailIdentity = "contact" | "support";

export interface SendMailOptions {
  identity?: MailIdentity;
  to: string;
  subject: string;
  html: string;
  /** Plain-text alternative. Derived from the HTML when omitted. */
  text?: string;
  /** Customer address, so the team can answer straight from the mail client. */
  replyTo?: string;
}

/**
 * "accepted" only means the SMTP server took the message. It does NOT prove delivery:
 * delivery can still fail later and come back as a bounce to the sender mailbox.
 */
export interface SendMailResult {
  status: "accepted" | "failed" | "skipped";
  messageId?: string;
  attempts: number;
  /** Safe summary of the failure (no credentials). */
  reason?: string;
}

interface Identity {
  user: string;
  pass: string;
  address: string;
}

const MAX_ATTEMPTS = 3;
const TRANSIENT_CODES = new Set([
  "ECONNECTION",
  "ECONNRESET",
  "ETIMEDOUT",
  "ESOCKET",
  "EDNS",
  "ECONNREFUSED",
  "EAI_AGAIN",
]);

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
export class MailService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailService.name);
  private readonly transports = new Map<MailIdentity, nodemailer.Transporter>();
  private readonly identities = new Map<MailIdentity, Identity>();
  private legacy: { transporter: nodemailer.Transporter; from: string } | null = null;

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {
    const get = <K extends keyof EnvConfig>(k: K) =>
      this.configService.get(k, { infer: true });
    const provider = get("EMAIL_PROVIDER");
    const host = get("SMTP_HOST");
    const port = get("SMTP_PORT");
    const secure = get("SMTP_SECURE") ?? port === 465;

    if (provider === "smtp-dev" || !host || !port) {
      this.logger.warn(
        "MailService: SMTP not configured, emails are logged to the console only. " +
          "Set EMAIL_PROVIDER=smtp, SMTP_HOST/PORT and the SMTP_CONTACT_* / SMTP_SUPPORT_* secrets to enable real sending.",
      );
      return;
    }

    // Implicit TLS on 465; certificate verification stays ON (never rejectUnauthorized:false).
    const base = {
      host,
      port,
      secure,
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 30_000,
    };

    const defs: Array<[MailIdentity, string | undefined, string | undefined]> = [
      ["contact", get("SMTP_CONTACT_USER"), get("SMTP_CONTACT_PASSWORD")],
      ["support", get("SMTP_SUPPORT_USER"), get("SMTP_SUPPORT_PASSWORD")],
    ];
    for (const [id, user, pass] of defs) {
      if (!user || !pass) {
        this.logger.warn(
          `MailService: ${id} mailbox has no password configured, it is disabled`,
        );
        continue;
      }
      this.identities.set(id, { user, pass, address: user });
      this.transports.set(
        id,
        nodemailer.createTransport({ ...base, auth: { user, pass } }),
      );
    }

    // Legacy single-mailbox configuration (kept so existing deployments keep working).
    const user = get("SMTP_USER");
    const pass = get("SMTP_PASS");
    if (user && pass) {
      this.legacy = {
        transporter: nodemailer.createTransport({ ...base, auth: { user, pass } }),
        from: get("EMAIL_FROM"),
      };
    }
    this.logger.log(
      `MailService: SMTP ${host}:${port} (${secure ? "implicit TLS" : "STARTTLS"}), identities: ${
        [...this.identities.keys()].join(", ") || "none"
      }`,
    );
  }

  /** Verifies connection + authentication for every mailbox. Reports status only, never secrets. */
  async verify(): Promise<Record<string, "ok" | "failed">> {
    const out: Record<string, "ok" | "failed"> = {};
    for (const [id, t] of this.transports) {
      try {
        await t.verify();
        out[id] = "ok";
      } catch (err) {
        out[id] = "failed";
        this.logger.error(`SMTP verify failed for ${id}: ${this.safeReason(err)}`);
      }
    }
    return out;
  }

  onModuleInit() {
    // Non-blocking: a mail outage must never stop the API from booting.
    if (this.transports.size) {
      void this.verify().then((r) =>
        this.logger.log(`SMTP verification: ${JSON.stringify(r)}`),
      );
    }
  }

  onModuleDestroy() {
    for (const t of this.transports.values()) t.close();
    this.legacy?.transporter.close();
  }

  /** Address used as From/To for an identity, if configured. */
  addressFor(identity: MailIdentity): string | undefined {
    return this.identities.get(identity)?.address;
  }

  /**
   * Sends one message with retries on temporary failures only.
   * The Message-ID is created once, so every retry carries the same id (receivers can de-duplicate),
   * and a message the server already accepted is never re-sent.
   * Never throws; the outcome is returned.
   */
  async send(opts: SendMailOptions): Promise<SendMailResult> {
    const identity = opts.identity ?? "contact";
    const subject = stripLineBreaks(opts.subject).slice(0, 200);
    const to = stripLineBreaks(opts.to);
    const replyTo = opts.replyTo ? stripLineBreaks(opts.replyTo) : undefined;

    const id = this.identities.get(identity);
    const transporter = this.transports.get(identity) ?? this.legacy?.transporter;
    const fromAddress = id?.address ?? this.legacy?.from;
    if (!transporter || !fromAddress) {
      this.logger.warn(`[DEV EMAIL] identity=${identity} To: ${to} Subject: ${subject}`);
      return { status: "skipped", attempts: 0, reason: "smtp-not-configured" };
    }

    const domain = (id?.address ?? "ioma.local").split("@")[1] ?? "ioma.local";
    const messageId = `<${randomUUID()}@${domain}>`;
    const fromName = identity === "support" ? "IOMA Paris Support" : "IOMA Paris";
    const from = id ? { name: fromName, address: id.address } : fromAddress;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        await transporter.sendMail({
          from,
          to,
          subject,
          html: opts.html,
          text: opts.text ?? htmlToText(opts.html),
          replyTo,
          messageId,
        });
        this.logger.log(
          `Mail accepted by SMTP server (identity=${identity}, attempt=${attempt}). ` +
            "Acceptance is not proof of delivery: watch the mailbox for bounces.",
        );
        return { status: "accepted", messageId, attempts: attempt };
      } catch (err) {
        const reason = this.safeReason(err);
        if (attempt < MAX_ATTEMPTS && this.isTransient(err)) {
          this.logger.warn(
            `SMTP temporary failure (attempt ${attempt}): ${reason}, retrying`,
          );
          await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
          continue;
        }
        this.logger.error(
          `SMTP send failed (identity=${identity}, attempt ${attempt}): ${reason}`,
        );
        return { status: "failed", attempts: attempt, reason };
      }
    }
    return { status: "failed", attempts: MAX_ATTEMPTS, reason: "exhausted" };
  }

  /** Generic transactional email (kept for existing callers). Never throws. */
  async sendHtml(
    to: string,
    subject: string,
    html: string,
    extra?: Partial<Omit<SendMailOptions, "to" | "subject" | "html">>,
  ): Promise<void> {
    await this.send({ to, subject, html, ...extra });
  }

  async sendPasswordResetEmail(
    to: string,
    locale: string,
    resetUrl: string,
    expiryMinutes: number,
  ): Promise<void> {
    const lang = ["en", "fr", "ar"].includes(locale) ? locale : "en";
    const subject = SUBJECTS[lang] ?? "Reset your IOMA Paris password";
    const html = buildEmailHtml(lang, resetUrl, expiryMinutes);
    if (!this.transports.size && !this.legacy) {
      this.logger.warn(
        `[DEV EMAIL] To: ${to}\n[DEV EMAIL] Subject: ${subject}\n[DEV EMAIL] Reset URL: ${resetUrl}`,
      );
      return;
    }
    // Never rethrow: prevents account enumeration via delivery failure timing.
    await this.send({ identity: "support", to, subject, html });
  }

  private isTransient(err: unknown): boolean {
    const e = err as { code?: string; responseCode?: number };
    if (e.responseCode && e.responseCode >= 400 && e.responseCode < 500) return true;
    return !!e.code && TRANSIENT_CODES.has(e.code);
  }

  /** Error text without anything that could carry a credential. */
  private safeReason(err: unknown): string {
    const e = err as {
      code?: string;
      responseCode?: number;
      command?: string;
      message?: string;
    };
    const parts = [
      e.code,
      e.responseCode ? `smtp ${e.responseCode}` : undefined,
      e.command,
    ].filter(Boolean);
    return parts.length ? parts.join(" ") : "unknown error";
  }
}
