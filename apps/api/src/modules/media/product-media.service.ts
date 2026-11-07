import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { createHash } from "crypto";
import { extname, basename } from "path";
import sharp from "sharp";
import { z } from "zod";
import { StorageService } from "../../common/storage/storage.service";
import { MediaAsset } from "./media-asset.schema";
import { Product } from "../catalog/schemas/product.schema";

export const PRODUCT_IMAGE_LIMIT = 10 * 1024 * 1024;
const localized = z
  .object({ en: z.string().max(300), fr: z.string().max(300), ar: z.string().max(300) })
  .strict();
const galleryInput = z
  .object({
    revision: z.number().int().nonnegative(),
    media: z
      .array(z.object({ assetId: z.string().regex(/^[a-f\d]{24}$/i), alt: localized }))
      .max(30),
  })
  .strict();
export function mediaId(value: string) {
  if (!/^[a-f\d]{24}$/i.test(value)) throw new BadRequestException("Invalid identifier.");
  return new Types.ObjectId(value);
}
export async function processProductImage(
  file: Pick<Express.Multer.File, "buffer" | "originalname" | "mimetype">,
) {
  if (!file?.buffer?.length || file.buffer.length > PRODUCT_IMAGE_LIMIT)
    throw new BadRequestException("Image must be between 1 byte and 10 MB.");
  const formatByMime: Record<string, string> = {
    "image/jpeg": "jpeg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const formatByExtension: Record<string, string> = {
    ".jpg": "jpeg",
    ".jpeg": "jpeg",
    ".png": "png",
    ".webp": "webp",
  };
  const expected = formatByMime[file.mimetype];
  if (
    !expected ||
    formatByExtension[extname(file.originalname).toLowerCase()] !== expected
  )
    throw new BadRequestException(
      "Use a JPEG, PNG or WebP image with a matching filename.",
    );
  try {
    const input = sharp(file.buffer, { limitInputPixels: 40_000_000, failOn: "warning" });
    const metadata = await input.metadata();
    if (
      metadata.format !== expected ||
      !metadata.width ||
      !metadata.height ||
      metadata.width < 32 ||
      metadata.height < 32 ||
      (metadata.pages ?? 1) !== 1
    )
      throw new Error("Invalid dimensions or format");
    const main = await input
      .rotate()
      .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 92, alphaQuality: 100 })
      .toBuffer({ resolveWithObject: true });
    const thumbnail = await sharp(main.data)
      .resize(160, 160, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 90, alphaQuality: 100 })
      .toBuffer();
    const card = await sharp(main.data)
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 92, alphaQuality: 100 })
      .toBuffer();
    return { main, thumbnail, card };
  } catch {
    throw new BadRequestException(
      "The image cannot be decoded. Use a non-animated JPEG, PNG or WebP, at least 32 pixels per side and at most 40 megapixels.",
    );
  }
}

@Injectable()
export class ProductMediaService {
  constructor(
    @InjectModel(MediaAsset.name) readonly assets: Model<MediaAsset>,
    @InjectModel(Product.name) readonly products: Model<Product>,
    private readonly storage: StorageService,
  ) {}

  async upload(
    productId: string,
    file: Express.Multer.File,
    uploadedBy?: string,
    sourceUrl?: string,
  ) {
    const owner = mediaId(productId);
    if (!(await this.products.exists({ _id: owner })))
      throw new NotFoundException("Product not found.");
    const processed = await processProductImage(file);
    const checksum = createHash("sha256").update(file.buffer).digest("hex");
    const existing = await this.assets.findOne({ productId: owner, checksum }).lean();
    if (existing) return this.dto(existing);
    const id = new Types.ObjectId();
    const prefix = `products/${owner}/${id}`;
    const keys = {
      objectKey: `${prefix}/main.webp`,
      thumbnailKey: `${prefix}/thumbnail.webp`,
      cardKey: `${prefix}/card.webp`,
      originalKey: `${prefix}/original${extname(file.originalname).toLowerCase()}`,
    };
    const written: string[] = [];
    try {
      for (const [key, buffer, mime] of [
        [keys.originalKey, file.buffer, file.mimetype],
        [keys.objectKey, processed.main.data, "image/webp"],
        [keys.thumbnailKey, processed.thumbnail, "image/webp"],
        [keys.cardKey, processed.card, "image/webp"],
      ] as const) {
        await this.storage.upload("public", key, buffer, mime);
        written.push(key);
      }
      const asset = await this.assets.create({
        _id: id,
        productId: owner,
        ...keys,
        bucket: "public",
        mimeType: "image/webp",
        width: processed.main.info.width,
        height: processed.main.info.height,
        size: processed.main.data.length,
        originalFilename: basename(file.originalname).slice(0, 255),
        checksum,
        sourceUrl: sourceUrl ?? null,
        uploadedBy: uploadedBy ? mediaId(uploadedBy) : null,
      });
      return this.dto(asset);
    } catch (error) {
      await Promise.allSettled(written.map((key) => this.storage.delete("public", key)));
      if ((error as { code?: number }).code === 11000) {
        const winner = await this.assets.findOne({ productId: owner, checksum }).lean();
        if (winner) return this.dto(winner);
      }
      throw new ServiceUnavailableException(
        "Image storage is unavailable. Retry this image.",
      );
    }
  }

