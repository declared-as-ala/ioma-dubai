import { createHash } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import * as XLSX from "xlsx";
import { AuditService } from "../audit/audit.service";
import {
  matrixToRecords,
  normSize,
  parsePriceSheet,
  type ParsedPriceRow,
  type PriceKind,
} from "./price-import.util";

type Row = Record<string, any>;

export type RowState =
  "update" | "unchanged" | "conflict" | "unmatched" | "ambiguous" | "invalid";

export interface PreviewRow {
  sku: string;
  ean: string | null;
  name: string;
  size: string;
  line: number;
  state: RowState;
  matchedBy: "sku" | "sku-alias" | "ean" | null;
  variantSku: string | null;
  productSlug: string | null;
  oldFils: number | null;
  newFils: number | null;
  oldRrpFils: number | null;
  newRrpFils: number | null;
  changePct: number | null;
  issues: string[];
  applied?: boolean;
}

const FIELD: Record<PriceKind, "b2cPriceMinor" | "b2bPriceMinor"> = {
  retail: "b2cPriceMinor",
  b2b: "b2bPriceMinor",
  cabin: "b2bPriceMinor",
};
/** Large moves are shown as conflicts so a typo in the file cannot slip through unreviewed. */
const LARGE_CHANGE_PCT = 25;

@Injectable()
export class PriceImportService {
  constructor(
    @InjectConnection() private readonly db: Connection,
    private readonly audit: AuditService,
  ) {}

  private imports() {
    return this.db.collection("priceimports");
  }

