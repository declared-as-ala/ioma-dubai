import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ContactMessageDocument = HydratedDocument<ContactMessage>;

// See DATA_MODEL.md conventions. No EmailProvider adapter exists yet (see
// ARCHITECTURE.md "Provider Abstractions") — messages are durably stored so
// nothing submitted by a visitor is lost, and become visible to staff once
// the Sprint 10 admin panel exists. Sending a real notification email is a
// drop-in addition to `ContactService.create` once that adapter lands.
@Schema({ timestamps: true })
export class ContactMessage {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, lowercase: true, trim: true, index: true })
  email!: string;

  @Prop({ required: true, trim: true })
  subject!: string;

  @Prop({ required: true, trim: true })
  message!: string;

  @Prop({ required: true })
  locale!: string;

  @Prop({ type: String, enum: ["order", "return", "product", "account", "pro", "other"] })
  category?: string;

  @Prop({ type: String, trim: true, maxlength: 40 })
  orderReference?: string;

  @Prop({ type: String, default: "new", enum: ["new", "read", "archived"] })
  status!: "new" | "read" | "archived";
}

export const ContactMessageSchema = SchemaFactory.createForClass(ContactMessage);
