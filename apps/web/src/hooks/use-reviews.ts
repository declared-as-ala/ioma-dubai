import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiUploadProgress } from "@/lib/api";

export interface ReviewItem {
  id: string;
  rating: number;
  title: string;
  comment: string;
  authorName: string;
  verifiedPurchase: boolean;
  photos: string[];
  photoCount: number;
  createdAt: string;
  reply: { text: string; at: string } | null;
}

export interface ReviewStats {
  count: number;
  average: number | null;
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
  verifiedCount: number;
}

export interface ReviewList {
  stats: ReviewStats;
  items: ReviewItem[];
  total: number;
  page: number;
  limit: number;
  /** The signed-in customer's own review, whatever its moderation state. */
  mine: (ReviewItem & { status: "pending" | "published" | "rejected" | "hidden" }) | null;
}

export type ReviewSort = "newest" | "highest" | "lowest";

export const reviewsKey = (slug: string) => ["reviews", slug] as const;

/** Real reviews and statistics for a product. Nothing is invented client side. */
export function useProductReviews(
  slug: string,
  params: { page?: number; sort?: ReviewSort; rating?: number } = {},
) {
  const qs = new URLSearchParams();
  if (params.page && params.page > 1) qs.set("page", String(params.page));
  if (params.sort && params.sort !== "newest") qs.set("sort", params.sort);
  if (params.rating) qs.set("rating", String(params.rating));
  const query = qs.toString();
  return useQuery({
    queryKey: [...reviewsKey(slug), query],
    queryFn: () =>
      apiFetch<ReviewList>(
        `/products/${encodeURIComponent(slug)}/reviews${query ? `?${query}` : ""}`,
      ),
    staleTime: 30_000,
    retry: false,
  });
}

export const MAX_REVIEW_PHOTOS = 3;
export const MAX_REVIEW_PHOTO_BYTES = 5 * 1024 * 1024;

export function useSubmitReview(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      files = [],
      ...input
    }: {
      rating: number;
      title: string;
      comment: string;
      locale: string;
      files?: File[];
    }) => {
      const review = await apiFetch<{
        id: string;
        status: "pending";
        verifiedPurchase: boolean;
      }>(`/products/${encodeURIComponent(slug)}/reviews`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      // The review is saved first; photos are added one by one, and a failed photo never loses the review.
      let photoErrors = 0;
      for (const file of files.slice(0, MAX_REVIEW_PHOTOS)) {
        try {
          const form = new FormData();
          form.append("file", file);
          await apiUploadProgress(`/reviews/${review.id}/photos`, form, () => undefined);
        } catch {
          photoErrors++;
        }
      }
      return { ...review, photoErrors };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: reviewsKey(slug) }),
  });
}

export function useWithdrawReview(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/reviews/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: reviewsKey(slug) }),
  });
}
