import { redirect } from "@/i18n/navigation";

export default async function AccountAppointmentReschedulePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/account", locale });
}
