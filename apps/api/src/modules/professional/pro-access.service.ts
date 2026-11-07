import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model, Types } from "mongoose";
import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import { adminPermissions } from "@ioma/config";
import { MailService } from "../../common/mail/mail.service";
import { AuthService } from "../auth/auth.service";
import { UsersService } from "../users/users.service";
import { DocumentsService } from "../documents/documents.service";
import {
  ProfessionalApplication,
  ProfessionalApplicationDocument,
} from "./schemas/professional-application.schema";
import {
  ProfessionalProfile,
  ProfessionalProfileDocument,
} from "./schemas/professional-profile.schema";
import {
  LeadDocumentKind,
  LeadStatus,
  ProfessionalLead,
  ProfessionalLeadDocument,
} from "./schemas/professional-lead.schema";
import { B2bSettings, B2bSettingsDocument } from "./schemas/b2b-settings.schema";
import {
  AccessLevel,
  AccessRule,
  DEFAULT_RULE,
  OrderFacts,
  atLeast,
  computeAccess,
} from "./pro-access.rules";
import * as emails from "./pro-emails";

export interface LeadInput {
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
  email: string;
  locale: "en" | "ar";
  businessType?: string | null;
  emirate?: string | null;
  city?: string | null;
  address?: string | null;
  tradeLicenceNumber?: string | null;
  website?: string | null;
  message?: string | null;
}

export interface ContactInfo {
  name: string;
  phone: string;
  email: string;
}

export interface AccessSummary {
  level: AccessLevel;
  companyName: string | null;
  firstName: string | null;
  firstOrderAt: Date | null;
  benefitsUntil: Date | null;
  rule: {
    minFirstOrderAed: number;
    unlockOn: "confirmed" | "paid";
    validMonths: number | null;
  };
  /** "Need help?" box: validated accounts and customers. */
  teamContact: ContactInfo | null;
  /** Personal IOMA contact: customers only. */
  accountContact: ContactInfo | null;
}

const blankContact = (): ContactInfo => ({ name: "", phone: "", email: "" });
const hasContact = (c?: Partial<ContactInfo> | null) =>
  !!c && !!(c.name || c.phone || c.email);

@Injectable()
export class ProAccessService {
  constructor(
    @InjectModel(ProfessionalLead.name)
    private readonly leadModel: Model<ProfessionalLeadDocument>,
    @InjectModel(ProfessionalProfile.name)
    private readonly profileModel: Model<ProfessionalProfileDocument>,
    @InjectModel(ProfessionalApplication.name)
    private readonly applicationModel: Model<ProfessionalApplicationDocument>,
    @InjectModel(B2bSettings.name)
    private readonly settingsModel: Model<B2bSettingsDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly users: UsersService,
    private readonly auth: AuthService,
    private readonly mail: MailService,
    private readonly documents: DocumentsService,
    private readonly config: ConfigService,
  ) {}

  // ------------------------------------------------------------------ settings

