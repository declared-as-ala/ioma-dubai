import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import { DocumentsService } from "../documents/documents.service";
import { ProAccessService } from "../professional/pro-access.service";
import { AccessLevel, atLeast } from "../professional/pro-access.rules";

type Localized = { en?: string; fr?: string; ar?: string };
type Row = Record<string, any>;

const text = (v: unknown) => (typeof v === "string" ? v : "");
const localized = (v: unknown): Localized => {
  const o = (v ?? {}) as Localized;
  return { en: text(o.en), ar: text(o.ar) };
};

/**
 * Pro-space content (training videos, cabin gallery, benefits, documents).
 *
 * Locking is enforced here, on the server: a locked item is returned with its title,
 * category and a low-resolution `preview` only. The real video URL / full image / file
 * is never present in the response until the account has the required access level, so
 * "blurred preview" in the UI is cosmetic on top of data that was never sent.
 */
@Injectable()
export class ProContentService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly access: ProAccessService,
    private readonly documents: DocumentsService,
  ) {}

  private published(collection: string) {
    return this.connection
      .collection(collection)
      .find({ status: "published" })
      .sort({ sortOrder: 1, createdAt: -1 })
      .toArray() as Promise<Row[]>;
  }

  async videos(userId: string, roles: string[]) {
    const access = await this.access.assertLevel(userId, roles, "validated");
    const unlocked = access.level === "customer";
    const rows = await this.published("provideos");
    return rows.map((r) => ({
      id: String(r._id),
      title: localized(r.title),
      category: text(r.category),
      durationMinutes: typeof r.durationMinutes === "number" ? r.durationMinutes : null,
      preview: text(r.preview) || null,
      locked: !unlocked,
      videoUrl: unlocked ? text(r.videoUrl) || null : null,
    }));
  }

  async gallery(userId: string, roles: string[]) {
    const access = await this.access.assertLevel(userId, roles, "validated");
    const unlocked = access.level === "customer";
    const rows = await this.published("prophotos");
    return rows.map((r) => ({
      id: String(r._id),
      title: localized(r.title),
      category: text(r.category),
      preview: text(r.preview) || null,
      locked: !unlocked,
      image: unlocked ? text(r.image) || null : null,
    }));
  }

  async benefits(userId: string, roles: string[]) {
    const access = await this.access.assertLevel(userId, roles, "validated");
    const unlocked = access.level === "customer";
    const rows = await this.published("probenefits");
    return {
      unlocked,
      items: rows.map((r) => ({
        id: String(r._id),
        title: localized(r.title),
        body: localized(r.body),
        locked: !unlocked,
      })),
    };
  }

  async documentsList(userId: string, roles: string[]) {
    const access = await this.access.assertLevel(userId, roles, "validated");
    const rows = await this.published("prodocuments");
    return rows.map((r) => {
      const required: AccessLevel =
        r.requiredAccess === "customer" ? "customer" : "validated";
      return {
        id: String(r._id),
        title: localized(r.title),
        kind: text(r.kind),
        requiredAccess: required,
        locked: !atLeast(access.level, required),
        hasFile: !!r.fileDocumentId,
      };
    });
  }

  async documentUrl(userId: string, roles: string[], id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException("Document not found.");
    const row = (await this.connection
      .collection("prodocuments")
      .findOne({ _id: new Types.ObjectId(id), status: "published" })) as Row | null;
    if (!row || !row.fileDocumentId) throw new NotFoundException("Document not found.");
    const required: AccessLevel =
      row.requiredAccess === "customer" ? "customer" : "validated";
    const access = await this.access.getAccess(userId, roles);
    if (!atLeast(access.level, required)) {
      throw new ForbiddenException(
        required === "customer"
          ? "This document unlocks with your first order."
          : "Trade access required.",
      );
    }
    return {
      url: await this.documents.getSignedUrl(
        new Types.ObjectId(String(row.fileDocumentId)),
      ),
    };
  }
}
