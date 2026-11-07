import {
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  ProfessionalApplication,
  ProfessionalApplicationDocument,
} from "./schemas/professional-application.schema";
import {
  ProfessionalProfile,
  ProfessionalProfileDocument,
} from "./schemas/professional-profile.schema";
import { UsersService } from "../users/users.service";

@Injectable()
export class ProfessionalService {
  constructor(
    @InjectModel(ProfessionalApplication.name)
    private readonly applicationModel: Model<ProfessionalApplicationDocument>,
    @InjectModel(ProfessionalProfile.name)
    private readonly profileModel: Model<ProfessionalProfileDocument>,
    private readonly usersService: UsersService,
  ) {}

  // --- Application lifecycle ---

  async updateContact(
    userId: string,
    id: string,
    contact: { contactPerson: string; email: string; phone: string },
  ) {
    await this.getApplication(userId, id);
    await this.applicationModel.updateOne(
      { _id: id, userId: new Types.ObjectId(userId) },
      { $set: contact },
    );
    return contact;
  }

  async getOrCreateDraft(userId: string) {
    const owner = new Types.ObjectId(userId);
    const existing = await this.applicationModel.findOne({
      userId: owner,
      status: { $ne: "rejected" },
    });
    if (existing) return existing.toObject();
    try {
      const app = await this.applicationModel.findOneAndUpdate(
        { userId: owner, status: "draft" },
        {
          $setOnInsert: {
            userId: owner,
            status: "draft",
            statusHistory: [{ status: "draft", at: new Date(), note: null }],
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      return app!.toObject();
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      const existing = await this.applicationModel.findOne({
        userId: owner,
        status: { $ne: "rejected" },
      });
      if (!existing) throw new ConflictException("Please retry your application.");
      return existing.toObject();
    }
  }

  async getApplication(userId: string, applicationId: string) {
    const app = await this.applicationModel.findById(applicationId);
    if (!app) throw new NotFoundException("Application not found.");
    if (app.userId.toString() !== userId) {
      throw new ForbiddenException("You do not have access to this application.");
    }
    return app.toObject();
  }

  async listMyApplications(userId: string) {
    return this.applicationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  async submitApplication(
    userId: string,
    applicationId: string,
    dto: SubmitApplicationDto,
  ) {
    const app = await this.applicationModel.findById(applicationId);
    if (!app) throw new NotFoundException("Application not found.");
    if (app.userId.toString() !== userId) {
      throw new ForbiddenException("You do not have access to this application.");
    }
    if (app.status !== "draft" && app.status !== "documents_requested") {
      throw new BadRequestException(
        "Only draft or documents-requested applications can be submitted.",
      );
    }

    if (!dto.termsAccepted) throw new BadRequestException("Terms must be accepted.");
    if (!app.documents.length)
      throw new BadRequestException("A trade licence document is required.");
    if (app.status === "documents_requested") {
      if (app.documents.length <= app.requestedDocumentsCount) {
        throw new BadRequestException(
          "Please upload the requested documents before resubmitting.",
        );
      }
    }
    const { termsAccepted: _terms, ...fields } = dto;
    const now = new Date();
    const updated = await this.applicationModel.findOneAndUpdate(
      { _id: app._id, userId: app.userId, status: app.status, __v: app.__v },
      {
        $set: { ...fields, status: "submitted", termsAcceptedAt: now, submittedAt: now },
        $push: { statusHistory: { status: "submitted", at: now, note: null } },
        $inc: { __v: 1 },
      },
      { new: true, runValidators: true },
    );
    if (!updated)
      throw new ConflictException(
        "Application changed. Reload its status before retrying.",
      );
    await this.usersService.addRole(userId, "professional_pending");
    return updated.toObject();
  }

  async addDocument(
    userId: string,
    applicationId: string,
    document: {
      documentId: string | Types.ObjectId;
      originalName: string;
      mimeType: string;
    },
  ) {
    const app = await this.applicationModel.findById(applicationId);
    if (!app) throw new NotFoundException("Application not found.");
    if (app.userId.toString() !== userId) {
      throw new ForbiddenException("You do not have access to this application.");
    }
    if (app.status !== "draft" && app.status !== "documents_requested") {
      throw new BadRequestException("Cannot add documents to this application.");
    }
    const entry = {
      documentId: new Types.ObjectId(document.documentId),
      originalName: document.originalName,
      mimeType: document.mimeType,
    };
    const updated = await this.applicationModel.findOneAndUpdate(
      {
        _id: app._id,
        userId: app.userId,
        status: { $in: ["draft", "documents_requested"] },
        "documents.documentId": { $ne: entry.documentId },
      },
      { $push: { documents: entry }, $inc: { __v: 1 } },
      { new: true },
    );
    if (!updated) throw new ConflictException("Application is no longer editable.");
    return updated.toObject();
  }

  // --- Admin review ---

  private async saveReview(app: ProfessionalApplicationDocument) {
    try {
      await app.save();
    } catch (error) {
      if (error instanceof Error && error.name === "VersionError") {
        throw new ConflictException("Application changed. Reload before reviewing it.");
      }
      throw error;
    }
  }

  async listPendingApplications() {
    return this.applicationModel
      .find({ status: { $in: ["submitted", "pending_review", "documents_requested"] } })
      .populate<{ userId: { email: string; firstName: string; lastName: string } }>(
        "userId",
        "email firstName lastName",
      )
      .sort({ createdAt: 1 })
      .lean();
  }

  async getApplicationAdmin(applicationId: string) {
    const app = await this.applicationModel
      .findById(applicationId)
      .populate<{ userId: { email: string; firstName: string; lastName: string } }>(
        "userId",
        "email firstName lastName",
      );
    if (!app) throw new NotFoundException("Application not found.");
    return app.toObject();
  }

  async approveApplication(adminId: string, applicationId: string, reviewNotes?: string) {
    const app = await this.applicationModel.findById(applicationId);
    if (!app) throw new NotFoundException("Application not found.");
    if (!["submitted", "pending_review", "documents_requested"].includes(app.status)) {
      throw new BadRequestException("Application is not in a reviewable state.");
    }

    app.status = "approved";
    app.reviewedBy = new Types.ObjectId(adminId);
    app.reviewNotes = reviewNotes ?? null;
    app.statusHistory.push({
      status: "approved",
      at: new Date(),
      note: reviewNotes ?? null,
    });
    await this.saveReview(app);

    // Update user roles
    await this.usersService.removeRole(app.userId.toString(), "professional_pending");
    await this.usersService.addRole(app.userId.toString(), "professional_approved");

    // Create professional profile
    const profile = await this.profileModel.create({
      userId: app.userId,
      applicationId: app._id,
      companyName: app.companyName,
      businessType: app.businessType,
      emirate: app.emirate,
      city: app.city,
      status: "approved",
    });

    return { application: app.toObject(), profile: profile.toObject() };
  }

  async rejectApplication(adminId: string, applicationId: string, reviewNotes: string) {
    const app = await this.applicationModel.findById(applicationId);
    if (!app) throw new NotFoundException("Application not found.");
    if (!["submitted", "pending_review", "documents_requested"].includes(app.status)) {
      throw new BadRequestException("Application is not in a reviewable state.");
    }

    app.status = "rejected";
    app.reviewedBy = new Types.ObjectId(adminId);
    app.reviewNotes = reviewNotes;
    app.applicantMessage = reviewNotes;
    app.statusHistory.push({ status: "rejected", at: new Date(), note: reviewNotes });
    await this.saveReview(app);

    await this.usersService.removeRole(app.userId.toString(), "professional_pending");

    return app.toObject();
  }

  async requestDocuments(adminId: string, applicationId: string, reviewNotes: string) {
    const app = await this.applicationModel.findById(applicationId);
    if (!app) throw new NotFoundException("Application not found.");
    if (!["submitted", "pending_review"].includes(app.status)) {
      throw new BadRequestException("Application is not in a reviewable state.");
    }

    app.status = "documents_requested";
    app.requestedDocumentsCount = app.documents.length;
    app.reviewedBy = new Types.ObjectId(adminId);
    app.reviewNotes = reviewNotes;
    app.applicantMessage = reviewNotes;
    app.statusHistory.push({
      status: "documents_requested",
      at: new Date(),
      note: reviewNotes,
    });
    await this.saveReview(app);

    return app.toObject();
  }

  async suspendProfile(_adminId: string, profileId: string, _reason: string) {
    const profile = await this.profileModel.findById(profileId);
    if (!profile) throw new NotFoundException("Professional profile not found.");

    profile.status = "suspended";
    await profile.save();
    await this.applicationModel.updateOne(
      { _id: profile.applicationId },
      {
        $set: {
          status: "suspended",
          reviewNotes: _reason,
          reviewedBy: new Types.ObjectId(_adminId),
        },
        $push: { statusHistory: { status: "suspended", at: new Date(), note: _reason } },
      },
    );

    await this.usersService.removeRole(
      profile.userId.toString(),
      "professional_approved",
    );
    await this.usersService.addRole(profile.userId.toString(), "professional_suspended");

    return profile.toObject();
  }

  // --- Profile lookups ---

  async getProfileByUserId(userId: string) {
    return this.profileModel.findOne({ userId: new Types.ObjectId(userId) }).lean();
  }

  async getProfileById(profileId: string) {
    return this.profileModel.findById(profileId).lean();
  }

  async listApprovedProfiles() {
    return this.profileModel.find({ status: "approved" }).lean();
  }
}

export interface SubmitApplicationDto {
  companyName: string;
  contactPerson: string;
  businessType: string;
  tradeLicenceNumber: string;
  vatNumber?: string;
  email: string;
  phone: string;
  address: string;
  emirate: string;
  city: string;
  website?: string;
  socialMedia?: string;
  locationsCount: number;
  expectedOrderVolume: string;
  message?: string;
  termsAccepted: boolean;
}
