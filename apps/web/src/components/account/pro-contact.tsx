"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApplications } from "@/hooks/use-professional";
import { apiFetch } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AccountHeading, QueryState } from "./experience-ui";
export default function ProfessionalContact() {
  const t = useTranslations("AccountExperience");
  const p = useTranslations("Professionals.apply.fields");
  const q = useApplications();
  const app = q.data?.[0];
  const [values, setValues] = useState({ contactPerson: "", email: "", phone: "" });
  const qc = useQueryClient();
  useEffect(() => {
    if (app)
      setValues({
        contactPerson: app.contactPerson ?? "",
        email: app.email ?? "",
        phone: app.phone ?? "",
      });
  }, [app]);
  const save = useMutation({
    mutationFn: () =>
      apiFetch(`/professional/applications/${app?._id}/contact`, {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["professional", "applications"] }),
  });
  return (
    <>
      <AccountHeading title={t("updateContact")} />
      <QueryState query={q}>
        {app && (
          <form
            className="max-w-xl space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            {(["contactPerson", "email", "phone"] as const).map((k) => (
              <label key={k} className="block text-sm">
                {p(k)}
                <Input
                  className="mt-2"
                  required
                  type={k === "email" ? "email" : k === "phone" ? "tel" : "text"}
                  dir={k === "contactPerson" ? "auto" : "ltr"}
                  value={values[k]}
                  onChange={(e) => setValues({ ...values, [k]: e.target.value })}
                />
              </label>
            ))}
            <Button disabled={save.isPending}>{t("save")}</Button>
            {save.isError && (
              <p role="alert" className="text-destructive">
                {t("error")}
              </p>
            )}
            {save.isSuccess && <p role="status">{t("success")}</p>}
          </form>
        )}
      </QueryState>
    </>
  );
}