  dto(
    asset: MediaAsset & { _id: Types.ObjectId },
    alt = { en: "", fr: "", ar: "" },
    order = 0,
  ) {
    const base = `/api/media/products/${asset._id}`;
    return {
      id: asset._id.toString(),
      url: `${base}/main`,
      thumbnailUrl: `${base}/thumbnail`,
      cardUrl: `${base}/card`,
      width: asset.width,
      height: asset.height,
      alt,
      order,
      isPrimary: order === 0,
    };
  }

  async resolve(products: Array<Pick<Product, "media" | "images" | "name">>) {
    const ids = products.flatMap((p) => (p.media ?? []).map((m) => m.assetId));
    const assets = ids.length ? await this.assets.find({ _id: { $in: ids } }).lean() : [];
    const byId = new Map(assets.map((a) => [String(a._id), a]));
    return products.map((product) => {
      const media = (product.media ?? []).flatMap((ref, order) => {
        const asset = byId.get(String(ref.assetId));
        return asset
          ? [
              this.dto(
                asset,
                {
                  en: ref.alt?.en || product.name.en,
                  fr: ref.alt?.fr || product.name.fr,
                  ar: ref.alt?.ar || product.name.ar,
                },
                order,
              ),
            ]
          : [];
      });
      media.forEach((item, order) => {
        item.order = order;
        item.isPrimary = order === 0;
      });
      return {
        media,
        primaryImage: media[0] ?? null,
        images: media.length ? media.map((m) => m.url) : (product.images ?? []),
      };
    });
  }

  async saveGallery(productId: string, input: unknown) {
    const parsed = galleryInput.safeParse(input);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const { media, revision } = parsed.data;
    if (new Set(media.map((m) => m.assetId)).size !== media.length)
      throw new BadRequestException("Each image can appear only once.");
    const product = await this.products.findById(mediaId(productId)).lean();
    if (!product) throw new NotFoundException("Product not found.");
    const assets = await this.assets
      .find({ _id: { $in: media.map((m) => mediaId(m.assetId)) } })
      .lean();
    const allowed = new Set((product.media ?? []).map((m) => String(m.assetId)));
    if (
      assets.length !== media.length ||
      assets.some((a) => String(a.productId) !== productId && !allowed.has(String(a._id)))
    )
      throw new BadRequestException("Image does not belong to this product.");
    const refs = media.map((m) => ({ assetId: mediaId(m.assetId), alt: m.alt }));
    // One ordered array is the authority: index zero is the only primary image.
    // Detaching retains immutable objects for shared products and historical orders.
    const updated = await this.products
      .findOneAndUpdate(
        {
          _id: product._id,
          ...(revision === 0
            ? { $or: [{ mediaRevision: 0 }, { mediaRevision: { $exists: false } }] }
            : { mediaRevision: revision }),
        },
        {
          $set: {
            media: refs,
            images: refs.map((m) => `/api/media/products/${m.assetId}/main`),
          },
          $inc: { mediaRevision: 1 },
        },
        { new: true },
      )
      .lean();
    if (!updated)
      throw new ConflictException(
        "Images changed in another session. Reload before saving.",
      );
    return {
      ...(await this.resolve([updated]))[0],
      mediaRevision: updated.mediaRevision,
    };
  }

  async bytes(id: string, variant: string) {
    if (!["main", "thumbnail", "card"].includes(variant)) throw new NotFoundException();
    const asset = await this.assets.findById(mediaId(id)).lean();
    if (!asset) throw new NotFoundException();
    try {
      return await this.storage.getObject(
        "public",
        variant === "thumbnail"
          ? asset.thumbnailKey
          : variant === "card"
            ? asset.cardKey
            : asset.objectKey,
      );
    } catch {
      throw new ServiceUnavailableException("Product image is temporarily unavailable.");
    }
  }
}
