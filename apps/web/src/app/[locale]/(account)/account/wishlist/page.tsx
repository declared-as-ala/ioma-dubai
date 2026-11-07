"use client";
import { useTranslations } from "next-intl";
import { AccountHeading } from "@/components/account/experience-ui";
import { WishlistPreview } from "@/components/account/activity-overview";
export default function Page() {
  const t = useTranslations("AccountExperience");
  return (
    <>
      <AccountHeading title={t("wishlist")} />
      <WishlistPreview full />
    </>
  );
}
