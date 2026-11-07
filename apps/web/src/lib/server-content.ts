import "server-only";
import type { ManagedContentData } from "@/components/content/managed-content";

export interface MagazineArticleItem {
  slug: string;
  kind?: string;
  title: Record<string, string>;
  summary?: Record<string, string>;
  excerpt?: Record<string, string>;
  coverImage?: string;
  category?: Record<string, string>;
  categorySlug?: string;
  author?: string;
  datePublished?: string;
  readingTimeMinutes?: number;
  sourceUrl?: string;
  updatedAt?: string;
}

export interface MagazineArticleDetail extends MagazineArticleItem {
  htmlBody?: Record<string, string>;
  blocks?: Array<{
    type: string;
    heading: Record<string, string>;
    body: Record<string, string>;
    image?: string;
    url?: string;
  }>;
  seoTitle?: Record<string, string>;
  seoDescription?: Record<string, string>;
}

export interface MagazineListResponse {
  items: MagazineArticleItem[];
  total: number;
  page: number;
  limit: number;
}

function getApiOrigin(): string {
  return (
    process.env.INTERNAL_API_URL ??
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:4000"
  );
}

export async function getMagazineArticles(params?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<MagazineListResponse> {
  const origin = getApiOrigin();
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set("category", params.category);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));

  try {
    const url = `${origin}/api/content/magazine${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return { items: [], total: 0, page: 1, limit: 100 };
    const data = await response.json();
    if (Array.isArray(data)) {
      return { items: data, total: data.length, page: 1, limit: data.length };
    }
    return data;
  } catch {
    return { items: [], total: 0, page: 1, limit: 100 };
  }
}

export async function getMagazineArticle(
  slug: string,
): Promise<MagazineArticleDetail | null> {
  const origin = getApiOrigin();
  try {
    const response = await fetch(
      `${origin}/api/content/magazine/${encodeURIComponent(slug)}`,
      { cache: "no-store" },
    );
    if (!response.ok) {
      // Fallback to journal kind
      const fallback = await fetch(
        `${origin}/api/content/journal/${encodeURIComponent(slug)}`,
        { cache: "no-store" },
      );
      if (!fallback.ok) return null;
      return await fallback.json();
    }
    return await response.json();
  } catch {
    return null;
  }
}

export async function getManagedJournal(): Promise<
  (ManagedContentData & { slug: string; [key: string]: any })[]
> {
  const result = await getMagazineArticles({ limit: 100 });
  return (result.items as any) ?? [];
}

export async function getManagedContent(
  kind: string,
  slug: string,
): Promise<ManagedContentData | null> {
  const origin = getApiOrigin();
  try {
    const response = await fetch(
      `${origin}/api/content/${kind}/${encodeURIComponent(slug)}`,
      { cache: "no-store" },
    );
    if (!response.ok) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}
