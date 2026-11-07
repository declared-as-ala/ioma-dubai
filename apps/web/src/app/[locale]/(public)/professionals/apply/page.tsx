import { redirect } from "@/i18n/navigation";

// The long application form was replaced by the five-field registration on /professionals.
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: "/professionals", locale });
}
