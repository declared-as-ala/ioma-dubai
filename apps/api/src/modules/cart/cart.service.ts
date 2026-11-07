import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Cart, CartDocument } from "./schemas/cart.schema";
import {
  ProductVariant,
  ProductVariantDocument,
} from "../catalog/schemas/product-variant.schema";
import { Product, ProductDocument } from "../catalog/schemas/product.schema";
import { PriceList, PriceListDocument } from "../professional/schemas/price-list.schema";
import type { AddCartItemDto } from "./dto/add-cart-item.dto";
import type { UpdateCartItemDto } from "./dto/update-cart-item.dto";

export interface CartOwner {
  userId?: string;
  sessionId?: string;
  type?: "b2c" | "b2b";
  professionalApproved?: boolean;
}

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel(ProductVariant.name)
    private readonly variantModel: Model<ProductVariantDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(PriceList.name)
    private readonly priceListModel: Model<PriceListDocument>,
  ) {}

  private ownerFilter(owner: CartOwner) {
    if (owner.userId)
      return { userId: new Types.ObjectId(owner.userId), type: owner.type ?? "b2c" };
    if (owner.sessionId) return { sessionId: owner.sessionId, type: "b2c" };
    throw new BadRequestException(
      "A logged-in session or X-Guest-Session-Id header is required for cart operations.",
    );
  }

  private async getOrCreateCart(owner: CartOwner): Promise<CartDocument> {
    const filter = this.ownerFilter(owner);
    let cart = await this.cartModel.findOne(filter);
    if (!cart) {
      cart = await this.cartModel.create({ ...filter, items: [] });
    }
    return cart;
  }

  async getCart(owner: CartOwner) {
    const cart = await this.getOrCreateCart(owner);
    return this.toResponse(cart);
  }

  async addItem(
    owner: CartOwner,
    dto: AddCartItemDto,
    cartType: "b2c" | "b2b" = "b2c",
    priceListId?: string,
  ) {
    if (!Number.isInteger(dto.qty) || dto.qty < 1)
      throw new BadRequestException("Invalid quantity.");
    const skuTarget = dto.sku.trim();
    const variant =
      (await this.variantModel.findOne({ sku: skuTarget })) ||
      (await this.variantModel.findOne({
        sku: {
          $regex: new RegExp(
            `^${skuTarget.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}$`,
            "i",
          ),
        },
      }));
    if (!variant) throw new NotFoundException(`Product variant "${dto.sku}" not found.`);
    if (
      variant.quantityOnHand - variant.quantityReserved < dto.qty &&
      !variant.backorderAllowed
    ) {
      throw new BadRequestException("Not enough stock available for this variant.");
    }

    const product = await this.productModel.findById(variant.productId);
    if (
      !product ||
      product.status !== "published" ||
      (cartType === "b2c" && product.visibility === "b2b_cabin")
    )
      throw new BadRequestException("Product unavailable in this catalogue.");

    // B2B: enforce MOQ
    if (cartType === "b2b") {
      const moq = this.resolveMoq(variant, priceListId);
      if (moq && dto.qty < moq) {
        throw new BadRequestException(`Minimum order quantity for this item is ${moq}.`);
      }
    }

    const cart = await this.getOrCreateCart({ ...owner, type: cartType });

    const priceMinor = this.resolvePrice(variant, cartType, priceListId);
    const existing = cart.items.find((item) => item.variantId.toString() === variant.id);
    if (existing) {
      if (
        !variant.backorderAllowed &&
        existing.qty + dto.qty > variant.quantityOnHand - variant.quantityReserved
      )
        throw new BadRequestException("Not enough stock available.");
      existing.qty += dto.qty;
      existing.priceMinorSnapshot = priceMinor;
    } else {
      cart.items.push({
        variantId: variant._id,
        qty: dto.qty,
        priceMinorSnapshot: priceMinor,
      });
    }
    await cart.save();
    return this.toResponse(cart);
  }

  async updateItem(owner: CartOwner, sku: string, dto: UpdateCartItemDto) {
    const variant = await this.variantModel.findOne({ sku });
    if (!variant) throw new NotFoundException("Product variant not found.");

    const cart = await this.getOrCreateCart(owner);
    const item = cart.items.find((i) => i.variantId.toString() === variant.id);
    if (!item) throw new NotFoundException("Item not in cart.");
    if (
      !Number.isInteger(dto.qty) ||
      dto.qty < 1 ||
      (!variant.backorderAllowed &&
        dto.qty > variant.quantityOnHand - variant.quantityReserved)
    )
      throw new BadRequestException("Invalid quantity or insufficient stock.");
    item.qty = dto.qty;
    await cart.save();
    return this.toResponse(cart);
  }

  async clearCart(owner: CartOwner) {
    const cart = await this.getOrCreateCart(owner);
    cart.items = [] as typeof cart.items;
    await cart.save();
    return this.toResponse(cart);
  }

  async removeItem(owner: CartOwner, sku: string) {
    const variant = await this.variantModel.findOne({ sku });
    if (!variant) throw new NotFoundException("Product variant not found.");

    const cart = await this.getOrCreateCart(owner);
    cart.items = cart.items.filter(
      (i) => i.variantId.toString() !== variant.id,
    ) as typeof cart.items;
    await cart.save();
    return this.toResponse(cart);
  }

  private async toResponse(cart: CartDocument) {
    const variantIds = cart.items.map((item) => item.variantId);
    const variants = await this.variantModel.find({ _id: { $in: variantIds } }).lean();
    const products = await this.productModel
      .find({ _id: { $in: variants.map((v) => v.productId) } })
      .lean();

    const items = cart.items.map((item) => {
      const variant = variants.find(
        (v) => v._id.toString() === item.variantId.toString(),
      );
      const product = variant
        ? products.find((p) => p._id.toString() === variant.productId.toString())
        : undefined;

      return {
        sku: variant?.sku ?? null,
        size: variant?.size ?? null,
        qty: item.qty,
        priceMinorSnapshot: item.priceMinorSnapshot,
        lineTotalMinor: item.priceMinorSnapshot * item.qty,
        moq: variant?.moq ?? null,
        product: product
          ? { slug: product.slug, name: product.name, images: product.images }
          : null,
      };
    });

    const subtotalMinor = items.reduce((sum, item) => sum + item.lineTotalMinor, 0);

    return {
      id: cart.id,
      type: cart.type,
      items,
      subtotalMinor,
      itemCount: items.reduce((sum, item) => sum + item.qty, 0),
    };
  }

  private resolvePrice(
    variant: ProductVariantDocument,
    cartType: "b2c" | "b2b",
    priceListId?: string,
  ): number {
    if (cartType === "b2b" && priceListId) {
      // PriceList overrides are resolved synchronously — the caller
      // should have pre-fetched the price list if one exists.
      return variant.b2bPriceMinor ?? variant.b2cPriceMinor;
    }
    if (cartType === "b2b" && variant.b2bPriceMinor) {
      return variant.b2bPriceMinor;
    }
    return variant.b2cPriceMinor;
  }

  private resolveMoq(
    variant: ProductVariantDocument,
    _priceListId?: string,
  ): number | null {
    return variant.moq ?? null;
  }
}
