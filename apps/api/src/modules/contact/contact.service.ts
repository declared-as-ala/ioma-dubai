import { createHash } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ContactMessage, ContactMessageDocument } from "./schemas/contact-message.schema";
import type { CreateContactMessageDto } from "./dto/create-contact-message.dto";
import { MailService } from "../../common/mail/mail.service";
import { buildContactEmail } from "./contact-email";

const DUPLICATE_WINDOW_MS = 10 * 60_000;

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);
  /** Recent submissions (hash -> time): a double click or a client retry must not mail the team twice. */
  private readonly recent = new Map<string, number>();

  constructor(
    @InjectModel(ContactMessage.name)
    private readonly contactMessageModel: Model<ContactMessageDocument>,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  private isDuplicate(dto: CreateContactMessageDto): boolean {
    const now = Date.now();
    for (const [k, t] of this.recent)
      if (now - t > DUPLICATE_WINDOW_MS) this.recent.delete(k);
    const key = createHash("sha256")
      .update([dto.email.toLowerCase(), dto.subject, dto.message].join("\u0000"))
      .digest("hex");
    if (this.recent.has(key)) return true;
    this.recent.set(key, now);
    return false;
  }

  async create(dto: CreateContactMessageDto) {
    // Honeypot: a filled hidden field means a bot. Answer exactly like a success so it learns nothing, store nothing.
    if (dto.website && dto.website.trim() !== "") {
      this.logger.warn("Contact form honeypot triggered; submission discarded");
      return { id: "discarded", receivedAt: new Date() };
    }

    // Same message sent again within minutes: answer like a success, store and mail nothing more.
    if (this.isDuplicate(dto)) {
      this.logger.warn("Duplicate contact submission ignored");
      return { id: "duplicate", receivedAt: new Date() };
    }

    const { website: _ignored, ...data } = dto;
    const message = new this.contactMessageModel({
      ...data,
      phone: data.phone || undefined,
    });
    await message.save();

    // Team notification: best effort. The message is already stored, so a mail failure never loses it or fails the request.
    // From = the verified IOMA contact mailbox (never the customer); Reply-To = the customer.
    const to =
      this.config.get<string>("CONTACT_EMAIL") ??
      this.config.get<string>("CONTACT_NOTIFY_EMAIL");
    if (to) {
      const { subject, html } = buildContactEmail({
        ...data,
        phone: data.phone || undefined,
      });
      void this.mail.sendHtml(to, subject, html, {
        identity: "contact",
        replyTo: data.email,
      });
    }

    return { id: message.id, receivedAt: message.get("createdAt") as Date };
  }
}
