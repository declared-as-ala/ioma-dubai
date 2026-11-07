import { redirect } from "@/i18n/navigation";

export default async function ProductRangesRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/admin/catalogue/organization?tab=ranges", locale });
}
