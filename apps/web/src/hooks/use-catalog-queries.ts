import { useQuery } from "@tanstack/react-query";
import type {
  ProductListItem,
  ProductDetail,
  RangeSummary,
  CategorySummary,
  ConcernSummary,
} from "@ioma/types";
import { apiFetch } from "@/lib/api";

export interface ProductFilters {
  range?: string;
  category?: string;
  concern?: string;
  q?: string;
  bestSeller?: string;
}

function toQueryString(filters: ProductFilters): string {
  const params = new URLSearchParams();
  if (filters.range) params.set("range", filters.range);
  if (filters.category) params.set("category", filters.category);
  if (filters.concern) params.set("concern", filters.concern);
  if (filters.q) params.set("q", filters.q);
  if (filters.bestSeller) params.set("bestSeller", filters.bestSeller);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useProductsQuery(filters: ProductFilters) {
  return useQuery({
    queryKey: ["products", filters],
    refetchInterval: 60000,
    queryFn: () => apiFetch<ProductListItem[]>(`/products${toQueryString(filters)}`),
  });
}

export function useProductQuery(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    refetchInterval: 60000,
    queryFn: () => apiFetch<ProductDetail>(`/products/${slug}`),
    enabled: Boolean(slug),
  });
}

export function useRangesQuery() {
  return useQuery({
    queryKey: ["product-ranges"],
    queryFn: () => apiFetch<RangeSummary[]>("/product-ranges"),
    staleTime: 5 * 60_000,
  });
}

export function useCategoriesQuery() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch<CategorySummary[]>("/categories"),
    staleTime: 5 * 60_000,
  });
}

export function useConcernsQuery() {
  return useQuery({
    queryKey: ["skin-concerns"],
    queryFn: () => apiFetch<ConcernSummary[]>("/skin-concerns"),
    staleTime: 5 * 60_000,
  });
}
