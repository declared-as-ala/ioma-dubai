import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Client } from "minio";
import { randomUUID } from "crypto";
import type { EnvConfig } from "../../config/env.validation";
import { MINIO_CLIENT } from "./storage.constants";

export type StorageBucket = "public" | "private";

@Injectable()
export class StorageService {
  private readonly publicBucket: string;
  private readonly privateBucket: string;
  private readonly signedUrlTtlSeconds: number;
  private readonly signingClient: Client;

  constructor(
    @Inject(MINIO_CLIENT) private readonly client: Client,
    config: ConfigService<EnvConfig, true>,
  ) {
    this.publicBucket = config.get("MINIO_BUCKET_PUBLIC", { infer: true });
    this.privateBucket = config.get("MINIO_BUCKET_PRIVATE", { infer: true });
    this.signedUrlTtlSeconds = config.get("MINIO_SIGNED_URL_TTL_SECONDS", {
      infer: true,
    });
    const endpoint = config.get("MINIO_SIGNED_URL_ENDPOINT", { infer: true });
    const url = endpoint ? new URL(endpoint) : null;
    this.signingClient = url
      ? new Client({
          endPoint: url.hostname,
          port: Number(url.port || (url.protocol === "https:" ? 443 : 80)),
          useSSL: url.protocol === "https:",
          accessKey: config.get("MINIO_ACCESS_KEY", { infer: true }),
          secretKey: config.get("MINIO_SECRET_KEY", { infer: true }),
          region: "us-east-1",
        })
      : this.client;
  }

  private bucketName(bucket: StorageBucket): string {
    return bucket === "public" ? this.publicBucket : this.privateBucket;
  }

  private async ensureBucket(bucketName: string): Promise<void> {
    try {
      const exists = await this.client.bucketExists(bucketName);
      if (!exists) {
        await this.client.makeBucket(bucketName);
      }
    } catch {
      // Ignore if bucket already exists or cannot be created immediately
    }
  }

  // Object keys are server-generated (never the client's original filename)
  // so a hostile filename can't path-traverse or collide — see SECURITY.md
  // "File uploads".
  buildObjectKey(ownerType: string, extension: string): string {
    return `${ownerType}/${randomUUID()}${extension}`;
  }

  async upload(
    bucket: StorageBucket,
    objectKey: string,
    data: Buffer,
    mimeType: string,
  ): Promise<void> {
    const name = this.bucketName(bucket);
    await this.ensureBucket(name);
    await this.client.putObject(name, objectKey, data, data.length, {
      "Content-Type": mimeType,
    });
  }

  async getObject(bucket: StorageBucket, objectKey: string): Promise<Buffer> {
    const stream = await this.client.getObject(this.bucketName(bucket), objectKey);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks);
  }

  async getSignedUrl(bucket: StorageBucket, objectKey: string): Promise<string> {
    return this.signingClient.presignedGetObject(
      this.bucketName(bucket),
      objectKey,
      this.signedUrlTtlSeconds,
    );
  }

  async delete(bucket: StorageBucket, objectKey: string): Promise<void> {
    await this.client.removeObject(this.bucketName(bucket), objectKey);
  }

  /** Streams a local file to the bucket (large videos): never loaded into memory. */
  async uploadFile(
    bucket: StorageBucket,
    objectKey: string,
    filePath: string,
    mimeType: string,
  ): Promise<void> {
    const name = this.bucketName(bucket);
    await this.ensureBucket(name);
    await this.client.fPutObject(name, objectKey, filePath, { "Content-Type": mimeType });
  }

  /** Finds the single object under a prefix (extension unknown) and returns its key and size. */
  async findByPrefix(
    bucket: StorageBucket,
    prefix: string,
  ): Promise<{ key: string; size: number } | null> {
    const stream = this.client.listObjectsV2(this.bucketName(bucket), prefix, false);
    for await (const item of stream as AsyncIterable<{ name?: string; size?: number }>) {
      if (item.name) return { key: item.name, size: item.size ?? 0 };
    }
    return null;
  }

  async getStream(bucket: StorageBucket, objectKey: string) {
    return this.client.getObject(this.bucketName(bucket), objectKey);
  }

  async getRangeStream(
    bucket: StorageBucket,
    objectKey: string,
    offset: number,
    length: number,
  ) {
    return this.client.getPartialObject(
      this.bucketName(bucket),
      objectKey,
      offset,
      length,
    );
  }
}
