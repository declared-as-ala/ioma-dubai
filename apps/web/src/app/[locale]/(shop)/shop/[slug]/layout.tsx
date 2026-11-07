import type { Metadata } from "next";
import type { ProductDetail } from "@ioma/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: "en" | "fr" | "ar"; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const origin =
    process.env.API_URL ??
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:4000";
  try {
    const response = await fetch(`${origin}/api/products/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!response.ok) return {};
    const product: ProductDetail = await response.json();
    const title = product.seo?.title[locale] || product.name[locale];
    const description = product.seo?.description[locale] || product.shortBenefit[locale];
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: product.primaryImage
          ? [
              {
                url: product.primaryImage.url,
                width: product.primaryImage.width,
                height: product.primaryImage.height,
                alt: product.primaryImage.alt[locale],
              },
            ]
          : [],
      },
    };
  } catch {
    return {};
  }
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
