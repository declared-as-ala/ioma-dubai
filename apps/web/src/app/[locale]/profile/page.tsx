import { redirect } from "@/i18n/navigation";

// /profile is the short link people expect; the profile lives in the account area.
export default async function ProfileShortcut({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/account/profile", locale });
}
