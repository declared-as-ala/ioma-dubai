import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import { AuditService } from "../audit/audit.service";
import { AR_FIELDS, type ReviewLang } from "./translation-review.service";

type Row = Record<string, any>;
export type CheckLevel = "ok" | "warn" | "fail";
export interface Check {
  level: CheckLevel;
  message: string;
}

const text = (v: unknown) => (typeof v === "string" ? v : "");

/** Official names and technical references that must survive translation untouched. */
const PROTECTED = [
  "IOMA",
  "In.Lab",
  "NEUTRAZEN",
  "Aquaxyl",
  "Ma Crème",
  "Mon Sérum",
  "Mon Soin Yeux",
  "Vitality Shot",
  "Sublime Oil",
  "CC Gel",
  "Cell Protector",
  "Lip Lift",
  "Lift Contours",
  "Genius Balm",
];

const FR_WORDS =
  /\b(les|des|une|est|pour|avec|votre|vos|sur|peau|soin|aux|qui|que|du|dans|après|matin|soir|appliquer)\b/gi;
const EN_WORDS = /\b(the|and|with|your|for|skin|care|this|that|is|of|to|apply)\b/gi;
const looksFrench = (t: string) => {
  const f = (t.match(FR_WORDS) ?? []).length;
  const e = (t.match(EN_WORDS) ?? []).length;
  return f >= 2 && f > e;
};
const numbers = (t: string) =>
  [...t.matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => m[0].replace(",", "."));
/** Percentages, decimals, and multi-digit figures are claims: they must match exactly. */
const claims = (t: string) =>
  numbers(t)
    .filter((n) => n.length >= 2 || n.includes("."))
    .sort();
const sameList = (a: string[], b: string[]) =>
  a.length === b.length && a.every((x, i) => x === b[i]);

/** Automatic checks of a translated field against its original (French) source. */
export function checkTranslation(
  source: string,
  draft: string,
  lang: ReviewLang,
): Check[] {
  const out: Check[] = [];
  if (!draft.trim()) return [{ level: "fail", message: "No translation." }];
  const sc = claims(source);
  const dc = claims(draft);
  if (!sameList(sc, dc))
    out.push({
      level: "fail",
      message: `Figures differ. Original: ${sc.join(", ") || "none"}. Translation: ${dc.join(", ") || "none"}.`,
    });
  const sn = numbers(source)
    .filter((n) => n.length === 1)
    .sort();
  const dn = numbers(draft)
    .filter((n) => n.length === 1)
    .sort();
  if (!sameList(sn, dn) && lang === "en")
    out.push({
      level: "warn",
      message: "Small numbers differ (check quantities such as pumps or steps).",
    });
  const lower = draft.toLowerCase();
  for (const term of PROTECTED) {
    if (
      source.toLowerCase().includes(term.toLowerCase()) &&
      !lower.includes(term.toLowerCase())
    )
      out.push({
        level: "fail",
        message: `Official name changed or missing: "${term}".`,
      });
  }
  const bullets = (t: string) => (t.match(/^[•-]/gm) ?? []).length;
  if (bullets(source) !== bullets(draft))
    out.push({ level: "warn", message: "The number of bullet points differs." });
  const ratio = draft.length / Math.max(1, source.length);
  if (ratio < 0.45 || ratio > 2.6)
    out.push({
      level: "warn",
      message: "The translation is much shorter or longer than the original.",
    });
  if (lang === "en" && looksFrench(draft))
    out.push({ level: "fail", message: "The English still looks French." });
  if (lang === "ar" && !/[؀-ۿ]/.test(draft))
    out.push({ level: "fail", message: "The Arabic text contains no Arabic." });
  return out;
}

const worst = (checks: Check[]): CheckLevel =>
  checks.some((c) => c.level === "fail")
    ? "fail"
    : checks.some((c) => c.level === "warn")
      ? "warn"
      : "ok";

/**
 * Bulk review of translation drafts: side-by-side preview with automatic verification, approval of the
 * selected products, and rollback of a whole approval batch. Live text is only ever written by approve().
 */
@Injectable()
export class TranslationBulkService {
  constructor(
    @InjectConnection() private readonly db: Connection,
    private readonly audit: AuditService,
  ) {}

  private get products() {
    return this.db.collection("products");
  }
  private get batches() {
    return this.db.collection("translationbatches");
  }

