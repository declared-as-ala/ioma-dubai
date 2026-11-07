import type { ProductRangeKey } from "@ioma/config";
import type { LocalizedText } from "./api";

export interface ProductMediaImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  cardUrl?: string;
  width: number;
  height: number;
  alt: LocalizedText;
  order: number;
  isPrimary: boolean;
}

export interface RangeSummary {
  slug: ProductRangeKey;
  name: LocalizedText;
}

export interface ProductVariantSummary {
  sku: string;
  size: string;
  priceMinor: number;
  inStock: boolean;
}

export interface ProductListItem {
  media?: ProductMediaImage[];
  primaryImage?: ProductMediaImage | null;
  slug: string;
  name: LocalizedText;
  shortBenefit: LocalizedText;
  description?: LocalizedText;
  routineStep: "morning" | "evening" | "both";
  images: string[];
  range: RangeSummary;
  priceFromMinor: number | null;
  isBestSeller?: boolean;
  rating?: number;
  reviewCount?: number;
  uaeAvailability?: "AVAILABLE" | "PENDING";
  productType?: string | null;
  contenance?: string | null;
  badges?: string[];
  tags?: string[];
  variants?: ProductVariantSummary[];
}

export interface CategorySummary {
  slug: string;
  name: LocalizedText;
}

export interface ConcernSummary {
  slug: string;
  name: LocalizedText;
  icon: string;
}

export interface SkinTypeSummary {
  slug: string;
  name: LocalizedText;
}

export interface ActiveIngredientItem {
  name: string;
  percentage?: string | null;
  description?: string | LocalizedText | null;
}

export interface ProductDetail {
  seo?: { title: LocalizedText; description: LocalizedText } | null;
  media?: ProductMediaImage[];
  primaryImage?: ProductMediaImage | null;
  id: string;
  slug: string;
  range: RangeSummary;
  name: LocalizedText;
  accroche?: LocalizedText | null;
  shortBenefit: LocalizedText;
  description: LocalizedText;
  details?: LocalizedText | null;
  texture?: LocalizedText | null;
  results?: LocalizedText | null;
  contenance?: string | null;
  vendor?: string;
  productType?: string | null;
  tags?: string[];
  badges?: string[];
  hairTypes?: string[];
  howToUse: LocalizedText;
  routineStep: "morning" | "evening" | "both";
  fullIngredientsText: LocalizedText;
  activeIngredientsList?: ActiveIngredientItem[];
  images: string[];
  categories: CategorySummary[];
  concerns: ConcernSummary[];
  skinTypes?: SkinTypeSummary[];
  variants: ProductVariantSummary[];
  isBestSeller?: boolean;
  rating?: number;
  reviewCount?: number;
  uaeAvailability?: "AVAILABLE" | "PENDING";
  sourceUrl?: string | null;
  complementaryProducts?: Array<{
    slug: string;
    name: LocalizedText;
    priceFromMinor: number | null;
    primaryImage?: ProductMediaImage | null;
    images: string[];
  }>;
}

export interface CartItem {
  sku: string;
  size: string | null;
  qty: number;
  priceMinorSnapshot: number;
  lineTotalMinor: number;
  product: { slug: string; name: LocalizedText; images: string[] } | null;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotalMinor: number;
  itemCount: number;
}

export interface WishlistItem {
  inStock?: boolean;
  sku: string;
  size: string;
  priceMinor: number;
  product: { slug: string; name: LocalizedText; images: string[] } | null;
}

export type PaymentStatus = "pending" | "authorized" | "paid" | "failed" | "refunded";
export type FulfillmentStatus =
  "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export interface OrderAddress {
  fullName: string;
  phone: string;
  emirate: string;
  city: string;
  addressLine1: string;
  addressLine2?: string | null;
}

export interface OrderItem {
  image?: string | null;
  size?: string | null;
  sku: string;
  productNameSnapshot: LocalizedText;
  qty: number;
  unitPriceMinorSnapshot: number;
  totalMinor: number;
}

export interface Order {
  orderNumber: string;
  guestToken: string | null;
  items: OrderItem[];
  subtotalMinor: number;
  taxMinor: number;
  shippingMinor: number;
  totalMinor: number;
  currency: string;
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  statusHistory: { status: string; at: string }[];
  createdAt: string;
}