  /** Parses the sheet and matches every row. Writes only the import record: no price is touched. */
  async preview(
    actor: { sub: string; email: string },
    file: { originalname: string; buffer: Buffer },
    kind: PriceKind,
  ) {
    let rows: Record<string, unknown>[];
    try {
      const wb = XLSX.read(file.buffer, { type: "buffer", cellDates: false });
      const sheet = wb.Sheets[wb.SheetNames[0]!];
      if (!sheet) throw new Error("empty");
      rows = matrixToRecords(
        XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: true }),
      );
    } catch {
      throw new BadRequestException(
        "The file could not be read. Use an XLSX or CSV price list.",
      );
    }
    const parsed = parsePriceSheet(rows, kind);
    if (!parsed.length)
      throw new BadRequestException(
        "No price rows found. Check that the file has a reference column and the right price column.",
      );

    const sha256 = createHash("sha256").update(file.buffer).digest("hex");
    const previous = await this.imports().findOne({ sha256, kind, status: "applied" });

    const variants = (await this.db
      .collection("productvariants")
      .find({})
      .toArray()) as Row[];
    const products = (await this.db
      .collection("products")
      .find({}, { projection: { slug: 1 } })
      .toArray()) as Row[];
    const slugById = new Map(products.map((p) => [String(p._id), p.slug as string]));
    const bySku = new Map(variants.map((v) => [v.sku as string, v]));
    const byEan = new Map<string, Row[]>();
    for (const v of variants)
      if (v.ean) byEan.set(v.ean, [...(byEan.get(v.ean) ?? []), v]);
    const field = FIELD[kind];
    const seen = new Map<string, number>();
    for (const r of parsed) seen.set(r.sku, (seen.get(r.sku) ?? 0) + 1);

    const out: PreviewRow[] = parsed.map((r) =>
      this.matchRow(r, kind, field, bySku, byEan, variants, slugById, seen),
    );
    const summary = {
      rows: out.length,
      update: out.filter((r) => r.state === "update").length,
      unchanged: out.filter((r) => r.state === "unchanged").length,
      conflict: out.filter((r) => r.state === "conflict").length,
      unmatched: out.filter((r) => r.state === "unmatched").length,
      ambiguous: out.filter((r) => r.state === "ambiguous").length,
      invalid: out.filter((r) => r.state === "invalid").length,
    };
    const doc = {
      filename: file.originalname,
      sha256,
      kind,
      status: "preview",
      uploadedBy: new Types.ObjectId(actor.sub),
      uploadedByEmail: actor.email,
      uploadedAt: new Date(),
      rows: out,
      summary,
      duplicateOf: previous ? String(previous._id) : null,
    };
    const res = await this.imports().insertOne(doc);
    await this.audit.recordEvent({
      actorId: actor.sub,
      actorEmail: actor.email,
      action: "admin.price-import.previewed",
      resource: "price-import",
      resourceId: String(res.insertedId),
      details: { kind, filename: file.originalname, ...summary },
    });
    return this.view({ ...doc, _id: res.insertedId });
  }

  private matchRow(
    r: ParsedPriceRow,
    kind: PriceKind,
    field: "b2cPriceMinor" | "b2bPriceMinor",
    bySku: Map<string, Row>,
    byEan: Map<string, Row[]>,
    variants: Row[],
    slugById: Map<string, string>,
    seen: Map<string, number>,
  ): PreviewRow {
    const base: PreviewRow = {
      sku: r.sku,
      ean: r.ean,
      name: r.name,
      size: r.size,
      line: r.line,
      state: "unmatched",
      matchedBy: null,
      variantSku: null,
      productSlug: null,
      oldFils: null,
      newFils: r.priceFils,
      oldRrpFils: null,
      newRrpFils: r.rrpFils,
      changePct: null,
      issues: [],
    };
    if (r.priceFils === null)
      return { ...base, state: "invalid", issues: ["Price is missing or not a number."] };
    if ((seen.get(r.sku) ?? 0) > 1)
      base.issues.push("This reference appears more than once in the file.");

    let v: Row | undefined = bySku.get(r.sku);
    let by: PreviewRow["matchedBy"] = v ? "sku" : null;
    if (!v) {
      const alias = variants.filter((x) => String(x.sku).startsWith(`${r.sku}-`));
      if (alias.length === 1) {
        v = alias[0];
        by = "sku-alias";
      } else if (alias.length > 1) {
        return {
          ...base,
          state: "ambiguous",
          issues: [`Several variants start with ${r.sku}.`],
        };
      }
    }
    if (!v && r.ean) {
      const hits = byEan.get(r.ean) ?? [];
      if (hits.length === 1) {
        v = hits[0];
        by = "ean";
        base.issues.push(
          `Matched by EAN only (database SKU ${hits[0]!.sku}). Confirm it is the same product.`,
        );
      } else if (hits.length > 1) {
        return {
          ...base,
          state: "ambiguous",
          issues: ["The EAN is shared by several references."],
        };
      }
    }
    if (!v)
      return {
        ...base,
        state: "unmatched",
        issues: [...base.issues, "No variant with this reference or EAN."],
      };

    const old = (v[field] as number | null) ?? null;
    const row: PreviewRow = {
      ...base,
      matchedBy: by,
      variantSku: v.sku as string,
      productSlug: slugById.get(String(v.productId)) ?? null,
      oldFils: old,
      oldRrpFils: (v.suggestedRetailMinor as number | null) ?? null,
      changePct:
        old && old > 0 ? Math.round(((r.priceFils - old) / old) * 1000) / 10 : null,
    };
    if (!slugById.has(String(v.productId)))
      row.issues.push("The variant's product no longer exists.");
    if (r.size && v.size && normSize(r.size) !== normSize(v.size))
      row.issues.push(`Size differs: file ${r.size}, database ${v.size}.`);
    if (r.ean && v.ean && r.ean !== v.ean)
      row.issues.push(`EAN differs: file ${r.ean}, database ${v.ean}.`);
    if (row.changePct !== null && Math.abs(row.changePct) > LARGE_CHANGE_PCT)
      row.issues.push(`Large change (${row.changePct}%).`);
    if (kind === "retail" && (old ?? 0) === 0)
      row.issues.push("First retail price for this reference.");

    const priceSame = old === r.priceFils;
    const rrpSame = kind !== "b2b" || r.rrpFils === null || r.rrpFils === row.oldRrpFils;
    if (priceSame && rrpSame && row.issues.length === 0) row.state = "unchanged";
    else if (
      row.issues.some((i) =>
        /Size differs|EAN differs|Large change|more than once|no longer exists|EAN only/.test(
          i,
        ),
      )
    )
      row.state = "conflict";
    else row.state = priceSame && rrpSame ? "unchanged" : "update";
    return row;
  }

  private view(doc: Row) {
    return {
      id: String(doc._id),
      filename: doc.filename,
      kind: doc.kind,
      status: doc.status,
      uploadedAt: doc.uploadedAt,
      uploadedByEmail: doc.uploadedByEmail,
      summary: doc.summary,
      duplicateOf: doc.duplicateOf ?? null,
      appliedAt: doc.appliedAt ?? null,
      rows: doc.rows as PreviewRow[],
    };
  }

  async list() {
    const docs = (await this.imports()
      .find({}, { projection: { rows: 0 } })
      .sort({ uploadedAt: -1 })
      .limit(50)
      .toArray()) as Row[];
    return docs.map((d) => ({
      id: String(d._id),
      filename: d.filename,
      kind: d.kind,
      status: d.status,
      uploadedAt: d.uploadedAt,
      uploadedByEmail: d.uploadedByEmail,
      summary: d.summary,
      appliedAt: d.appliedAt ?? null,
      appliedCount: d.appliedCount ?? 0,
      duplicateOf: d.duplicateOf ?? null,
    }));
  }

  async get(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException();
    const doc = (await this.imports().findOne({
      _id: new Types.ObjectId(id),
    })) as Row | null;
    if (!doc) throw new NotFoundException("Import not found.");
    return this.view(doc);
  }

  /**
   * Applies ONLY the rows the admin approved, and only the price fields: stock, images, descriptions,
   * categories, translations and orders are never touched. Absolute target values make a re-run safe
   * (already-applied rows are skipped), so an interrupted apply can simply be repeated.
   */
  async apply(actor: { sub: string; email: string }, id: string, approved: string[]) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException();
    const _id = new Types.ObjectId(id);
    const doc = (await this.imports().findOne({ _id })) as Row | null;
    if (!doc) throw new NotFoundException("Import not found.");
    if (doc.status === "applied")
      throw new ConflictException("This import was already applied.");
    if (doc.status === "reverted")
      throw new ConflictException("This import was reverted.");
    const kind = doc.kind as PriceKind;
    const field = FIELD[kind];
    const want = new Set(approved);
    const rows = doc.rows as PreviewRow[];
    const targets = rows.filter(
      (r) =>
        want.has(r.sku) &&
        (r.state === "update" || r.state === "conflict") &&
        r.variantSku &&
        r.newFils !== null,
    );
    if (!targets.length)
      throw new BadRequestException("Select at least one row to apply.");
    const rejected = [...want].filter((s) => !targets.some((t) => t.sku === s));
    if (rejected.length)
      throw new BadRequestException(
        `These rows cannot be applied: ${rejected.slice(0, 10).join(", ")}`,
      );

    await this.imports().updateOne({ _id }, { $set: { status: "applying" } });
    let count = 0;
    for (const r of targets) {
      if (r.applied) continue;
      const v = (await this.db
        .collection("productvariants")
        .findOne({ sku: r.variantSku })) as Row | null;
      if (!v) continue;
      // capture the previous values BEFORE writing
      const fromValue = v[field] ?? null;
      const rrpFrom = v.suggestedRetailMinor ?? null;
      const set: Row = { [field]: r.newFils, updatedAt: new Date() };
      if (kind === "retail") set.retailTaxTreatment = "TTC";
      if (kind !== "retail") set.tradeTaxTreatment = "HT";
      if (kind === "b2b" && r.newRrpFils !== null)
        set.suggestedRetailMinor = r.newRrpFils;
      await this.db
        .collection("productvariants")
        .updateOne({ _id: v._id }, { $set: set });
      await this.db.collection("pricehistory").insertOne({
        variantId: v._id,
        sku: v.sku,
        channel: kind,
        field,
        from: fromValue,
        to: r.newFils,
        rrpFrom,
        rrpTo: kind === "b2b" ? r.newRrpFils : null,
        importId: _id,
        at: new Date(),
        byEmail: actor.email,
        source: { filename: doc.filename, sha256: doc.sha256 },
      });
      await this.imports().updateOne(
        { _id, "rows.sku": r.sku },
        { $set: { "rows.$.applied": true } },
      );
      count++;
    }
    await this.imports().updateOne(
      { _id },
      {
        $set: {
          status: "applied",
          appliedAt: new Date(),
          appliedBy: actor.email,
          appliedCount: count,
        },
      },
    );
    await this.audit.recordEvent({
      actorId: actor.sub,
      actorEmail: actor.email,
      action: "admin.price-import.applied",
      resource: "price-import",
      resourceId: id,
      details: { kind, applied: count, filename: doc.filename },
    });
    return { applied: count };
  }

  /** Restores the previous prices of an applied import, for variants whose price was not changed again since. */
  async revert(actor: { sub: string; email: string }, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException();
    const _id = new Types.ObjectId(id);
    const doc = (await this.imports().findOne({ _id })) as Row | null;
    if (!doc) throw new NotFoundException("Import not found.");
    if (doc.status !== "applied")
      throw new ConflictException("Only an applied import can be reverted.");
    const history = (await this.db
      .collection("pricehistory")
      .find({ importId: _id })
      .toArray()) as Row[];
    let restored = 0;
    const skipped: string[] = [];
    for (const h of history) {
      const v = (await this.db
        .collection("productvariants")
        .findOne({ _id: h.variantId })) as Row | null;
      if (!v || v[h.field as string] !== h.to) {
        skipped.push(h.sku as string);
        continue;
      }
      const set: Row = { [h.field as string]: h.from, updatedAt: new Date() };
      if (h.rrpTo !== null && h.rrpTo !== undefined)
        set.suggestedRetailMinor = h.rrpFrom ?? null;
      await this.db
        .collection("productvariants")
        .updateOne({ _id: v._id }, { $set: set });
      await this.db.collection("pricehistory").insertOne({
        variantId: v._id,
        sku: v.sku,
        channel: h.channel,
        field: h.field,
        from: h.to,
        to: h.from,
        importId: _id,
        revert: true,
        at: new Date(),
        byEmail: actor.email,
      });
      restored++;
    }
    await this.imports().updateOne(
      { _id },
      { $set: { status: "reverted", revertedAt: new Date() } },
    );
    await this.audit.recordEvent({
      actorId: actor.sub,
      actorEmail: actor.email,
      action: "admin.price-import.reverted",
      resource: "price-import",
      resourceId: id,
      details: { restored, skipped: skipped.length },
    });
    return { restored, skipped };
  }
}
