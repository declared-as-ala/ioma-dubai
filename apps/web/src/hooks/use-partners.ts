import { useQuery } from "@tanstack/react-query";
import type {
  PartnerListItem,
  PartnerDetail,
  ServiceSummary,
  TreatmentSummary,
} from "@ioma/types";
import { apiFetch } from "@/lib/api";

// Partners
const PARTNERS_KEY = ["partners"] as const;

export function usePartnersQuery(
  filters: {
    emirate?: string;
    city?: string;
    type?: string;
    diagnosisAvailable?: boolean;
    lat?: number;
    lng?: number;
    radius?: number;
  } = {},
) {
  const params = new URLSearchParams();
  if (filters.emirate) params.set("emirate", filters.emirate);
  if (filters.city) params.set("city", filters.city);
  if (filters.type) params.set("type", filters.type);
  if (filters.diagnosisAvailable !== undefined)
    params.set("diagnosisAvailable", String(filters.diagnosisAvailable));
  if (filters.lat !== undefined) params.set("lat", String(filters.lat));
  if (filters.lng !== undefined) params.set("lng", String(filters.lng));
  if (filters.radius !== undefined) params.set("radius", String(filters.radius));
  const qs = params.toString();

  return useQuery({
    queryKey: [...PARTNERS_KEY, filters],
    queryFn: () => apiFetch<PartnerListItem[]>(`/partners${qs ? `?${qs}` : ""}`),
    staleTime: 5 * 60_000,
  });
}

export function usePartnerQuery(slug: string) {
  return useQuery({
    queryKey: ["partner", slug],
    queryFn: () => apiFetch<PartnerDetail>(`/partners/${slug}`),
    enabled: Boolean(slug),
  });
}

// Services
export function useServicesQuery() {
  return useQuery({
    queryKey: ["services"],
    queryFn: () => apiFetch<ServiceSummary[]>("/services"),
    staleTime: 10 * 60_000,
  });
}

// Treatments
export function useTreatmentsQuery() {
  return useQuery({
    queryKey: ["treatments"],
    queryFn: () => apiFetch<TreatmentSummary[]>("/treatments"),
    staleTime: 10 * 60_000,
  });
}
