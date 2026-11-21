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

describe("MailOutboxService failures and manual retry", () => {
  it("records every attempt in the log and marks the mail failed after the last attempt", async () => {
    const send = jest.fn().mockResolvedValue({ status: "failed", reason: "smtp 421" });
    const { svc, rows, model } = build(send);
    await svc.enqueue(mail);
    await flush();
    // pretend 7 attempts already happened: the next failure is final
    rows.r1!.attempts = 7;
    rows.r1!.status = "pending";
    rows.r1!.lockedUntil = null;
    rows.r1!.nextAttemptAt = new Date(Date.now() - 1000);
    await svc.attempt("r1");
    expect(rows.r1!.status).toBe("failed");
    expect(rows.r1!.lastError).toBe("smtp 421");
    const pushes = model.updateOne.mock.calls
      .map(
        (c) =>
          (
            c[1] as {
              $push?: { attemptLog: { $each: { outcome: string; reason?: string }[] } };
            }
          ).$push,
      )
      .filter(Boolean);
    expect(pushes.length).toBeGreaterThanOrEqual(2);
    expect(pushes[0]!.attemptLog.$each[0]).toMatchObject({
      outcome: "failed",
      reason: "smtp 421",
    });
  });

  it("an administrator can put a failed mail back in the queue and it is sent again", async () => {
    const send = jest
      .fn()
      .mockResolvedValueOnce({ status: "failed", reason: "ECONNREFUSED" })
      .mockResolvedValueOnce({ status: "accepted", messageId: "<ok>" });
    const { svc, rows, model } = build(send);
    (model.updateOne as jest.Mock).mockImplementation(
      async (_q: unknown, u: { $set: Record<string, unknown> }) => {
        Object.assign(rows.r1!, u.$set);
        return { matchedCount: 1 };
      },
    );
    await svc.enqueue(mail);
    await flush();
    rows.r1!.status = "failed";
    expect(await svc.retry("r1")).toBe(true);
    await flush();
    expect(rows.r1!.status).toBe("sent");
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("refuses to retry a mail that was already sent", async () => {
    const { svc, model } = build(jest.fn());
    (model.updateOne as jest.Mock).mockResolvedValue({ matchedCount: 0 });
    expect(await svc.retry("r1")).toBe(false);
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
