import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type PasswordResetTokenDocument = HydratedDocument<PasswordResetToken>;

@Schema({ timestamps: true })
export class PasswordResetToken {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  /** SHA-256 hash of the raw token — never store plaintext. */
  @Prop({ required: true, index: true })
  tokenHash!: string;

  /** When the token expires — TTL index auto-deletes expired documents. */
  @Prop({ required: true })
  expiresAt!: Date;

  /** Set when the token is consumed — prevents reuse. */
  @Prop({ type: Date, default: null })
  usedAt!: Date | null;
}

export const PasswordResetTokenSchema = SchemaFactory.createForClass(PasswordResetToken);

// Auto-delete expired tokens from MongoDB (TTL index)
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
