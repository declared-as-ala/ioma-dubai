import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { z } from "zod";
import { AuditService } from "../audit/audit.service";
import { ProAccessService } from "../professional/pro-access.service";
import { ProContentService } from "./pro-content.service";

type Row = Record<string, any>;

const text = z.string().trim().max(4000);
const local = z.object({ en: text, fr: text.optional(), ar: text }).strict();
const optLocal = z
  .object({ en: text.optional(), fr: text.optional(), ar: text.optional() })
  .strict();
const url = z
  .string()
  .max(2048)
  .refine(
    (v) => !v || /^https?:\/\//i.test(v) || (v.startsWith("/") && !v.startsWith("//")),
    "Use an HTTP(S) or local URL.",
  );
const cta = z.object({ label: optLocal, href: url }).strict();

export const SECTION_KEYS = [
  "orders",
  "featuredProducts",
  "training",
  "documents",
  "benefits",
  "contact",
] as const;

/** Everything an admin can edit about the IOMA PRO home. Replaces hardcoded banners and promo text. */
export const portalContentSchema = z
  .object({
    hero: z
      .object({
        image: url.optional(),
        headline: optLocal.optional(),
        body: optLocal.optional(),
        primaryCta: cta.nullable().optional(),
        secondaryCta: cta.nullable().optional(),
      })
      .strict()
      .optional(),
    announcements: z
      .array(
        z
          .object({
            id: z.string().min(1).max(40),
            title: local,
            body: optLocal.optional(),
            active: z.boolean(),
            startsAt: z.string().datetime({ offset: true }).nullable().optional(),
            endsAt: z.string().datetime({ offset: true }).nullable().optional(),
          })
          .strict(),
      )
      .max(20)
      .optional(),
    sections: z
      .array(z.object({ key: z.enum(SECTION_KEYS), visible: z.boolean() }).strict())
      .max(SECTION_KEYS.length)
      .optional(),
    featuredProductSlugs: z.array(z.string().min(1).max(120)).max(12).optional(),
    featuredVideoIds: z
      .array(z.string().regex(/^[a-f\d]{24}$/i))
      .max(6)
      .optional(),
    commerce: z
      .object({
        deliveryInfo: optLocal.optional(),
        orderTerms: optLocal.optional(),
        minimumOrderNote: optLocal.optional(),
      })
      .strict()
      .optional(),
    contact: z
      .object({
        phone: z.string().trim().max(40).optional(),
        email: z.union([z.literal(""), z.string().trim().email()]).optional(),
        supportEmail: z.union([z.literal(""), z.string().trim().email()]).optional(),
        hours: optLocal.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

const DEFAULT_SECTIONS = SECTION_KEYS.map((key) => ({ key, visible: true }));

@Injectable()
export class PortalContentService {
  constructor(
    @InjectConnection() private readonly db: Connection,
    private readonly access: ProAccessService,
    private readonly content: ProContentService,
    private readonly audit: AuditService,
  ) {}

  private col() {
    return this.db.collection("portalcontent");
  }

  private async doc(): Promise<Row> {
    return (
      ((await this.col().findOne({ key: "portal" })) as Row | null) ?? { key: "portal" }
    );
  }

  /** Complete document with defaults filled in, for the admin editor. */
  async getAdmin() {
    const d = await this.doc();
    const sections = [
      ...((d.sections as Row[] | undefined) ?? []).filter((s) =>
        (SECTION_KEYS as readonly string[]).includes(s.key),
      ),
    ];
    for (const s of DEFAULT_SECTIONS)
      if (!sections.some((x) => x.key === s.key)) sections.push(s);
    return {
      hero: d.hero ?? {},
      announcements: d.announcements ?? [],
      sections,
      featuredProductSlugs: d.featuredProductSlugs ?? [],
      featuredVideoIds: d.featuredVideoIds ?? [],
      commerce: d.commerce ?? {},
      contact: d.contact ?? {},
      updatedAt: d.updatedAt ?? null,
    };
  }

  async update(actor: { sub: string; email: string }, body: unknown) {
    const r = portalContentSchema.safeParse(body);
    if (!r.success)
      throw new BadRequestException({
        message: "Invalid portal content.",
        fields: r.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      });
    if (!Object.keys(r.data).length) throw new BadRequestException("Nothing to save.");
    await this.col().updateOne(
      { key: "portal" },
      { $set: { ...r.data, updatedAt: new Date() }, $setOnInsert: { key: "portal" } },
      { upsert: true },
    );
    await this.audit.recordEvent({
      actorId: actor.sub,
      actorEmail: actor.email,
      action: "admin.portal-content.updated",
      resource: "portal-content",
      resourceId: "portal",
      details: { fields: Object.keys(r.data) },
    });
    return this.getAdmin();
  }

  /**
   * Portal home for an approved professional: the admin-controlled content plus live data
   * (videos, documents, benefits). Locked content keeps the server-side locking of
   * ProContentService, so nothing locked leaks through the home.
   */
  async home(userId: string, roles: string[]) {
    await this.access.assertLevel(userId, roles, "validated");
    const d = await this.getAdmin();
    const now = Date.now();
    const announcements = (d.announcements as Row[]).filter(
      (a) =>
        a.active &&
        (!a.startsAt || new Date(a.startsAt).getTime() <= now) &&
        (!a.endsAt || new Date(a.endsAt).getTime() >= now),
    );
    const [videos, documents, benefits] = await Promise.all([
      this.content.videos(userId, roles),
      this.content.documentsList(userId, roles),
      this.content.benefits(userId, roles),
    ]);
    const featured = (d.featuredVideoIds as string[]).length
      ? videos.filter((v) => (d.featuredVideoIds as string[]).includes(v.id))
      : videos.filter((v) => v.featured).slice(0, 3);
    return {
      hero: d.hero,
      announcements,
      sections: d.sections,
      featuredProductSlugs: d.featuredProductSlugs,
      commerce: d.commerce,
      contact: d.contact,
      training: (featured.length ? featured : videos).slice(0, 3),
      documents: documents.slice(0, 4),
      benefits: benefits.items.slice(0, 4),
      benefitsUnlocked: benefits.unlocked,
    };
  }
}
