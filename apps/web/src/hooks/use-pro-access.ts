import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";

export type AccessLevel = "visitor" | "validated" | "customer";
export type Localized = { en?: string; ar?: string };
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
  category: string;
  durationMinutes: number | null;
  preview: string | null;
  locked: boolean;
  videoUrl: string | null;
}
export interface ProPhoto {
  id: string;
  title: Localized;
  category: string;
  preview: string | null;
  locked: boolean;
  image: string | null;
}
export interface ProBenefit {
  id: string;
  title: Localized;
  body: Localized;
  locked: boolean;
}
export interface ProDocument {
  id: string;
  title: Localized;
  kind: string;
  requiredAccess: "validated" | "customer";
  locked: boolean;
  hasFile: boolean;
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
  locale: "en" | "ar";
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
