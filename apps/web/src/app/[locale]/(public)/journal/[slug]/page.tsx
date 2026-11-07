import { redirect } from "next/navigation";

export default async function JournalArticleRedirect({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  redirect(`/${locale}/magazine/${slug}`);
}
