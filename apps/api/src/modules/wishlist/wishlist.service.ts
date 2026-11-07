import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Wishlist, WishlistDocument } from "./schemas/wishlist.schema";
import {
  ProductVariant,
  ProductVariantDocument,
} from "../catalog/schemas/product-variant.schema";
import { Product, ProductDocument } from "../catalog/schemas/product.schema";

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name) private readonly wishlistModel: Model<WishlistDocument>,
    @InjectModel(ProductVariant.name)
    private readonly variantModel: Model<ProductVariantDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
  ) {}

  private async getOrCreate(userId: string) {
    let wishlist = await this.wishlistModel.findOne({ userId });
    if (!wishlist) {
      wishlist = await this.wishlistModel.create({ userId, variantIds: [] });
    }
    return wishlist;
  }

  async list(userId: string) {
    const wishlist = await this.getOrCreate(userId);
    const variants = await this.variantModel
      .find({ _id: { $in: wishlist.variantIds } })
      .lean();
    const products = await this.productModel
      .find({ _id: { $in: variants.map((v) => v.productId) } })
      .lean();

    return variants.map((variant) => {
      const product = products.find(
        (p) => p._id.toString() === variant.productId.toString(),
      );
      return {
        sku: variant.sku,
        size: variant.size,
        priceMinor: variant.b2cPriceMinor,
        inStock:
          variant.quantityOnHand - variant.quantityReserved > 0 ||
          variant.backorderAllowed,
        product: product
          ? { slug: product.slug, name: product.name, images: product.images }
          : null,
      };
    });
  }

  async add(userId: string, sku: string) {
    const variant = await this.variantModel.findOne({ sku });
    if (!variant) throw new NotFoundException("Product variant not found.");

    const wishlist = await this.getOrCreate(userId);
    if (!wishlist.variantIds.some((id) => id.toString() === variant.id)) {
      wishlist.variantIds.push(variant._id);
      await wishlist.save();
    }
    return this.list(userId);
  }

  async remove(userId: string, sku: string) {
    const variant = await this.variantModel.findOne({ sku });
    if (!variant) throw new NotFoundException("Product variant not found.");

    const wishlist = await this.getOrCreate(userId);
    wishlist.variantIds = wishlist.variantIds.filter(
      (id) => id.toString() !== variant.id,
    );
    await wishlist.save();
    return this.list(userId);
  }
}
