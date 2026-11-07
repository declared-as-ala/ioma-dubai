import {
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Model, Types } from "mongoose";
import sharp from "sharp";
import { Product } from "../catalog/schemas/product.schema";
import { MediaAsset } from "./media-asset.schema";
import {
  ProductMediaService,
  processProductImage,
  PRODUCT_IMAGE_LIMIT,
} from "./product-media.service";
import { StorageService } from "../../common/storage/storage.service";

describe("Product image decoding", () => {
  const image = () =>
    sharp({
      create: {
        width: 360,
        height: 240,
        channels: 4,
        background: { r: 90, g: 30, b: 180, alpha: 0.5 },
      },
    })
      .png()
      .toBuffer();
  it("produces decoded WebP derivatives with aspect ratio and transparency", async () => {
    const result = await processProductImage({
      buffer: await image(),
      mimetype: "image/png",
      originalname: "product.png",
    });
    const thumb = await sharp(result.thumbnail).metadata();
    expect(thumb.format).toBe("webp");
    expect(thumb.width).toBe(160);
    expect(thumb.height).toBe(107);
    expect(thumb.hasAlpha).toBe(true);
    expect(result.main.info.width).toBe(360);
  });
  it.each(["image/svg+xml", "application/octet-stream", "image/jpeg"])(
    "rejects MIME mismatch %s",
    async (mimetype) => {
      await expect(
        processProductImage({
          buffer: await image(),
          mimetype,
          originalname: "image.png",
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    },
  );
  it("rejects corrupted and oversized images before storage", async () => {
    for (const buffer of [
      Buffer.from("not an image"),
      Buffer.alloc(PRODUCT_IMAGE_LIMIT + 1),
    ])
      await expect(
        processProductImage({ buffer, mimetype: "image/png", originalname: "image.png" }),
      ).rejects.toBeInstanceOf(BadRequestException);
  });
  it("rejects disguised formats even when extension and declared MIME agree", async () => {
    await expect(
      processProductImage({
        buffer: await image(),
        mimetype: "image/jpeg",
        originalname: "image.jpg",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe("Product media persistence and relation safety", () => {
  const owner = new Types.ObjectId(),
    first = new Types.ObjectId(),
    second = new Types.ObjectId();
  const alt = { en: "Product", fr: "Produit", ar: "منتج" };
  const assets = { find: jest.fn(), findOne: jest.fn(), create: jest.fn() };
  const products = {
    findById: jest.fn(),
    exists: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };
  const storage = { upload: jest.fn(), delete: jest.fn() };
  const service = new ProductMediaService(
    assets as unknown as Model<MediaAsset>,
    products as unknown as Model<Product>,
    storage as unknown as StorageService,
  );
  beforeEach(() => {
    jest.clearAllMocks();
    products.exists.mockResolvedValue(true);
    assets.findOne.mockReturnValue({ lean: async () => null });
    products.findById.mockReturnValue({
      lean: async () => ({
        _id: owner,
        media: [
          { assetId: first, alt },
          { assetId: second, alt },
        ],
      }),
    });
  });
  it("removes only the intended relation and retains shared MinIO objects", async () => {
    assets.find.mockReturnValue({
      lean: async () => [{ _id: second, productId: owner, width: 400, height: 400 }],
    });
    products.findOneAndUpdate.mockReturnValue({
      lean: async () => ({
        name: alt,
        media: [{ assetId: second, alt }],
        mediaRevision: 2,
      }),
    });
    const result = await service.saveGallery(String(owner), {
      revision: 1,
      media: [{ assetId: String(second), alt }],
    });
    expect(result.media).toHaveLength(1);
    expect(result.primaryImage?.id).toBe(String(second));
    expect(result.primaryImage?.thumbnailUrl).toContain("/thumbnail");
    expect(products.findOneAndUpdate.mock.calls[0]![1].$set.media).toEqual([
      { assetId: second, alt },
    ]);
    expect(storage.delete).not.toHaveBeenCalled();
  });
  it("rejects images owned by an unrelated product", async () => {
    assets.find.mockReturnValue({
      lean: async () => [{ _id: new Types.ObjectId(), productId: new Types.ObjectId() }],
    });
    await expect(
      service.saveGallery(String(owner), {
        revision: 1,
        media: [{ assetId: String(first), alt }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(products.findOneAndUpdate).not.toHaveBeenCalled();
  });
  it("rejects repeated references and stale gallery writes", async () => {
    await expect(
      service.saveGallery(String(owner), {
        revision: 1,
        media: [
          { assetId: String(first), alt },
          { assetId: String(first), alt },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    assets.find.mockReturnValue({ lean: async () => [] });
    products.findOneAndUpdate.mockReturnValue({ lean: async () => null });
    await expect(
      service.saveGallery(String(owner), { revision: 0, media: [] }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it("cleans partially uploaded objects and does not persist on MinIO failure", async () => {
    storage.upload
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("offline"));
    const buffer = await sharp({
      create: { width: 64, height: 64, channels: 3, background: "white" },
    })
      .png()
      .toBuffer();
    await expect(
      service.upload(String(owner), {
        buffer,
        originalname: "image.png",
        mimetype: "image/png",
      } as Express.Multer.File),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(assets.create).not.toHaveBeenCalled();
    expect(storage.delete).toHaveBeenCalledTimes(1);
  });
});
