import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WishlistItem } from "@ioma/types";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

const WISHLIST_KEY = ["wishlist"];

// Auth-required (no guest wishlist, see DATA_MODEL.md) — a 401 here just
// means "not logged in," not a real error, so callers treat isError with a
// 401 status as "signed out" rather than surfacing a failure state.
export function useWishlistQuery() {
  // Visitors have no wishlist: do not ask the API (it would answer 401 on every page)
  const signedIn = useAuthStore((st) => !!st.user);
  return useQuery({
    queryKey: WISHLIST_KEY,
    queryFn: () => apiFetch<WishlistItem[]>("/wishlist"),
    enabled: signedIn,
    retry: false,
  });
}

export function useAddWishlistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sku: string) =>
      apiFetch<WishlistItem[]>("/wishlist", {
        method: "POST",
        body: JSON.stringify({ sku }),
      }),
    onSuccess: (items) => queryClient.setQueryData(WISHLIST_KEY, items),
  });
}

export function useRemoveWishlistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sku: string) =>
      apiFetch<WishlistItem[]>(`/wishlist/${sku}`, { method: "DELETE" }),
    onSuccess: (items) => queryClient.setQueryData(WISHLIST_KEY, items),
  });
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.statusCode === 401;
}
