import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import { AuditService } from "../audit/audit.service";

type Row = Record<string, any>;

/** Fields that have an Arabic version. Ingredient lists (INCI) are technical references and are never translated. */
export const AR_FIELDS = [
  "name",
  "accroche",
  "shortBenefit",
  "description",
  "details",
  "texture",
  "results",
  "howToUse",
] as const;
export type ArField = (typeof AR_FIELDS)[number];

const text = (v: unknown) => (typeof v === "string" ? v : "");

/** Languages that go through human review. Drafts live in `arDraft` / `enDraft`, apart from the live text. */
export type ReviewLang = "ar" | "en";
const draftKey = (lang: ReviewLang) => (lang === "en" ? "enDraft" : "arDraft");
export const toLang = (v: unknown): ReviewLang => (v === "en" ? "en" : "ar");

/**
 * Arabic translations are proposed as drafts (`arDraft`), kept apart from the live content, and only
 * written to the product (`<field>.ar`) when an administrator approves them, optionally after editing.
 * The live Arabic text is never changed by a draft.
 */
@Injectable()
export class TranslationReviewService {
  constructor(
    @InjectConnection() private readonly db: Connection,
    private readonly audit: AuditService,
  ) {}

  private oid(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException("Product not found.");
    return new Types.ObjectId(id);
  }

  /** Queue: one row per product that has a draft, plus coverage of live Arabic content. */
  async queue() {
    const products = (await this.db
      .collection("products")
      .find(
        { deletedAt: null },
        { projection: { slug: 1, name: 1, visibility: 1, arDraft: 1 } },
      )
      .toArray()) as Row[];
    const draft = products.filter((p) => p.arDraft);
    return {
      total: products.length,
      pending: draft.filter((p) => p.arDraft.status === "draft").length,
      approved: draft.filter((p) => p.arDraft.status === "approved").length,
      rejected: draft.filter((p) => p.arDraft.status === "rejected").length,
      identicalToEnglish: products.filter(
        (p) =>
          text(p.name?.ar).trim() !== "" &&
          text(p.name?.ar).trim() === text(p.name?.en).trim(),
      ).length,
      items: draft
        .filter((p) => p.arDraft.status === "draft")
        .map((p) => ({
          id: String(p._id),
          slug: p.slug,
          name: text(p.name?.en),
          visibility: p.visibility,
          draftedAt: p.arDraft.draftedAt ?? null,
        })),
    };
  }

  async get(productId: string, langIn: unknown = "ar") {
    const lang = toLang(langIn);
    const key = draftKey(lang);
    const p = (await this.db
      .collection("products")
      .findOne({ _id: this.oid(productId) })) as Row | null;
    if (!p) throw new NotFoundException("Product not found.");
    const draft = p[key] as Row | undefined;
    return {
      id: String(p._id),
      lang,
      status: (draft?.status as string | undefined) ?? "none",
      source: (draft?.source as string | undefined) ?? null,
      draftedAt: draft?.draftedAt ?? null,
      reviewedBy: draft?.reviewedBy ?? null,
      fields: AR_FIELDS.map((f) => ({
        field: f,
        en: text(p[f]?.en),
        fr: text(p[f]?.fr),
        liveAr: text(p[f]?.[lang]),
        draftAr: text(draft?.fields?.[f]),
      })).filter((r) => r.en || r.fr || r.liveAr || r.draftAr),
    };
  }

  /** Applies the reviewed text (the admin may have edited it) to the live product. */
  async approve(
    actor: { sub: string; email: string },
    productId: string,
    final: Partial<Record<ArField, string>>,
    langIn: unknown = "ar",
  ) {
    const lang = toLang(langIn);
    const key = draftKey(lang);
    const _id = this.oid(productId);
    const p = (await this.db.collection("products").findOne({ _id })) as Row | null;
    if (!p) throw new NotFoundException("Product not found.");
    if (!p[key] || p[key].status !== "draft")
      throw new BadRequestException("There is no pending draft for this product.");
    const set: Row = { updatedAt: new Date() };
    const applied: string[] = [];
    for (const [field, value] of Object.entries(final)) {
      if (!(AR_FIELDS as readonly string[]).includes(field)) continue;
      const v = text(value).trim();
      if (!v) continue;
      set[`${field}.${lang}`] = v;
      applied.push(field);
    }
    if (!applied.length)
      throw new BadRequestException("Approve at least one translated field.");
    set[`${key}.status`] = "approved";
    set[`${key}.reviewedBy`] = actor.email;
    set[`${key}.reviewedAt`] = new Date();
    await this.db.collection("products").updateOne({ _id }, { $set: set });
    await this.audit.recordEvent({
      actorId: actor.sub,
      actorEmail: actor.email,
      action: `admin.translation.${lang}.approved`,
      resource: "products",
      resourceId: productId,
      details: { fields: applied },
    });
    return { applied };
  }

  async reject(
    actor: { sub: string; email: string },
    productId: string,
    langIn: unknown = "ar",
  ) {
    const lang = toLang(langIn);
    const key = draftKey(lang);
    const _id = this.oid(productId);
    const r = await this.db.collection("products").updateOne(
      { _id, [`${key}.status`]: "draft" },
      {
        $set: {
          [`${key}.status`]: "rejected",
          [`${key}.reviewedBy`]: actor.email,
          [`${key}.reviewedAt`]: new Date(),
        },
      },
    );
    if (!r.matchedCount)
      throw new BadRequestException("There is no pending draft for this product.");
    await this.audit.recordEvent({
      actorId: actor.sub,
      actorEmail: actor.email,
      action: `admin.translation.${lang}.rejected`,
      resource: "products",
      resourceId: productId,
      details: {},
    });
    return { rejected: true };
  }
}
