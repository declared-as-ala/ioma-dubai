import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { StorageService, type StorageBucket } from "../../common/storage/storage.service";
import {
  DocumentRecord,
  DocumentRecordDocument,
  type DocumentOwnerType,
} from "./schemas/document.schema";

export interface CreateDocumentParams {
  bucket: "ioma-public" | "ioma-private";
  data: Buffer;
  mimeType: string;
  ownerType: DocumentOwnerType;
  ownerId: Types.ObjectId;
  uploadedBy: Types.ObjectId | null;
  extension: string;
}

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(DocumentRecord.name)
    private readonly documentModel: Model<DocumentRecordDocument>,
    private readonly storage: StorageService,
  ) {}

  private storageBucket(bucket: "ioma-public" | "ioma-private"): StorageBucket {
    return bucket === "ioma-public" ? "public" : "private";
  }

  async create(params: CreateDocumentParams): Promise<DocumentRecordDocument> {
    const objectKey = this.storage.buildObjectKey(params.ownerType, params.extension);
    await this.storage.upload(
      this.storageBucket(params.bucket),
      objectKey,
      params.data,
      params.mimeType,
    );

    return this.documentModel.create({
      bucket: params.bucket,
      objectKey,
      mimeType: params.mimeType,
      sizeBytes: params.data.length,
      ownerType: params.ownerType,
      ownerId: params.ownerId,
      uploadedBy: params.uploadedBy,
    });
  }

  async getBytes(
    documentId: Types.ObjectId,
  ): Promise<{ data: Buffer; mimeType: string }> {
    const doc = await this.documentModel.findById(documentId);
    if (!doc || doc.deletedAt) {
      throw new NotFoundException("Document not found.");
    }
    const data = await this.storage.getObject(
      this.storageBucket(doc.bucket),
      doc.objectKey,
    );
    return { data, mimeType: doc.mimeType };
  }

  async getSignedUrl(documentId: Types.ObjectId): Promise<string> {
    const doc = await this.documentModel.findById(documentId);
    if (!doc || doc.deletedAt) {
      throw new NotFoundException("Document not found.");
    }
    return this.storage.getSignedUrl(this.storageBucket(doc.bucket), doc.objectKey);
  }

  async assertApplicationOwnership(
    documentId: string,
    applicationId: string,
    userId: string,
  ) {
    const doc = await this.documentModel.findById(documentId);
    if (
      !doc ||
      doc.deletedAt ||
      doc.bucket !== "ioma-private" ||
      doc.ownerType !== "professional_application" ||
      doc.ownerId.toString() !== applicationId ||
      doc.uploadedBy?.toString() !== userId
    ) {
      throw new ForbiddenException("Document does not belong to this application.");
    }
  }

  // Actually removes the underlying MinIO object, not just a soft-delete
  // flag — see SPRINTS.md Sprint 6 acceptance criteria ("the underlying
  // MinIO objects are actually removed").
  async remove(documentId: Types.ObjectId): Promise<void> {
    const doc = await this.documentModel.findById(documentId);
    if (!doc || doc.deletedAt) {
      return;
    }
    await this.storage.delete(this.storageBucket(doc.bucket), doc.objectKey);
    doc.deletedAt = new Date();
    await doc.save();
  }
}
