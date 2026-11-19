import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type EmailVerificationTokenDocument = HydratedDocument<EmailVerificationToken>;

@Schema({ timestamps: true })
export class EmailVerificationToken {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  /** SHA-256 of the raw token. The raw token only ever exists in the email link. */
  @Prop({ required: true, unique: true })
  tokenHash!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  /** Single use: set when the link is consumed. */
  @Prop({ type: Date, default: null })
  usedAt!: Date | null;
}

export const EmailVerificationTokenSchema =
  SchemaFactory.createForClass(EmailVerificationToken);

// Rows are kept 7 days past expiry so an old link can be reported as "expired" rather than "invalid".
EmailVerificationTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 7 * 24 * 3600 },
);
