"use client";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { SkeletonTable } from "@/components/ui/loading-screen";

export function AdminPanel({
  title,
  children,
  href,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  href?: string;
  className?: string;
}) {
  const t = useTranslations("AdminExperience");
  return (
    <section className={`pl-card min-w-0 ${className}`}>
      <div className="pl-card-head">
        <h2 className="pl-card-title">{title}</h2>
        {href && (
          <Link className="pl-btn pl-btn--plain pl-btn--link pl-btn--sm" href={href}>
            {t("viewAll")} <span className="inline-block rtl:rotate-180">→</span>
          </Link>
        )}
      </div>
      <div>{children}</div>
    </section>
  );
}
export function AdminQueryState({
  query,
  children,
}: {
  query: { isLoading: boolean; isError: boolean; refetch: () => unknown };
  children: React.ReactNode;
}) {
  const t = useTranslations("AdminExperience");
  if (query.isLoading) return <SkeletonTable rows={4} />;
  if (query.isError)
    return (
      <div
        role="alert"
        className="pl-card"
        style={{ boxShadow: "0 0 0 1px var(--pl-critical)" }}
      >
        <p style={{ color: "var(--pl-critical)" }}>{t("error")}</p>
        <Button onClick={() => query.refetch()} className="mt-3">
          {t("retry")}
        </Button>
      </div>
    );
  return <>{children}</>;
}
export function AdminEmpty({ text }: { text?: string }) {
  const t = useTranslations("AdminExperience");
  return <p className="pl-help py-6 text-center !mt-0">{text ?? t("empty")}</p>;
}
export function useAdminFormat() {
  const locale = useLocale();
  const t = useTranslations("AdminExperience");
  const number = (n: number | null | undefined) =>
    n == null
      ? t("unavailable")
      : new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(n);
  const money = (n: number | null | undefined) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 2,
    }).format(typeof n === "number" && Number.isFinite(n) ? n / 100 : 0);
  const date = (value: string | null | undefined, time = false) => {
    if (!value) return "—";
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return "—";
      return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeZone: "Asia/Dubai",
        ...(time ? { timeStyle: "short" as const, timeZone: "Asia/Dubai" } : {}),
      }).format(d);
    } catch {
      return "—";
    }
  };
  const label = (value: unknown): string => {
    if (value == null || value === "") return "—";
    if (typeof value === "object" && !Array.isArray(value)) {
      const v = value as Record<string, unknown>;
      return String(v[locale] || v.en || v.name || "—");
    }
    if (typeof value === "boolean") return t(value ? "yes" : "no");
    const key = `values.${String(value)}`;
    return t.has(key) ? t(key) : String(value);
  };
  return { number, money, date, label, locale };
}