  async getSettings() {
    return this.settingsModel
      .findOneAndUpdate(
        { key: "b2b" },
        { $setOnInsert: { key: "b2b" } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .lean();
  }

  async updateSettings(input: {
    minFirstOrderAed?: number;
    unlockOn?: "confirmed" | "paid";
    validMonths?: number | null;
    teamEmail?: string;
    teamContact?: ContactInfo;
    defaultAccountContact?: ContactInfo;
  }) {
    const set: Record<string, unknown> = {};
    if (input.minFirstOrderAed !== undefined)
      set.minFirstOrderMinor = Math.round(input.minFirstOrderAed * 100);
    if (input.unlockOn) set.unlockOn = input.unlockOn;
    if (input.validMonths !== undefined) set.validMonths = input.validMonths;
    if (input.teamEmail !== undefined) set.teamEmail = input.teamEmail;
    if (input.teamContact) set.teamContact = input.teamContact;
    if (input.defaultAccountContact)
      set.defaultAccountContact = input.defaultAccountContact;
    await this.settingsModel.updateOne({ key: "b2b" }, { $set: set }, { upsert: true });
    return this.getSettings();
  }

  private ruleFrom(settings: {
    minFirstOrderMinor?: number;
    unlockOn?: "confirmed" | "paid";
    validMonths?: number | null;
  }): AccessRule {
    return {
      minFirstOrderMinor: settings.minFirstOrderMinor ?? DEFAULT_RULE.minFirstOrderMinor,
      unlockOn: settings.unlockOn ?? DEFAULT_RULE.unlockOn,
      validMonths: settings.validMonths ?? DEFAULT_RULE.validMonths,
    };
  }

  // ------------------------------------------------------------------ leads (public)

  async createLead(input: LeadInput) {
    const email = input.email.toLowerCase().trim();
    // Idempotent: an open request for the same email is not duplicated, and the response
    // never reveals whether the address is already known.
    const open = await this.leadModel.findOne({
      email,
      status: { $in: ["pending", "validated", "customer"] },
    });
    if (open) return { received: true };

    const lead = await this.leadModel.create({
      ...input,
      email,
      history: [
        { status: "pending", at: new Date(), note: "Registered on the B2B page" },
      ],
    });

    const settings = await this.getSettings();
    const team =
      settings.teamEmail ||
      this.config.get<string>("B2B_TEAM_EMAIL") ||
      this.config.get<string>("EMAIL_FROM");
    const adminUrl = `${this.config.get<string>("ADMIN_APP_URL") ?? ""}/en/admin/b2b-leads`;
    if (team) {
      const mail = emails.teamNotification(lead, adminUrl);
      void this.mail.sendHtml(team, mail.subject, mail.html);
    }
    const confirmation = emails.leadConfirmation(input.locale, input.firstName);
    void this.mail.sendHtml(email, confirmation.subject, confirmation.html);
    return { received: true };
  }

  // ------------------------------------------------------------------ leads (admin)

  async listLeads(status?: LeadStatus) {
    const filter = status ? { status } : {};
    const [items, counts] = await Promise.all([
      this.leadModel.find(filter).sort({ createdAt: -1 }).limit(500).lean(),
      this.leadModel.aggregate<{ _id: LeadStatus; count: number }>([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);
    const byStatus = Object.fromEntries(counts.map((c) => [c._id, c.count]));
    return { items, counts: byStatus };
  }

  async getLead(id: string) {
    const lead = await this.leadModel.findById(id).lean();
    if (!lead) throw new NotFoundException("Lead not found.");
    return lead;
  }

  async updateLeadNotes(id: string, notes: string) {
    const lead = await this.leadModel
      .findByIdAndUpdate(id, { $set: { notes } }, { new: true })
      .lean();
    if (!lead) throw new NotFoundException("Lead not found.");
    return lead;
  }

  async attachLeadDocument(
    adminId: string,
    id: string,
    kind: LeadDocumentKind,
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    const lead = await this.leadModel.findById(id);
    if (!lead) throw new NotFoundException("Lead not found.");
    if (lead.status === "rejected")
      throw new BadRequestException("This lead was rejected.");
    const ext =
      (
        {
          "application/pdf": ".pdf",
          "image/jpeg": ".jpg",
          "image/png": ".png",
          "image/webp": ".webp",
        } as Record<string, string>
      )[file.mimetype] ?? ".bin";
    const doc = await this.documents.create({
      bucket: "ioma-private",
      data: file.buffer,
      mimeType: file.mimetype,
      ownerType: "professional_lead",
      ownerId: lead._id,
      uploadedBy: new Types.ObjectId(adminId),
      extension: ext,
    });
    lead.documents.push({
      documentId: doc._id,
      kind,
      originalName: file.originalname.replace(/[\\/]/g, "_").slice(0, 255),
      mimeType: file.mimetype,
      addedAt: new Date(),
    });
    await lead.save();
    return lead.toObject();
  }

  async leadDocumentUrl(id: string, documentId: string) {
    const lead = await this.leadModel.findById(id).lean();
    if (!lead || !lead.documents.some((d) => d.documentId.toString() === documentId))
      throw new NotFoundException("Document not found.");
    return { url: await this.documents.getSignedUrl(new Types.ObjectId(documentId)) };
  }

  /** Validate a lead: creates the login if needed, opens trade prices and ordering. */
  async validateLead(adminId: string, id: string) {
    const lead = await this.leadModel.findById(id);
    if (!lead) throw new NotFoundException("Lead not found.");
    if (lead.status !== "pending")
      throw new BadRequestException("Only pending leads can be validated.");
    if (!lead.documents.some((d) => d.kind === "trade_license"))
      throw new BadRequestException(
        "Attach the Trade License before validating this account.",
      );

    let user = await this.users.findByEmail(lead.email);
    const isNewUser = !user;
    if (!user) {
      user = await this.users.create({
        email: lead.email,
        // Unusable random password: the professional sets their own through the emailed link.
        passwordHash: await argon2.hash(randomBytes(32).toString("hex"), {
          type: argon2.argon2id,
        }),
        firstName: lead.firstName,
        lastName: lead.lastName,
        locale: lead.locale,
      });
    }
    const userId = user.id as string;

    const now = new Date();
    const application = await this.applicationModel.create({
      userId: new Types.ObjectId(userId),
      status: "approved",
      companyName: lead.companyName,
      contactPerson: `${lead.firstName} ${lead.lastName}`.trim(),
      email: lead.email,
      phone: lead.phone,
      documents: lead.documents.map((d) => ({
        documentId: d.documentId,
        originalName: d.originalName,
        mimeType: d.mimeType,
      })),
      reviewedBy: new Types.ObjectId(adminId),
      submittedAt: lead.createdAt ?? now,
      statusHistory: [
        { status: "submitted", at: lead.createdAt ?? now, note: "Trade access lead" },
        {
          status: "approved",
          at: now,
          note: "Validated by IOMA after a call and document check",
        },
      ],
    });
    const profile = await this.profileModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        $set: { status: "approved", companyName: lead.companyName },
        $setOnInsert: {
          userId: new Types.ObjectId(userId),
          applicationId: application._id,
          accessLevel: "validated",
        },
      },
      { upsert: true, new: true },
    );
    await this.users.removeRole(userId, "professional_pending");
    await this.users.addRole(userId, "professional_approved");

    lead.status = "validated";
    lead.userId = new Types.ObjectId(userId);
    lead.profileId = profile!._id;
    lead.reviewedBy = new Types.ObjectId(adminId);
    lead.history.push({
      status: "validated",
      at: now,
      note: null,
      by: new Types.ObjectId(adminId),
    });
    await lead.save();

    const locale = lead.locale === "ar" ? "ar" : "en";
    const adminBase = this.config.get<string>("APP_URL") ?? "";
    if (isNewUser) {
      const { url } = await this.auth.createPasswordSetupLink(userId, locale, 72);
      const mail = emails.validationInvite(locale, lead.firstName, url, 72);
      void this.mail.sendHtml(lead.email, mail.subject, mail.html);
    } else {
      const mail = emails.validationNotice(
        locale,
        lead.firstName,
        `${adminBase}/${locale}/portal`,
      );
      void this.mail.sendHtml(lead.email, mail.subject, mail.html);
    }
    return lead.toObject();
  }

  async rejectLead(adminId: string, id: string, reason: string) {
    const lead = await this.leadModel.findById(id);
    if (!lead) throw new NotFoundException("Lead not found.");
    if (lead.status !== "pending")
      throw new BadRequestException("Only pending leads can be rejected.");
    lead.status = "rejected";
    lead.rejectionReason = reason;
    lead.reviewedBy = new Types.ObjectId(adminId);
    lead.history.push({
      status: "rejected",
      at: new Date(),
      note: reason,
      by: new Types.ObjectId(adminId),
    });
    await lead.save();
    return lead.toObject();
  }

  async setProfileContact(profileId: string, contact: ContactInfo) {
    const profile = await this.profileModel
      .findByIdAndUpdate(profileId, { $set: { contact } }, { new: true })
      .lean();
    if (!profile) throw new NotFoundException("Professional profile not found.");
    return profile;
  }

  // ------------------------------------------------------------------ access level

  private isStaff(roles: string[]) {
    return adminPermissions(roles).length > 0;
  }

  /** Orders of this account that could count toward the first-order rule. */
  private async loadOrders(userId: string): Promise<OrderFacts[]> {
    const rows = await this.connection
      .collection("orders")
      .find(
        { userId: new Types.ObjectId(userId), type: "b2b" },
        {
          projection: {
            totalMinor: 1,
            paymentStatus: 1,
            fulfillmentStatus: 1,
            createdAt: 1,
          },
        },
      )
      .toArray();
    return rows.map((r) => ({
      _id: r._id,
      totalMinor: Number(r.totalMinor ?? 0),
      paymentStatus: String(r.paymentStatus ?? ""),
      fulfillmentStatus: String(r.fulfillmentStatus ?? ""),
      createdAt: r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt),
    }));
  }

  async getAccess(userId: string, roles: string[]): Promise<AccessSummary> {
    const [settings, profile, user] = await Promise.all([
      this.getSettings(),
      this.profileModel.findOne({ userId: new Types.ObjectId(userId) }),
      this.users.findById(userId),
    ]);
    const rule = this.ruleFrom(settings);
    const staff = this.isStaff(roles);
    const hasActiveProfile = !!profile && profile.status === "approved";
    const orders = hasActiveProfile ? await this.loadOrders(userId) : [];
    const result = computeAccess({ hasActiveProfile, isStaff: staff, orders, rule });

    // Keep the stored state in step with the derived one (reporting + admin lead list).
    if (profile && hasActiveProfile && !staff) {
      const stored = profile.accessLevel;
      if (result.level === "customer" && stored !== "customer") {
        profile.accessLevel = "customer";
        profile.firstOrderAt = result.firstOrder?.createdAt ?? null;
        profile.firstOrderId = (result.firstOrder?._id as Types.ObjectId) ?? null;
        await profile.save();
        await this.leadModel.updateOne(
          { profileId: profile._id, status: "validated" },
          {
            $set: { status: "customer" },
            $push: {
              history: {
                status: "customer",
                at: new Date(),
                note: "First order confirmed",
                by: null,
              },
            },
          },
        );
      } else if (result.level === "validated" && stored === "customer") {
        profile.accessLevel = "validated";
        await profile.save();
        await this.leadModel.updateOne(
          { profileId: profile._id, status: "customer" },
          {
            $set: { status: "validated" },
            $push: {
              history: {
                status: "validated",
                at: new Date(),
                note: "No qualifying order any more",
                by: null,
              },
            },
          },
        );
      }
    }

    const teamContact =
      result.level === "visitor" ? null : this.cleanContact(settings.teamContact);
    const own = profile?.contact;
    const accountContact =
      result.level === "customer"
        ? hasContact(own)
          ? this.cleanContact(own)
          : this.cleanContact(settings.defaultAccountContact)
        : null;
    return {
      level: result.level,
      companyName: profile?.companyName ?? null,
      firstName: user?.firstName ?? null,
      firstOrderAt: result.firstOrder?.createdAt ?? null,
      benefitsUntil: result.benefitsUntil,
      rule: {
        minFirstOrderAed: rule.minFirstOrderMinor / 100,
        unlockOn: rule.unlockOn,
        validMonths: rule.validMonths,
      },
      teamContact,
      accountContact,
    };
  }

  private cleanContact(c?: Partial<ContactInfo> | null): ContactInfo | null {
    if (!hasContact(c)) return null;
    return { ...blankContact(), ...(c as ContactInfo) };
  }

  async assertLevel(
    userId: string,
    roles: string[],
    need: AccessLevel,
  ): Promise<AccessSummary> {
    const access = await this.getAccess(userId, roles);
    if (!atLeast(access.level, need)) {
      throw new ForbiddenException(
        need === "customer"
          ? "This content unlocks with your first order."
          : "Trade access requires a validated professional account.",
      );
    }
    return access;
  }
}
