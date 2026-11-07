"use client";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
export function CertificateLink({ id }: { id: string }) {
  const t = useTranslations("AccountExperience");
  const q = useMutation({
    mutationFn: () =>
      apiFetch<{ url: string }>(`/trainings/my-bookings/${id}/certificate`),
  });
  return (
    <div>
      <Button variant="outline" disabled={q.isPending} onClick={() => q.mutate()}>
        {t("certificate")}
      </Button>
      {q.data && (
        <a
          href={q.data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ms-4 inline-flex min-h-11 items-center underline"
        >
          {t("openDocument")}
        </a>
      )}
      {q.isError && <p role="alert">{t("error")}</p>}
    </div>
  );
}
