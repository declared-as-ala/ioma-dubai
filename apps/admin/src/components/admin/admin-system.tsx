"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useAdminAccess, useAdminQuery } from "@/hooks/use-admin";
import { apiFetch } from "@/lib/api";
import { AdminPanel, AdminQueryState, useAdminFormat } from "./admin-ui";
export function AdminSystem({ section }: { section: "roles" | "settings" }) {
  const t = useTranslations("AdminExperience");
  const f = useAdminFormat();
  const access = useAdminAccess();
  const allowed = !!access.data?.permissions.includes("system.view");
  const q = useAdminQuery<Record<string, any>>(section, allowed);
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const qc = useQueryClient();
  const save = useMutation({
    mutationFn: () =>
      apiFetch("/admin/users/roles", {
        method: "POST",
        body: JSON.stringify({ email, roles }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });
  if (!allowed) return <p role="alert">{t("denied")}</p>;
  return (
    <div className="mx-auto max-w-[1280px] space-y-4">
      <h1 className="pl-page-title">
        {t(section === "roles" ? "rolesPermissions" : "settings")}
      </h1>
      <AdminQueryState query={q}>
        {q.data &&
          (section === "roles" ? (
            <>
              <AdminPanel title={t("rolesPermissions")}>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(q.data).map(([role, permissions]) => (
                    <div
                      className="rounded-lg border border-[var(--pl-border)] p-4"
                      key={role}
                    >
                      <h2 className="text-sm font-semibold">{f.label(role)}</h2>
                      <ul
                        className="mt-3 space-y-1 text-[13px]"
                        style={{ color: "var(--pl-text-secondary)" }}
                      >
                        {(permissions as string[]).map((p) => (
                          <li key={p}>
                            {p.startsWith("ai.")
                              ? t("resources.ai-analyses")
                              : p.startsWith("audit.")
                                ? t("resources.audit")
                                : t(`groups.${p.split(".")[0]}`)}{" "}
                            · {t(p.endsWith("manage") ? "edit" : "view")}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </AdminPanel>
              {access.data?.permissions.includes("system.manage") && (
                <AdminPanel title={t("assignRoles")}>
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      save.mutate();
                    }}
                  >
                    <p className="pl-help !mt-0">{t("roleNote")}</p>
                    <label className="grid gap-1 text-[13px] font-medium">
                      {t("registeredUser")}
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-input"
                      />
                    </label>
                    <div className="grid gap-2 md:grid-cols-2">
                      {Object.keys(q.data).map((role) => (
                        <label key={role} className="pl-choice">
                          <input
                            type="checkbox"
                            className="pl-check"
                            checked={roles.includes(role)}
                            onChange={(e) =>
                              setRoles(
                                e.target.checked
                                  ? [...roles, role]
                                  : roles.filter((r) => r !== role),
                              )
                            }
                          />
                          {f.label(role)}
                        </label>
                      ))}
                    </div>
                    <button
                      type="submit"
                      disabled={save.isPending}
                      className="pl-btn pl-btn--primary"
                    >
                      {t("save")}
                    </button>
                    {save.isError && <p role="alert">{t("error")}</p>}
                    {save.isSuccess && <p role="status">{t("saved")}</p>}
                  </form>
                </AdminPanel>
              )}
            </>
          ) : (
            <AdminPanel title={t("settings")}>
              <p className="pl-help mb-4 !mt-0">{t("settingsNote")}</p>
              <dl className="grid gap-4 md:grid-cols-2">
                {Object.entries(q.data)
                  .filter(([key]) => key !== "credentials")
                  .map(([key, value]) => (
                    <div key={key}>
                      <dt className="pl-stat-label">{key}</dt>
                      <dd className="mt-0.5 text-[13px] font-medium">{f.label(value)}</dd>
                    </div>
                  ))}
              </dl>
              <ul className="mt-6">
                {Object.entries(q.data.credentials).map(([key, value]) => (
                  <li
                    key={key}
                    className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--pl-border-subtle)] py-2.5 text-[13px]"
                  >
                    <span>{key}</span>
                    <span className={`pl-badge ${value ? "pl-badge--success" : ""}`}>
                      {t(value ? "configured" : "notConfigured")}
                    </span>
                  </li>
                ))}
              </ul>
            </AdminPanel>
          ))}
      </AdminQueryState>
    </div>
  );
}
