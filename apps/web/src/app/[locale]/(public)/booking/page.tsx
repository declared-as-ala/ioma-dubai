import { redirect } from "@/i18n/navigation";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/partners", locale });
}
