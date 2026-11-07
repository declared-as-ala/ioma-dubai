import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Cart } from "@ioma/types";
import { apiFetch } from "@/lib/api";
import { getGuestSessionId } from "@/lib/guest-session";

const CART_KEY = ["cart"];

function guestHeaders(): HeadersInit {
  const id = getGuestSessionId();
  return id ? { "X-Guest-Session-Id": id } : {};
}

export function useCartQuery(professional = false) {
  return useQuery({
    queryKey: professional ? ["b2b", "cart"] : CART_KEY,
    queryFn: () =>
      apiFetch<Cart>(professional ? "/cart/pro" : "/cart", { headers: guestHeaders() }),
  });
}

export function useAddCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { sku: string; qty: number }) =>
      apiFetch<Cart>("/cart/items", {
        method: "POST",
        headers: guestHeaders(),
        body: JSON.stringify(input),
      }),
    onSuccess: (cart) => queryClient.setQueryData(CART_KEY, cart),
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { sku: string; qty: number }) =>
      apiFetch<Cart>(`/cart/items/${input.sku}`, {
        method: "PATCH",
        headers: guestHeaders(),
        body: JSON.stringify({ qty: input.qty }),
      }),
    onSuccess: (cart) => queryClient.setQueryData(CART_KEY, cart),
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sku: string) =>
      apiFetch<Cart>(`/cart/items/${sku}`, {
        method: "DELETE",
        headers: guestHeaders(),
      }),
    onSuccess: (cart) => queryClient.setQueryData(CART_KEY, cart),
  });
}

export { guestHeaders };
