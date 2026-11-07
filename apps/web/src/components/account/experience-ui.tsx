"use client";

import { ArrowUpRight, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function AccountHeading({
  title,
  description,
  badge = "IOMA PRIVILÈGE",
  children,
}: {
  title: string;
  description?: string;
  badge?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-10 pb-8 border-b border-border/80">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          {badge && (
            <span className="inline-flex items-center gap-2 text-[0.65rem] font-medium uppercase tracking-[0.25em] text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/50">
              <span className="size-1.5 rounded-full bg-foreground/60" />
              {badge}
            </span>
          )}
          <h1 className="mt-3 font-display text-3xl font-light tracking-tight text-foreground md:text-4xl lg:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {children && <div className="flex items-center gap-3">{children}</div>}
      </div>
    </header>
  );
}

export function AccountSection({
  title,
  subtitle,
  href,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  action?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 py-8 border-t border-border/60 ${className ?? ""}`}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-light tracking-tight md:text-2xl text-foreground">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground leading-normal">
              {subtitle}
            </p>
          )}
        </div>
        {href && <AccountLink href={href}>{action}</AccountLink>}
      </div>
      {children}
    </section>
  );
}

export function AccountLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex min-h-10 items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-foreground/80 hover:text-foreground transition-colors ${className ?? ""}`}
    >
      <span>{children}</span>
      <ArrowUpRight
        className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:group-hover:-translate-x-0.5 rtl:-rotate-90"
        aria-hidden="true"
      />
    </Link>
  );
}

export function QueryState({
  query,
  children,
}: {
  query: { isLoading: boolean; isError: boolean; refetch: () => unknown };
  children: React.ReactNode;
}) {
  const t = useTranslations("Account");
  if (query.isLoading)
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-foreground/50 mb-3" />
        <span className="text-xs uppercase tracking-widest">{t("loading")}</span>
      </div>
    );
  if (query.isError)
    return (
      <div
        role="alert"
        className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center my-4"
      >
        <p className="text-sm text-destructive">{t("loadError")}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => query.refetch()}
          className="mt-4 uppercase tracking-wider text-xs"
        >
          {t("retry")}
        </Button>
      </div>
    );
  return <>{children}</>;
}
