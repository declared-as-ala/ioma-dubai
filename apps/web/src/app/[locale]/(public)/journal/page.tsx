import { redirect } from "next/navigation";

export default async function JournalRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/magazine`);
}
