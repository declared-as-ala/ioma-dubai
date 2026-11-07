import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { z } from "zod";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { Roles } from "../../common/guards/auth.decorators";
import { RolesGuard } from "../../common/guards/roles.guard";
import { ProAccessService } from "./pro-access.service";
import { validateApplicationFile } from "./application-validation";

const phone = z
  .string()
  .trim()
  .regex(/^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number.");
const contact = z
  .object({
    name: z.string().trim().max(120),
    phone: z.string().trim().max(40),
    email: z.union([z.literal(""), z.string().trim().email().max(160)]),
  })
  .strict();

// Exactly the five fields of the brief (+ the language of the page it was sent from and a
// honeypot that real visitors never fill in).
const leadSchema = z
  .object({
    firstName: z.string().trim().min(1).max(60),
    lastName: z.string().trim().min(1).max(60),
    companyName: z.string().trim().min(2).max(120),
    businessType: z.string().trim().max(60).optional(),
    emirate: z.string().trim().max(60).optional(),
    city: z.string().trim().max(60).optional(),
    address: z.string().trim().max(200).optional(),
    tradeLicenceNumber: z.string().trim().max(80).optional(),
    website: z.string().trim().max(200).optional(),
    message: z.string().trim().max(2000).optional(),
    phone,
    email: z.string().trim().email().max(160),
    locale: z.enum(["en", "ar"]).default("en"),
    hp: z.string().max(200).optional(),
  })
  .strict();

const parse = <T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> => {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new BadRequestException({
      message: "Invalid request.",
      fields: result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
  }
  return result.data;
};

@ApiTags("professional")
@Controller("professional")
export class ProAccessController {
  constructor(private readonly access: ProAccessService) {}

  // ---------------------------------------------------------------- public

  @Post("leads")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body() body: unknown) {
    const { hp, ...input } = parse(leadSchema, body);
    // Honeypot filled: pretend it worked, store nothing.
    if (hp) return { received: true };
    return this.access.createLead(input);
  }

  // ---------------------------------------------------------------- signed-in professional

  @Get("me/access")
  @UseGuards(JwtAuthGuard)
  myAccess(@CurrentUser() user: JwtPayload) {
    return this.access.getAccess(user.sub, user.roles);
  }

  // ---------------------------------------------------------------- admin back office

  @Get("admin/leads")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("administrator", "super_administrator")
  listLeads(@Query("status") status?: string) {
    const parsed = z
      .enum(["pending", "validated", "customer", "rejected"])
      .optional()
      .safeParse(status);
    if (!parsed.success) throw new BadRequestException("Unknown status.");
    return this.access.listLeads(parsed.data);
  }

  @Get("admin/leads/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("administrator", "super_administrator")
  getLead(@Param("id") id: string) {
    return this.access.getLead(id);
  }

  @Patch("admin/leads/:id/notes")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("administrator", "super_administrator")
  notes(@Param("id") id: string, @Body() body: unknown) {
    const { notes } = parse(z.object({ notes: z.string().max(4000) }).strict(), body);
    return this.access.updateLeadNotes(id, notes);
  }

  @Post("admin/leads/:id/documents")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("administrator", "super_administrator")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: 10 * 1024 * 1024, files: 1 } }),
  )
  attach(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body("kind") kind: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    validateApplicationFile(file);
    const parsedKind = z.enum(["trade_license", "trn", "other"]).safeParse(kind);
    if (!parsedKind.success) throw new BadRequestException("Choose a document type.");
    return this.access.attachLeadDocument(user.sub, id, parsedKind.data, file);
  }

  @Get("admin/leads/:id/documents/:documentId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("administrator", "super_administrator")
  leadDocument(@Param("id") id: string, @Param("documentId") documentId: string) {
    return this.access.leadDocumentUrl(id, documentId);
  }

  @Patch("admin/leads/:id/validate")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("administrator", "super_administrator")
  validate(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.access.validateLead(user.sub, id);
  }

  @Patch("admin/leads/:id/reject")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("administrator", "super_administrator")
  reject(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const { reason } = parse(
      z.object({ reason: z.string().trim().min(3).max(1000) }).strict(),
      body,
    );
    return this.access.rejectLead(user.sub, id, reason);
  }

  @Patch("admin/profiles/:id/contact")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("administrator", "super_administrator")
  profileContact(@Param("id") id: string, @Body() body: unknown) {
    return this.access.setProfileContact(id, parse(contact, body));
  }

  @Get("admin/b2b-settings")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("administrator", "super_administrator")
  settings() {
    return this.access.getSettings();
  }

  @Patch("admin/b2b-settings")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("administrator", "super_administrator")
  updateSettings(@Body() body: unknown) {
    const input = parse(
      z
        .object({
          minFirstOrderAed: z.number().min(0).max(1_000_000).optional(),
          unlockOn: z.enum(["confirmed", "paid"]).optional(),
          validMonths: z.number().int().min(1).max(60).nullable().optional(),
          teamEmail: z.union([z.literal(""), z.string().trim().email()]).optional(),
          teamContact: contact.optional(),
          defaultAccountContact: contact.optional(),
        })
        .strict(),
      body,
    );
    return this.access.updateSettings(input);
  }
}
