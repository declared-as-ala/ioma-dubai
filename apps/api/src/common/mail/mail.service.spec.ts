import { MailService } from "./mail.service";
import { htmlToText, stripLineBreaks } from "./mail.util";

const sendMail = jest.fn();
const verify = jest.fn().mockResolvedValue(true);
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({ sendMail, verify, close: jest.fn() })),
}));

function build(env: Record<string, unknown>) {
  const config = { get: (k: string) => env[k] };
  return new MailService(config as never);
}

const SMTP = {
  EMAIL_PROVIDER: "smtp",
  SMTP_HOST: "mail.example.test",
  SMTP_PORT: 465,
  SMTP_CONTACT_USER: "contact@example.test",
  SMTP_CONTACT_PASSWORD: "secret-c",
  SMTP_SUPPORT_USER: "support@example.test",
  SMTP_SUPPORT_PASSWORD: "secret-s",
};

describe("MailService", () => {
  beforeEach(() => sendMail.mockReset());

  it("skips sending when SMTP is not configured", async () => {
    const res = await build({ EMAIL_PROVIDER: "smtp-dev" }).send({
      to: "a@b.test",
      subject: "x",
      html: "<p>x</p>",
    });
    expect(res.status).toBe("skipped");
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("sends from the identity mailbox with Reply-To and a text alternative", async () => {
    sendMail.mockResolvedValue({});
    const res = await build(SMTP).send({
      identity: "support",
      to: "team@example.test",
      subject: "Hello",
      html: "<p>Hi <b>there</b></p>",
      replyTo: "customer@example.test",
    });
    expect(res.status).toBe("accepted");
    const m = sendMail.mock.calls[0][0];
    expect(m.from.address).toBe("support@example.test");
    expect(m.replyTo).toBe("customer@example.test");
    expect(m.text).toContain("Hi there");
  });

  it("retries temporary failures with the same Message-ID, then succeeds once", async () => {
    sendMail
      .mockRejectedValueOnce(Object.assign(new Error("x"), { code: "ETIMEDOUT" }))
      .mockResolvedValueOnce({});
    const res = await build(SMTP).send({
      to: "a@b.test",
      subject: "s",
      html: "<p>x</p>",
    });
    expect(res).toMatchObject({ status: "accepted", attempts: 2 });
    expect(sendMail.mock.calls[0][0].messageId).toBe(sendMail.mock.calls[1][0].messageId);
  });

  it("does not retry permanent failures and never leaks the password", async () => {
    sendMail.mockRejectedValue(
      Object.assign(new Error("auth secret-c failed"), {
        code: "EAUTH",
        responseCode: 535,
      }),
    );
    const res = await build(SMTP).send({
      to: "a@b.test",
      subject: "s",
      html: "<p>x</p>",
    });
    expect(res.status).toBe("failed");
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(res)).not.toContain("secret-c");
  });

  it("strips line breaks from the subject (header injection)", async () => {
    sendMail.mockResolvedValue({});
    await build(SMTP).send({
      to: "a@b.test",
      subject: "Hi\r\nBcc: evil@x.test",
      html: "<p>x</p>",
    });
    expect(sendMail.mock.calls[0][0].subject).not.toMatch(/[\r\n]/);
  });
});

describe("mail utils", () => {
  it("removes control characters", () => {
    expect(stripLineBreaks("a\r\nb\u0000c")).toBe("a b c");
  });
  it("converts html to text", () => {
    expect(htmlToText("<p>A &amp; B</p><br>C")).toBe(
      "A & B\n\nC".replace("\n\n", "\n\n"),
    );
  });
});
