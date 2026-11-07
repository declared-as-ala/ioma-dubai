import type { LocalizedText } from "./api";

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "pending_review"
  | "documents_requested"
  | "approved"
  | "rejected"
  | "suspended";

export type BusinessType =
  "spa" | "clinic" | "beauty_institute" | "hotel" | "retail" | "distributor";

export interface ProfessionalApplication {
  _id: string;
  userId: string;
  companyName: string;
  contactPerson: string;
  businessType: BusinessType;
  tradeLicenceNumber: string;
  vatNumber: string | null;
  email: string;
  phone: string;
  address: string;
  emirate: string;
  city: string;
  website: string | null;
  socialMedia: string | null;
  locationsCount: number;
  expectedOrderVolume: string;
  message: string | null;
  documents: ApplicationDocument[];
  status: ApplicationStatus;
  reviewedBy: string | null;
  reviewNotes: string | null;
  applicantMessage?: string | null;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  submittedAt?: string | null;
  termsAcceptedAt?: string | null;
  requestedDocumentsCount?: number;
}

export interface ApplicationDocument {
  documentId: string;
  originalName: string;
  mimeType: string;
}

export interface StatusHistoryEntry {
  status: string;
  at: string;
  note: string | null;
}

export interface ProfessionalProfile {
  _id: string;
  userId: string;
  applicationId: string;
  companyName: string;
  businessType: string;
  emirate: string;
  city: string;
  status: "approved" | "suspended";
  priceListId: string | null;
  teamMembers: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  userId: string;
  role: string;
}

export interface PriceList {
  _id: string;
  name: string;
  items: PriceListItem[];
  isActive: boolean;
}

export interface PriceListItem {
  variantId: string;
  b2bPriceMinor: number;
  moq: number | null;
}

export interface B2BProductListItem {
  slug: string;
  name: LocalizedText;
  shortBenefit: LocalizedText;
  routineStep: string;
  images: string[];
  range: { slug: string; name: LocalizedText };
  priceFromMinor: number | null;
  variants: B2BVariantSummary[];
}

export interface B2BVariantSummary {
  sku: string;
  size: string;
  b2cPriceMinor: number;
  b2bPriceMinor: number | null;
  moq: number | null;
  inStock: boolean;
}

export interface B2BOrderListItem {
  _id: string;
  orderNumber: string;
  items: B2BOrderItem[];
  subtotalMinor: number;
  taxMinor: number;
  shippingMinor: number;
  totalMinor: number;
  currency: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
}

export interface B2BOrderItem {
  sku: string;
  productNameSnapshot: LocalizedText;
  qty: number;
  unitPriceMinorSnapshot: number;
  totalMinor: number;
}