  async preview() {
    const rows = (await this.products
      .find(
        {
          deletedAt: null,
          $or: [
            { "enDraft.status": { $exists: true } },
            { "arDraft.fields.details": { $exists: true } },
          ],
        },
        {
          projection: {
            slug: 1,
            name: 1,
            visibility: 1,
            enDraft: 1,
            arDraft: 1,
            accroche: 1,
            details: 1,
            texture: 1,
            results: 1,
            howToUse: 1,
          },
        },
      )
      .sort({ slug: 1 })
      .toArray()) as Row[];
    const items = rows
      .map((p) => {
        const fields = AR_FIELDS.filter(
          (f) => f !== "name" && f !== "description" && f !== "shortBenefit",
        )
          .map((f) => {
            const source = text(p[f]?.fr) || text(p[f]?.en);
            const draftEn = text(p.enDraft?.fields?.[f]);
            const draftAr = text(p.arDraft?.fields?.[f]);
            if (!source || (!draftEn && !draftAr)) return null;
            const en = draftEn ? checkTranslation(source, draftEn, "en") : [];
            const ar = draftAr ? checkTranslation(source, draftAr, "ar") : [];
            return {
              field: f,
              source,
              liveEn: text(p[f]?.en),
              liveAr: text(p[f]?.ar),
              draftEn,
              draftAr,
              enChecks: en,
              arChecks: ar,
            };
          })
          .filter(Boolean) as Row[];
        const all = fields.flatMap((f) => [...f.enChecks, ...f.arChecks]);
        return {
          id: String(p._id),
          slug: p.slug,
          name: text(p.name?.en),
          visibility: p.visibility,
          enStatus: (p.enDraft?.status as string) ?? "none",
          arStatus: (p.arDraft?.status as string) ?? "none",
          level: worst(all),
          fields,
        };
      })
      .filter((p) => p.fields.length > 0);
    return {
      total: items.length,
      pending: {
        en: items.filter((i) => i.enStatus === "draft").length,
        ar: items.filter((i) => i.arStatus === "draft" && i.fields.some((f) => f.draftAr))
          .length,
      },
      items,
    };
  }

  async batchList() {
    const rows = (await this.batches
      .find({}, { projection: { items: 0 } })
      .sort({ at: -1 })
      .limit(30)
      .toArray()) as Row[];
    return rows.map((b) => ({
      id: String(b._id),
      by: b.by,
      at: b.at,
      langs: b.langs,
      products: b.productCount,
      fields: b.fieldCount,
      rolledBackAt: b.rolledBackAt ?? null,
      rolledBackBy: b.rolledBackBy ?? null,
    }));
  }

