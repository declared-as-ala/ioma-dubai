import { notFound } from "next/navigation";
import {
  ManagedBlocks,
  type ManagedContentData,
} from "@/components/content/managed-content";
import { getManagedContent } from "@/lib/server-content";
export const dynamic = "force-dynamic";
async function content(slug: string): Promise<ManagedContentData | null> {
  return getManagedContent("page", slug);
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const page = await content(slug);
  return {
    title: page?.seoTitle?.[locale] || page?.title[locale],
    description: page?.seoDescription?.[locale] || page?.summary?.[locale],
  };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await content(slug);
  if (!page) notFound();
  return <ManagedBlocks content={page} />;
}
