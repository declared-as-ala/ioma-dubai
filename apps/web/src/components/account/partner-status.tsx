"use client";

import { Check, Circle, FileCheck2, ShieldCheck, TriangleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useApplications } from "@/hooks/use-professional";
import { AccountLink, QueryState } from "./experience-ui";

export function PartnerStatus({ portal = false }: { portal?: boolean }) {
  const t = useTranslations("AccountExperience");
  const p = useTranslations("Professionals.apply");
  const locale = useLocale();
  const query = useApplications();
  const app = query.data?.[0];
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));
  return (
    <QueryState query={query}>
      {!app ? (
        <section className="my-8 border border-border bg-ioma-grey-50 p-6 md:p-8">
          <p className="text-xs uppercase tracking-widest">{t("professional")}</p>
          <h2 className="mt-4 font-display text-2xl">{t("partnerTitle")}</h2>
          <p className="my-3 max-w-xl text-sm leading-7 text-muted-foreground">
            {t("partnerIntro")}
          </p>
          <AccountLink href="/professionals/apply">{t("apply")}</AccountLink>
        </section>
      ) : (
        <section
          data-testid="partner-status"
          className="my-8 border border-border border-s-4 border-s-sf-champagne bg-sf-champagne/5 p-6 md:p-8"
        >
          <div className="flex items-start gap-4">
            {app.status === "approved" ? (
              <ShieldCheck className="mt-1 size-6 shrink-0" />
            ) : ["documents_requested", "rejected", "suspended"].includes(app.status) ? (
              <TriangleAlert className="mt-1 size-6 shrink-0" />
            ) : (
              <FileCheck2 className="mt-1 size-6 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest">{t("partnerStatus")}</p>
              <h2 className="mt-2 font-display text-2xl">
                {t(`statuses.${app.status}`)}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {t(`descriptions.${app.status}`)}
              </p>
            </div>
          </div>
          <dl className="mt-6 grid gap-5 text-sm md:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">{t("company")}</dt>
              <dd className="mt-1 break-words">
                {app.companyName || "—"}
                {app.businessType && (
                  <span className="block text-xs text-muted-foreground">
                    {p(`businessTypes.${app.businessType}`)}
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("reference")}</dt>
              <dd className="mt-1 break-all">
                <bdi>{app._id}</bdi>
              </dd>
            </div>
            {app.submittedAt && (
              <div>
                <dt className="text-xs text-muted-foreground">{t("submitted")}</dt>
                <dd className="mt-1">{date(app.submittedAt)}</dd>
              </div>
            )}
            {app.status === "approved" &&
              app.statusHistory.find((h) => h.status === "approved") && (
                <div>
                  <dt className="text-xs text-muted-foreground">{t("approvedOn")}</dt>
                  <dd className="mt-1">
                    {date(app.statusHistory.find((h) => h.status === "approved")!.at)}
                  </dd>
                </div>
              )}
          </dl>
          {!["rejected", "suspended"].includes(app.status) && (
            <ol
              aria-label={t("timeline")}
              className="my-7 grid gap-4 border-t border-border pt-6 md:grid-cols-4"
            >
              {["application", "documents", "review", "approval"].map((step, index) => {
                const done =
                  index === 0
                    ? app.status !== "draft"
                    : index === 1
                      ? !!app.documents.length && app.status !== "documents_requested"
                      : app.status === "approved";
                const active =
                  index === 0
                    ? app.status === "draft"
                    : index === 1
                      ? app.status === "documents_requested"
                      : index === 2
                        ? ["submitted", "pending_review"].includes(app.status)
                        : false;
                return (
                  <li key={step} className="flex gap-2 text-sm">
                    {done ? (
                      <Check className="size-4 shrink-0" />
                    ) : (
                      <Circle className="size-4 shrink-0" />
                    )}
                    <div>
                      {t(step)}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t(done ? "complete" : active ? "progress" : "waiting")}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          {app.applicantMessage && (
            <p className="my-4 whitespace-pre-wrap text-sm">{app.applicantMessage}</p>
          )}
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
            <AccountLink
              href={
                app.status === "approved"
                  ? portal
                    ? "/portal/catalog"
                    : "/portal"
                  : "/professionals/apply"
              }
            >
              {t(
                app.status === "approved"
                  ? portal
                    ? "catalog"
                    : "enter"
                  : app.status === "documents_requested"
                    ? "upload"
                    : app.status === "draft"
                      ? "continue"
                      : app.status === "rejected"
                        ? "reapply"
                        : "view",
              )}
            </AccountLink>
            <AccountLink href="/account/professional/documents">
              {t("documents")}
            </AccountLink>
            <AccountLink href="/account/professional/contact">
              {t("updateContact")}
            </AccountLink>
            <AccountLink href="/contact">{t("contact")}</AccountLink>
          </div>
        </section>
      )}
    </QueryState>
  );
}