  /** Publishes the reviewed drafts of the selected products. Flagged (failed) products are skipped unless forced. */
  async approve(
    actor: { sub: string; email: string },
    input: { productIds?: unknown; langs?: unknown; includeFailed?: unknown },
  ) {
    const ids = Array.isArray(input.productIds) ? (input.productIds as string[]) : [];
    if (!ids.length || ids.length > 100 || !ids.every((i) => Types.ObjectId.isValid(i)))
      throw new BadRequestException("Select between 1 and 100 products.");
    const langs = (Array.isArray(input.langs) ? input.langs : []).filter(
      (l): l is ReviewLang => l === "en" || l === "ar",
    );
    if (!langs.length) throw new BadRequestException("Choose English, Arabic, or both.");
    const includeFailed = input.includeFailed === true;
    const preview = await this.preview();
    const byId = new Map(preview.items.map((i) => [i.id, i]));
    const batchItems: Row[] = [];
    const skipped: { slug: string; reason: string }[] = [];
    const now = new Date();
    for (const id of [...new Set(ids)]) {
      const p = byId.get(id);
      if (!p) {
        skipped.push({ slug: id, reason: "No draft found." });
        continue;
      }
      for (const lang of langs) {
        if ((lang === "en" ? p.enStatus : p.arStatus) !== "draft") {
          skipped.push({
            slug: p.slug,
            reason: `${lang.toUpperCase()} draft is not pending.`,
          });
          continue;
        }
        const usable = p.fields.filter((f) => (lang === "en" ? f.draftEn : f.draftAr));
        const failed = usable.filter((f) =>
          (lang === "en" ? f.enChecks : f.arChecks).some(
            (c: Check) => c.level === "fail",
          ),
        );
        if (failed.length && !includeFailed) {
          skipped.push({
            slug: p.slug,
            reason: `${lang.toUpperCase()}: verification failed on ${failed.map((f) => f.field).join(", ")}.`,
          });
          continue;
        }
        const live = (await this.products.findOne({
          _id: new Types.ObjectId(id),
        })) as Row;
        const set: Row = { updatedAt: now };
        const changes: Row = {};
        for (const f of usable) {
          const after = lang === "en" ? f.draftEn : f.draftAr;
          const before: Row = {
            [lang]: live[f.field]?.[lang] ?? null,
            // the French original stays in `fr`; it is only filled if it was somehow empty
            fr: live[f.field]?.fr ?? null,
          };
          set[`${f.field}.${lang}`] = after;
          if (lang === "en" && !text(live[f.field]?.fr))
            set[`${f.field}.fr`] = text(live[f.field]?.en);
          changes[f.field] = { before, after };
        }
        const key = `${lang}Draft`;
        set[`${key}.status`] = "approved";
        set[`${key}.reviewedBy`] = actor.email;
        set[`${key}.reviewedAt`] = now;
        await this.products.updateOne({ _id: new Types.ObjectId(id) }, { $set: set });
        batchItems.push({ productId: id, slug: p.slug, lang, changes });
      }
    }
    if (!batchItems.length) return { batchId: null, approved: 0, skipped };
    const fieldCount = batchItems.reduce((n, i) => n + Object.keys(i.changes).length, 0);
    const r = await this.batches.insertOne({
      by: actor.email,
      at: now,
      langs,
      productCount: new Set(batchItems.map((i) => i.productId)).size,
      fieldCount,
      items: batchItems,
    });
    await this.audit.recordEvent({
      actorId: actor.sub,
      actorEmail: actor.email,
      action: "admin.translation.bulk_approved",
      resource: "products",
      resourceId: String(r.insertedId),
      details: {
        langs,
        products: new Set(batchItems.map((i) => i.productId)).size,
        fields: fieldCount,
      },
    });
    return {
      batchId: String(r.insertedId),
      approved: new Set(batchItems.map((i) => i.productId)).size,
      fields: fieldCount,
      skipped,
    };
  }

  /** Restores the text that was live before a batch. A field edited by hand since is left untouched and reported. */
  async rollback(actor: { sub: string; email: string }, batchId: string) {
    if (!Types.ObjectId.isValid(batchId)) throw new NotFoundException("Batch not found.");
    const batch = (await this.batches.findOne({
      _id: new Types.ObjectId(batchId),
    })) as Row | null;
    if (!batch) throw new NotFoundException("Batch not found.");
    if (batch.rolledBackAt)
      throw new BadRequestException("This batch was already rolled back.");
    let restored = 0;
    const edited: string[] = [];
    for (const it of batch.items as Row[]) {
      const _id = new Types.ObjectId(it.productId);
      const p = (await this.products.findOne({ _id })) as Row | null;
      if (!p) continue;
      const set: Row = { updatedAt: new Date() };
      const unset: Row = {};
      for (const [field, c] of Object.entries(it.changes as Row)) {
        const current = p[field]?.[it.lang];
        if (current !== (c as Row).after) {
          edited.push(`${it.slug}.${field}.${it.lang}`);
          continue;
        }
        const before = (c as Row).before?.[it.lang];
        if (before === null || before === undefined) unset[`${field}.${it.lang}`] = "";
        else set[`${field}.${it.lang}`] = before;
        restored++;
      }
      const key = `${it.lang}Draft`;
      set[`${key}.status`] = "draft";
      unset[`${key}.reviewedBy`] = "";
      unset[`${key}.reviewedAt`] = "";
      await this.products.updateOne({ _id }, { $set: set, $unset: unset });
    }
    await this.batches.updateOne(
      { _id: batch._id },
      { $set: { rolledBackAt: new Date(), rolledBackBy: actor.email } },
    );
    await this.audit.recordEvent({
      actorId: actor.sub,
      actorEmail: actor.email,
      action: "admin.translation.bulk_rolled_back",
      resource: "products",
      resourceId: batchId,
      details: { restored, edited: edited.length },
    });
    return { restored, leftAsEdited: edited };
  }
}
