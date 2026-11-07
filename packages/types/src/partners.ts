import type { LocalizedText } from "./api";

export interface PartnerListItem {
  id: string;
  slug: string;
  type: string;
  name: string;
  description: LocalizedText;
  emirate: string;
  city: string;
  address: string;
  coordinates: { lat: number; lng: number };
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  diagnosisAvailable: boolean;
  /** First partner photo (local /api/media URL), if any. */
  image?: string | null;
  mediaIds?: string[];
  services: { slug: string; name: LocalizedText; durationMinutes: number }[];
  distanceMeters: number | null;
}

export interface PartnerDetail {
  id: string;
  slug: string;
  type: string;
  name: string;
  description: LocalizedText;
  emirate: string;
  city: string;
  address: string;
  coordinates: { lat: number; lng: number };
  phone: string;
  whatsapp: string | null;
  email: string | null;
  website?: string | null;
  openingHours?: { en?: string; ar?: string; fr?: string } | string | null;
  diagnosisAvailable: boolean;
  services: {
    id: string;
    slug: string;
    name: LocalizedText;
    durationMinutes: number;
    category: string;
  }[];
  mediaIds: string[];
}

export interface ServiceSummary {
  _id: string;
  slug: string;
  name: LocalizedText;
  durationMinutes: number;
  category: string;
}

export interface TreatmentSummary {
  _id: string;
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  durationMinutes: number;
}

export interface TimeSlot {
  startsAt: string;
  endsAt: string;
  available: boolean;
}

export interface AppointmentSummary {
  id: string;
  partner: { slug: string; name: string; city: string };
  service: { slug: string; name: LocalizedText; durationMinutes: number };
  startsAt: string;
  endsAt: string;
  status: string;
  notes: string | null;
  createdAt: string | null;
}

export interface AppointmentDetail {
  id: string;
  partner: { slug: string; name: string; city: string; address: string };
  service: {
    slug: string;
    name: LocalizedText;
    durationMinutes: number;
    category: string;
  };
  startsAt: string;
  endsAt: string;
  status: string;
  notes: string | null;
  statusHistory: { status: string; at: string }[];
  createdAt: string | null;
}
