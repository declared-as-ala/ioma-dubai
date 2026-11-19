import type { Locale } from "@ioma/config";

export interface CustomerProfile {
  email: string;
  /** False until the verification link in the signup email was used. */
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  locale: Locale;
  phone: string | null;
  dateOfBirth: string | null;
  skinConcerns: string[];
  newsletterOptIn: boolean;
  preferredLocale: Locale;
}

export interface Address {
  _id: string;
  type: "shipping" | "billing";
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  emirate: string;
  city: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountDeletionRequest {
  _id: string;
  reason: string | null;
  status: "pending" | "processed" | "cancelled";
  createdAt: string;
}
