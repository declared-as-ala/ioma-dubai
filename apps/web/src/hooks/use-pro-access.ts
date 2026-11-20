import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";

export type AccessLevel = "visitor" | "validated" | "customer";
export type Localized = { en?: string; fr?: string; ar?: string };
export interface Contact {
  name: string;
  phone: string;
  email: string;
}

export interface ProAccess {
  level: AccessLevel;
  companyName: string | null;
  firstName: string | null;
  firstOrderAt: string | null;
  benefitsUntil: string | null;
  rule: {
    minFirstOrderAed: number;
    unlockOn: "confirmed" | "paid";
    validMonths: number | null;
  };
  teamContact: Contact | null;
  accountContact: Contact | null;
}

export interface ProVideo {
  id: string;
  title: Localized;
  description: Localized;
  course: string | null;
  category: string;
  durationMinutes: number | null;
  featured: boolean;
  sortOrder: number;
  preview: string | null;
  thumbnail: string | null;
  locked: boolean;
  videoUrl: string | null;
  /** Real, persisted learning progress. null while the content is locked. */
  progress: {
    positionSeconds: number;
    completed: boolean;
    updatedAt: string | null;
  } | null;
}
export interface ProPhoto {
  id: string;
  title: Localized;
  caption: Localized;
  collection: string | null;
  category: string;
  featured: boolean;
  preview: string | null;
  locked: boolean;
  image: string | null;
}
export interface ProBenefit {
  id: string;
  title: Localized;
  body: Localized;
  icon: string | null;
  image: string | null;
  locked: boolean;
}
export interface ProDocument {
  id: string;
  title: Localized;
  description: Localized;
  kind: string;
  language: string | null;
  version: string | null;
  requiredAccess: "validated" | "customer";
  locked: boolean;
  hasFile: boolean;
}

export interface PortalCta {
  label: Localized;
  href: string;
}
export interface ProHome {
  hero: {
    image?: string;
    headline?: Localized;
    body?: Localized;
    primaryCta?: PortalCta | null;
    secondaryCta?: PortalCta | null;
  };
  announcements: { id: string; title: Localized; body?: Localized }[];
  sections: { key: string; visible: boolean }[];
  featuredProductSlugs: string[];
  commerce: {
    deliveryInfo?: Localized;
    orderTerms?: Localized;
    minimumOrderNote?: Localized;
  };
  contact: { phone?: string; email?: string; supportEmail?: string; hours?: Localized };
  training: ProVideo[];
  documents: ProDocument[];
  benefits: ProBenefit[];
  benefitsUnlocked: boolean;
}

/** The server decides the level; the UI only mirrors it. */
export function useProAccess() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthHydrated();
  return useQuery({
    queryKey: ["pro", "access", user?.id],
    queryFn: () => apiFetch<ProAccess>("/professional/me/access"),
    enabled: hydrated && !!user,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

const enabledFor = (access?: ProAccess) => !!access && access.level !== "visitor";

export function useProVideos(access?: ProAccess) {
  return useQuery({
    queryKey: ["pro", "videos", access?.level],
    queryFn: () => apiFetch<ProVideo[]>("/pro/videos"),
    enabled: enabledFor(access),
  });
}
export function useProGallery(access?: ProAccess) {
  return useQuery({
    queryKey: ["pro", "gallery", access?.level],
    queryFn: () => apiFetch<ProPhoto[]>("/pro/gallery"),
    enabled: enabledFor(access),
  });
}
export function useProBenefits(access?: ProAccess) {
  return useQuery({
    queryKey: ["pro", "benefits", access?.level],
    queryFn: () => apiFetch<{ unlocked: boolean; items: ProBenefit[] }>("/pro/benefits"),
    enabled: enabledFor(access),
  });
}
export function useProDocuments(access?: ProAccess) {
  return useQuery({
    queryKey: ["pro", "documents", access?.level],
    queryFn: () => apiFetch<ProDocument[]>("/pro/documents"),
    enabled: enabledFor(access),
  });
}

export interface LeadInput {
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
  email: string;
  locale: "en" | "fr" | "ar";
  businessType?: string;
  emirate?: string;
  city?: string;
  address?: string;
  tradeLicenceNumber?: string;
  website?: string;
  message?: string;
  hp?: string;
}
export function useRegisterLead() {
  return useMutation({
    mutationFn: (input: LeadInput) =>
      apiFetch<{ received: true }>("/professional/leads", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useProHome(access?: ProAccess) {
  return useQuery({
    queryKey: ["pro", "home", access?.level],
    queryFn: () => apiFetch<ProHome>("/pro/home"),
    enabled: enabledFor(access),
  });
}

/** Saves real learning progress (position, completion). Fire-and-forget from the player. */
export function useSaveProgress() {
  return useMutation({
    mutationFn: (v: { id: string; positionSeconds: number; completed?: boolean }) =>
      apiFetch<{ saved: true }>(`/pro/videos/${v.id}/progress`, {
        method: "PUT",
        body: JSON.stringify({
          positionSeconds: v.positionSeconds,
          ...(v.completed ? { completed: true } : {}),
        }),
      }),
  });
}
