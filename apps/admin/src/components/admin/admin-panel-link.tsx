"use client";
import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAdminAccess } from "@/hooks/use-admin";
export function AdminPanelLink() {
  const access = useAdminAccess();
  const t = useTranslations("AdminExperience");
  if (!access.data?.canAccess) return null;
  return (
    <Link
      href="/admin"
      className="inline-flex min-h-11 items-center gap-1 text-[10px] uppercase tracking-wide"
      aria-label={t("adminPanel")}
    >
      <ShieldCheck className="size-4" />
      <span className="hidden md:inline">{t("adminPanel")}</span>
      <span className="md:hidden">{t("admin")}</span>
    </Link>
  );
}
