import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ContactMessage, ContactMessageDocument } from "./schemas/contact-message.schema";
import type { CreateContactMessageDto } from "./dto/create-contact-message.dto";
import { MailService } from "../../common/mail/mail.service";

const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @InjectModel(ContactMessage.name)
    private readonly contactMessageModel: Model<ContactMessageDocument>,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreateContactMessageDto) {
    // Honeypot: a filled hidden field means a bot. Answer exactly like a success so it learns nothing, store nothing.
    if (dto.website && dto.website.trim() !== "") {
      this.logger.warn("Contact form honeypot triggered; submission discarded");
      return { id: "discarded", receivedAt: new Date() };
    }

    const { website: _ignored, ...data } = dto;
    const message = new this.contactMessageModel(data);
    await message.save();

    // Staff notification: best effort. The message is already stored, so a mail failure never loses it or fails the request.
    const to = this.config.get<string>("CONTACT_NOTIFY_EMAIL");
    if (to) {
      const subject = `[IOMA contact] ${data.category ?? "other"}: ${data.subject}`;
      const html = `<p><strong>${escapeHtml(data.name)}</strong> &lt;${escapeHtml(data.email)}&gt; (${escapeHtml(data.locale)})</p>
<p>Category: ${escapeHtml(data.category ?? "other")}${data.orderReference ? ` &middot; Order: ${escapeHtml(data.orderReference)}` : ""}</p>
<p>${escapeHtml(data.message).replace(/\n/g, "<br>")}</p>`;
      void this.mail.sendHtml(to, subject, html);
    }

    return { id: message.id, receivedAt: message.get("createdAt") as Date };
  }
}
