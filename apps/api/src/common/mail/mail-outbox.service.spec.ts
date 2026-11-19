import { MailOutboxService } from "./mail-outbox.service";
import { VerifiedEmailGuard } from "../../modules/auth/guards/verified-email.guard";

function build(send: jest.Mock) {
  const rows: Record<string, Record<string, unknown>> = {};
  const model = {
    create: jest.fn(async (d: Record<string, unknown>) => {
      if (Object.values(rows).some((r) => r.key === d.key))
        throw Object.assign(new Error("dup"), { code: 11000 });
      const row = { ...d, _id: "r1", id: "r1", status: "pending", attempts: 0 };
      rows.r1 = row;
      return row;
    }),
    // Claim lease: only one worker may take a pending row at a time.
    findOneAndUpdate: jest.fn(async () => {
      const r = rows.r1;
      if (!r || r.status !== "pending" || r.lockedUntil) return null;
      r.lockedUntil = new Date();
      return r;
    }),
    updateOne: jest.fn(async (_q: unknown, u: { $set: Record<string, unknown> }) => {
      Object.assign(rows.r1!, u.$set);
      if (rows.r1!.status === "pending" && !("lockedUntil" in u.$set))
        rows.r1!.lockedUntil = null;
    }),
    find: jest.fn(),
  };
  const svc = new MailOutboxService(model as never, { send } as never);
  return { svc, model, rows };
}

const flush = () => new Promise((r) => setTimeout(r, 20));
const mail = { key: "k1", to: "a@b.test", subject: "s", html: "<p>x</p>" };

describe("MailOutboxService", () => {
  it("creates one row per key and ignores a duplicate enqueue", async () => {
    const { svc } = build(jest.fn().mockResolvedValue({ status: "accepted" }));
    expect((await svc.enqueue(mail)).created).toBe(true);
    expect((await svc.enqueue(mail)).created).toBe(false);
  });

  it("marks a row sent when SMTP accepts it", async () => {
    const send = jest.fn().mockResolvedValue({ status: "accepted", messageId: "<m>" });
    const { svc, rows } = build(send);
    await svc.enqueue(mail);
    await flush();
    expect(rows.r1!.status).toBe("sent");
  });

  it("keeps a failed row pending with a later retry time, so the mail is not lost", async () => {
    const send = jest.fn().mockResolvedValue({ status: "failed", reason: "ETIMEDOUT" });
    const { svc, rows } = build(send);
    await svc.enqueue(mail);
    await flush();
    expect(rows.r1!.status).toBe("pending");
    expect(rows.r1!.attempts).toBe(1);
    expect((rows.r1!.nextAttemptAt as Date).getTime()).toBeGreaterThan(Date.now());
  });
});

describe("VerifiedEmailGuard", () => {
  const ctx = (user?: unknown) =>
    ({ switchToHttp: () => ({ getRequest: () => ({ user }) }) }) as never;
  const guard = new VerifiedEmailGuard();

  it("lets guests and verified users through", () => {
    expect(guard.canActivate(ctx(undefined))).toBe(true);
    expect(guard.canActivate(ctx({ roles: ["customer"], emailVerified: true }))).toBe(
      true,
    );
  });

  it("blocks an unverified customer with EMAIL_NOT_VERIFIED", () => {
    expect(() =>
      guard.canActivate(ctx({ roles: ["customer"], emailVerified: false })),
    ).toThrow(
      expect.objectContaining({
        response: expect.objectContaining({ error: "EMAIL_NOT_VERIFIED" }),
      }),
    );
  });
});
