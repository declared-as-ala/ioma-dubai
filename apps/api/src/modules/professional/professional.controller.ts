import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { ProfessionalService } from "./professional.service";
import { Roles } from "../../common/guards/auth.decorators";
import { RolesGuard } from "../../common/guards/roles.guard";
import { DocumentsService } from "../documents/documents.service";
import { Types } from "mongoose";
import { z } from "zod";
import {
  parseApplication,
  parseReview,
  validateApplicationFile,
} from "./application-validation";

@ApiTags("professional")
@UseGuards(JwtAuthGuard)
@Controller("professional")
export class ProfessionalController {
  constructor(
    private readonly professionalService: ProfessionalService,
    private readonly documentsService: DocumentsService,
  ) {}

  // --- Applicant endpoints ---

  @Patch("applications/:id/contact")
  async updateContact(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const parsed = z
      .object({
        contactPerson: z.string().trim().min(1).max(150),
        email: z.string().email(),
        phone: z.string().regex(/^\+?[\d\s()-]{7,20}$/),
      })
      .strict()
      .safeParse(body);
    if (!parsed.success) throw new BadRequestException("Invalid contact details.");
    return this.professionalService.updateContact(user.sub, id, parsed.data);
  }

  @Get("profile")
  profile(@CurrentUser() user: JwtPayload) {
    return this.professionalService.getProfileByUserId(user.sub);
  }

  @Get("applications/:id/documents/:documentId")
  async ownDocument(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Param("documentId") documentId: string,
  ) {
    const app = await this.professionalService.getApplication(user.sub, id);
    if (!app.documents.some((doc) => doc.documentId.toString() === documentId))
      throw new BadRequestException("Document does not belong to this application.");
    await this.documentsService.assertApplicationOwnership(documentId, id, user.sub);
    return {
      url: await this.documentsService.getSignedUrl(new Types.ObjectId(documentId)),
    };
  }

  @Get("applications")
  listMyApplications(@CurrentUser() user: JwtPayload) {
    return this.professionalService
      .listMyApplications(user.sub)
      .then((apps) => apps.map(publicApplication));
  }

  @Get("applications/:id")
  getApplication(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.professionalService.getApplication(user.sub, id).then(publicApplication);
  }

  @Post("applications/draft")
  getOrCreateDraft(@CurrentUser() user: JwtPayload) {
    return this.professionalService.getOrCreateDraft(user.sub).then(publicApplication);
  }

  @Post("applications/:id/submit")
  submitApplication(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: unknown,
  ) {
    return this.professionalService.submitApplication(
      user.sub,
      id,
      parseApplication(dto),
    );
  }

  @Post("applications/:id/documents")
  async addDocument(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const parsed = z
      .object({
        documentId: z.string().regex(/^[a-f0-9]{24}$/i),
        originalName: z.string().min(1).max(255),
        mimeType: z.string(),
      })
      .strict()
      .safeParse(body);
    if (!parsed.success) throw new BadRequestException("Invalid document.");
    await this.professionalService.getApplication(user.sub, id);
    await this.documentsService.assertApplicationOwnership(
      parsed.data.documentId,
      id,
      user.sub,
    );
    return this.professionalService.addDocument(user.sub, id, parsed.data);
  }

  @Post("applications/:id/upload")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: 10 * 1024 * 1024, files: 1 } }),
  )
  async uploadDocument(
    @CurrentUser() user: JwtPayload,
    @Param("id") applicationId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    validateApplicationFile(file);
    const application = await this.professionalService.getApplication(
      user.sub,
      applicationId,
    );
    if (!["draft", "documents_requested"].includes(application.status))
      throw new BadRequestException("Application is not editable.");
    const ext =
      {
        "application/pdf": ".pdf",
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
      }[file.mimetype] ?? ".bin";
    const doc = await this.documentsService.create({
      bucket: "ioma-private",
      data: file.buffer,
      mimeType: file.mimetype,
      ownerType: "professional_application",
      ownerId: new Types.ObjectId(applicationId),
      uploadedBy: new Types.ObjectId(user.sub),
      extension: ext,
    });

    try {
      await this.professionalService.addDocument(user.sub, applicationId, {
        documentId: doc._id,
        originalName: file.originalname.replace(/[\\/]/g, "_").slice(0, 255),
        mimeType: file.mimetype,
      });
    } catch (error) {
      await this.documentsService.remove(doc._id);
      throw error;
    }
    return { documentId: doc._id, originalName: file.originalname };
  }

  // --- Admin endpoints ---

  @Get("admin/profiles")
  @UseGuards(RolesGuard)
  @Roles("administrator", "super_administrator")
  listApprovedProfiles() {
    return this.professionalService.listApprovedProfiles();
  }

  @Get("admin/applications")
  @UseGuards(RolesGuard)
  @Roles("administrator", "super_administrator")
  listPendingApplications() {
    return this.professionalService.listPendingApplications();
  }

  @Get("admin/applications/:id/documents/:documentId")
  @UseGuards(RolesGuard)
  @Roles("administrator", "super_administrator")
  async documentUrl(@Param("id") id: string, @Param("documentId") documentId: string) {
    const app = await this.professionalService.getApplicationAdmin(id);
    if (!app.documents.some((doc) => doc.documentId.toString() === documentId))
      throw new BadRequestException("Document does not belong to this application.");
    return {
      url: await this.documentsService.getSignedUrl(new Types.ObjectId(documentId)),
    };
  }

  @Get("admin/applications/:id")
  @UseGuards(RolesGuard)
  @Roles("administrator", "super_administrator")
  getApplicationAdmin(@Param("id") id: string) {
    return this.professionalService.getApplicationAdmin(id);
  }

  @Patch("admin/applications/:id/approve")
  @UseGuards(RolesGuard)
  @Roles("administrator", "super_administrator")
  approveApplication(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: unknown,
  ) {
    return this.professionalService.approveApplication(user.sub, id, parseReview(dto));
  }

  @Patch("admin/applications/:id/reject")
  @UseGuards(RolesGuard)
  @Roles("administrator", "super_administrator")
  rejectApplication(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: unknown,
  ) {
    return this.professionalService.rejectApplication(
      user.sub,
      id,
      parseReview(dto, true)!,
    );
  }

  @Patch("admin/applications/:id/request-documents")
  @UseGuards(RolesGuard)
  @Roles("administrator", "super_administrator")
  requestDocuments(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: unknown,
  ) {
    return this.professionalService.requestDocuments(
      user.sub,
      id,
      parseReview(dto, true)!,
    );
  }

  @Patch("admin/profiles/:id/suspend")
  @UseGuards(RolesGuard)
  @Roles("administrator", "super_administrator")
  suspendProfile(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: unknown,
  ) {
    const result = z
      .object({ reason: z.string().trim().min(1).max(2000) })
      .strict()
      .safeParse(dto);
    if (!result.success) throw new BadRequestException("Suspension reason required.");
    return this.professionalService.suspendProfile(user.sub, id, result.data.reason);
  }
}

function publicApplication<
  T extends {
    reviewNotes?: unknown;
    reviewedBy?: unknown;
    statusHistory: { status: string; at: Date; note?: unknown }[];
  },
>(app: T) {
  return {
    ...app,
    reviewNotes: null,
    reviewedBy: null,
    statusHistory: app.statusHistory.map(({ status, at }) => ({
      status,
      at,
      note: null,
    })),
  };
}
