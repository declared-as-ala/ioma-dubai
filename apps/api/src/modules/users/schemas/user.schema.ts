import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import type { UserRole } from "@ioma/types";

export type UserDocument = HydratedDocument<User>;

export const USER_ROLES: UserRole[] = [
  "guest",
  "customer",
  "professional_pending",
  "professional_approved",
  "professional_suspended",
  "partner_manager",
  "content_editor",
  "customer_support",
  "order_manager",
  "training_manager",
  "administrator",
  "super_administrator",
];

export class AdminNoteEntry {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  text!: string;

  @Prop({ required: true })
  authorId!: string;

  @Prop({ required: true })
  authorEmail!: string;

  @Prop({ required: true })
  createdAt!: Date;
}

// See DATA_MODEL.md "User" and SECURITY.md "Authentication & Sessions".
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email!: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({ type: [String], enum: USER_ROLES, default: ["customer"] })
  roles!: UserRole[];

  @Prop({ default: "en" })
  locale!: string;

  // Explicit `type:` on every nullable/union-typed field below — TypeScript
  // emits no usable design:type metadata for `Date | null` or string-literal
  // unions, and @nestjs/mongoose throws at class-decoration time without it.
  @Prop({ type: Date, default: null })
  emailVerifiedAt!: Date | null;

  @Prop({ type: String, default: "active", enum: ["active", "locked", "deleted"] })
  status!: "active" | "locked" | "deleted";

  @Prop({ default: 0 })
  failedLoginAttempts!: number;

  @Prop({ type: Date, default: null })
  lockedUntil!: Date | null;

  @Prop({ type: Date, default: null })
  lastLoginAt!: Date | null;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;

  @Prop({ type: [AdminNoteEntry], default: [] })
  adminNotes!: AdminNoteEntry[];
}

export const UserSchema = SchemaFactory.createForClass(User);
