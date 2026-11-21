import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type MailOutboxDocument = HydratedDocument<MailOutbox>;
export type OutboxStatus = "pending" | "sent" | "failed" | "skipped";

/**
 * Durable record of an email that must go out. The unique `key` makes a notification idempotent
 * (e.g. "pro-app-approved:<applicationId>"): enqueueing it twice creates one email.
 * Never used for emails that carry secrets (verification / reset links).
 */
@Schema({ timestamps: true, collection: "mailoutbox" })
export class MailOutbox {
  @Prop({ required: true, unique: true })
  key!: string;

  @Prop({ type: String, enum: ["contact", "support"], default: "contact" })
  identity!: "contact" | "support";

  @Prop({ required: true })
  to!: string;

  @Prop({ required: true })
  subject!: string;

  @Prop({ required: true })
  html!: string;

  @Prop({ type: String, default: null })
  replyTo!: string | null;

  @Prop({
    type: String,
    enum: ["pending", "sent", "failed", "skipped"],
    default: "pending",
    index: true,
  })
  status!: OutboxStatus;

  @Prop({ default: 0 })
  attempts!: number;

  @Prop({ type: Date, default: () => new Date() })
  nextAttemptAt!: Date;

  /** Claim lease so two workers never send the same row at once. */
  @Prop({ type: Date, default: null })
  lockedUntil!: Date | null;

  @Prop({ type: String, default: null })
  lastError!: string | null;

  @Prop({ type: String, default: null })
  messageId!: string | null;

  @Prop({ type: Date, default: null })
  sentAt!: Date | null;

  /** Display name of the sender, e.g. "IOMA Paris Orders". Defaults to the identity's name. */
  @Prop({ type: String, default: null })
  fromName!: string | null;

  /** What the mail is (e.g. "order.placed.customer"), for filtering in the admin. */
  @Prop({ type: String, default: null, index: true })
  kind!: string | null;

  /** What it is about (e.g. the order number), for searching. */
  @Prop({ type: String, default: null, index: true })
  ref!: string | null;

  /** Last delivery attempts (newest last, capped): when, outcome and a safe reason. Never holds credentials. */
  @Prop({ type: [Object], default: [] })
  attemptLog!: { at: Date; outcome: string; reason?: string }[];
}

export const MailOutboxSchema = SchemaFactory.createForClass(MailOutbox);
MailOutboxSchema.index({ status: 1, nextAttemptAt: 1 });
