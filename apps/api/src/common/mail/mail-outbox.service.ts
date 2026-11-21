import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { MailService, type MailIdentity } from "./mail.service";
import { MailOutbox, MailOutboxDocument } from "./mail-outbox.schema";

const MAX_ATTEMPTS = 8;
const LEASE_MS = 2 * 60_000;
const SWEEP_MS = 60_000;
/** Backoff between attempts: 1m, 5m, 15m, 1h, 3h, 6h, 12h. */
const BACKOFF_MIN = [1, 5, 15, 60, 180, 360, 720];

export interface OutboxMail {
  /** Idempotency key: the same key is only ever sent once. */
  key: string;
  identity?: MailIdentity;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  fromName?: string;
  kind?: string;
  ref?: string;
}

const LOG_CAP = 20;
const escapeRegex = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

@Injectable()
export class MailOutboxService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailOutboxService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectModel(MailOutbox.name) private readonly model: Model<MailOutboxDocument>,
    private readonly mail: MailService,
  ) {}

  onModuleInit() {
    // Durable retry: anything still pending (SMTP down, process restarted) is picked up here.
    this.timer = setInterval(() => void this.sweep(), SWEEP_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  /** Stores the mail, then delivers it in the background. Never throws, never blocks the caller. */
  async enqueue(mail: OutboxMail): Promise<{ created: boolean; failed?: boolean }> {
    try {
      const doc = await this.model.create({
        key: mail.key,
        identity: mail.identity ?? "contact",
        to: mail.to,
        subject: mail.subject,
        html: mail.html,
        replyTo: mail.replyTo ?? null,
        fromName: mail.fromName ?? null,
        kind: mail.kind ?? null,
        ref: mail.ref ?? null,
      });
      void this.attempt(doc.id);
      return { created: true };
    } catch (err) {
      if ((err as { code?: number }).code === 11000) return { created: false };
      this.logger.error(`Outbox enqueue failed (${mail.key}): ${(err as Error).message}`);
      return { created: false, failed: true };
    }
  }

  /** Claims one due row and sends it. Safe to call concurrently. */
  async attempt(id: string): Promise<void> {
    const now = new Date();
    const row = await this.model.findOneAndUpdate(
      {
        _id: id,
        status: "pending",
        nextAttemptAt: { $lte: now },
        $or: [{ lockedUntil: null }, { lockedUntil: { $lt: now } }],
      },
      { $set: { lockedUntil: new Date(now.getTime() + LEASE_MS) } },
      { new: true },
    );
    if (!row) return;

    const res = await this.mail.send({
      identity: row.identity,
      to: row.to,
      subject: row.subject,
      html: row.html,
      replyTo: row.replyTo ?? undefined,
      fromName: row.fromName ?? undefined,
    });
    const logEntry = {
      $each: [{ at: new Date(), outcome: res.status, reason: res.reason }],
      $slice: -LOG_CAP,
    };

    if (res.status === "accepted") {
      await this.model.updateOne(
        { _id: row._id },
        {
          $set: {
            status: "sent",
            sentAt: new Date(),
            messageId: res.messageId ?? null,
            lockedUntil: null,
            lastError: null,
          },
          $inc: { attempts: 1 },
          $push: { attemptLog: logEntry },
        },
      );
      return;
    }
    if (res.status === "skipped") {
      // SMTP is not configured (dev): nothing to retry.
      await this.model.updateOne(
        { _id: row._id },
        {
          $set: { status: "skipped", lockedUntil: null },
          $push: { attemptLog: logEntry },
        },
      );
      return;
    }
    const attempts = row.attempts + 1;
    const final = attempts >= MAX_ATTEMPTS;
    const wait = BACKOFF_MIN[Math.min(attempts - 1, BACKOFF_MIN.length - 1)]! * 60_000;
    await this.model.updateOne(
      { _id: row._id },
      {
        $set: {
          status: final ? "failed" : "pending",
          attempts,
          lastError: res.reason ?? "send failed",
          nextAttemptAt: new Date(Date.now() + wait),
          lockedUntil: null,
        },
        $push: { attemptLog: logEntry },
      },
    );
    if (final)
      this.logger.error(`Outbox mail ${row.key} failed permanently: ${res.reason}`);
  }

  /** Admin list (newest first). The HTML body is not returned here; use `preview`. */
  async list(filter: { status?: string; q?: string; page: number; limit: number }) {
    const where: Record<string, unknown> = {};
    if (filter.status && filter.status !== "all") where.status = filter.status;
    if (filter.q) {
      const rx = new RegExp(escapeRegex(filter.q), "i");
      where.$or = [{ to: rx }, { subject: rx }, { ref: rx }, { kind: rx }];
    }
    const [items, total] = await Promise.all([
      this.model
        .find(where)
        .select("-html")
        .sort({ createdAt: -1 })
        .skip((filter.page - 1) * filter.limit)
        .limit(filter.limit)
        .lean(),
      this.model.countDocuments(where),
    ]);
    return { items, total, page: filter.page, limit: filter.limit };
  }

  async preview(id: string) {
    return this.model.findById(id).select("html subject to").lean();
  }

  /** Puts a failed (or stuck) mail back in the queue and tries again right away. */
  async retry(id: string): Promise<boolean> {
    const res = await this.model.updateOne(
      { _id: id, status: { $in: ["failed", "skipped", "pending"] } },
      {
        $set: {
          status: "pending",
          attempts: 0,
          nextAttemptAt: new Date(),
          lockedUntil: null,
        },
      },
    );
    if (!res.matchedCount) return false;
    void this.attempt(id);
    return true;
  }

  async counts() {
    const rows = await this.model.aggregate<{ _id: string; n: number }>([
      { $group: { _id: "$status", n: { $sum: 1 } } },
    ]);
    return Object.fromEntries(rows.map((r) => [r._id, r.n]));
  }

  async sweep(): Promise<void> {
    try {
      const due = await this.model
        .find({ status: "pending", nextAttemptAt: { $lte: new Date() } })
        .select("_id")
        .limit(25)
        .lean();
      for (const d of due) await this.attempt(String(d._id));
    } catch (err) {
      this.logger.warn(`Outbox sweep error: ${(err as Error).message}`);
    }
  }
}
