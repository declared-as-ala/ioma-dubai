"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { useApplications } from "@/hooks/use-professional";
import { apiFetch } from "@/lib/api";
import { AccountHeading, AccountLink, QueryState } from "./experience-ui";
import { Button } from "@/components/ui/button";
export function ProfessionalDocuments() {
  const t = useTranslations("AccountExperience");
  const q = useApplications();
  const [url, setUrl] = useState<string | null>(null);
  const open = useMutation({
    mutationFn: ({ id, doc }: { id: string; doc: string }) =>
      apiFetch<{ url: string }>(`/professional/applications/${id}/documents/${doc}`),
    onSuccess: (r) => setUrl(r.url),
  });
  return (
    <>
      <AccountHeading title={t("documents")} />
      <QueryState query={q}>
        {q.data?.map((app) => (
          <section key={app._id} className="mb-8">
            <p className="mb-4 text-sm">
              {app.companyName} · {t(`statuses.${app.status}`)}
            </p>
            {app.documents.length ? (
              <ul className="divide-y divide-border border-y border-border">
                {app.documents.map((d) => (
                  <li
                    key={d.documentId}
                    className="flex flex-wrap items-center justify-between gap-4 py-5"
                  >
                    <span className="break-all text-sm">
                      <bdi>{d.originalName}</bdi>
                    </span>
                    <Button
                      variant="outline"
                      disabled={open.isPending}
                      onClick={() => {
                        setUrl(null);
                        open.mutate({ id: app._id, doc: d.documentId });
                      }}
                    >
                      {t("openDocument")}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t("noDocuments")}</p>
            )}
          </section>
        ))}
      </QueryState>
      {url && (
        <a
          className="inline-flex min-h-11 items-center underline"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("openDocument")}
        </a>
      )}
      {open.isError && (
        <p role="alert" className="text-sm text-destructive">
          {t("error")}
        </p>
      )}
      {q.data?.[0]?.status === "documents_requested" && (
        <AccountLink href="/professionals/apply">{t("upload")}</AccountLink>
      )}
    </>
  );
}
export function CompanyProfile() {
  const t = useTranslations("AccountExperience");
  const p = useTranslations("Professionals.apply");
  const q = useApplications();
  const app = q.data?.[0];
  return (
    <>
      <AccountHeading title={t("company")} description={t("companyNote")} />
      <QueryState query={q}>
        {app && (
          <dl className="grid gap-7 md:grid-cols-2">
            {(
              [
                "companyName",
                "contactPerson",
                "email",
                "phone",
                "address",
                "emirate",
                "city",
                "tradeLicenceNumber",
                "vatNumber",
                "website",
                "socialMedia",
              ] as const
            ).map((k) => (
              <div key={k} className="border-b border-border pb-4">
                <dt className="text-xs text-muted-foreground">
                  {p(`fields.${k === "tradeLicenceNumber" ? "tradeLicence" : k}`)}
                </dt>
                <dd className="mt-3 break-words text-sm">
                  <bdi>{app[k] || "—"}</bdi>
                </dd>
              </div>
            ))}
          </dl>
        )}
      </QueryState>
      <div className="mt-6">
        <AccountLink href="/account/professional/contact">
          {t("updateContact")}
        </AccountLink>
        <AccountLink href="/contact">{t("contact")}</AccountLink>
      </div>
    </>
  );
}
export function ProfessionalSupport() {
  const t = useTranslations("AccountExperience");
  return (
    <>
      <AccountHeading title={t("support")} description={t("supportNote")} />
      <AccountLink href="/contact">{t("contact")}</AccountLink>
    </>
  );
}
