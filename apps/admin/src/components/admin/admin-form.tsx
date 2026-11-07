"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { AdminField, AdminResource } from "@ioma/config";
import { normalizeShopifyRichText } from "@ioma/validation";
import { useAdminQuery } from "@/hooks/use-admin";
import { apiFetch } from "@/lib/api";
import { useAdminFormat } from "./admin-ui";

const inputClass = "pl-input";
export function fieldLabel(t: ReturnType<typeof useTranslations>, key: string) {
  const name = `fields.${key.replaceAll(".", "_")}`;
  return t.has(name) ? t(name) : key.replace(/([A-Z])/g, " $1").replaceAll("_", " ");
}
function ReferenceField({
  field,
  value,
  onChange,
  disabled,
}: {
  field: AdminField;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}) {
  const q = useAdminQuery<Record<string, any>[]>(`references/${field.resource}`);
  const { label } = useAdminFormat();
  return (
    <select
      className={inputClass}
      required={field.required}
      disabled={disabled}
      multiple={field.type === "references"}
      value={value ?? (field.type === "references" ? [] : "")}
      onChange={(e) =>
        onChange(
          field.type === "references"
            ? Array.from(e.target.selectedOptions, (o) => o.value)
            : e.target.value || null,
        )
      }
    >
      <option value="">—</option>
      {q.data?.map((r) => (
        <option key={r._id} value={r._id}>
          {label(
            r.name ??
              r.title ??
              r.originalName ??
              ([r.firstName, r.lastName].filter(Boolean).join(" ") || r.slug || r._id),
          )}
        </option>
      ))}
    </select>
  );
}
export function FieldEditor({
  field,
  value,
  onChange,
  disabled = false,
}: {
  field: AdminField;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("AdminExperience");
  const title = fieldLabel(t, field.key);
  if (field.type === "localized")
    return (
      <fieldset className="min-w-0 md:col-span-2">
        <legend className="mb-2 text-xs font-semibold">
          {title}
          {field.required ? " *" : ""}
        </legend>
        <div className="grid gap-3 md:grid-cols-2">
          {["en", "ar"].map((locale) => {
            const rawVal = value?.[locale] ?? "";
            const displayVal =
              typeof rawVal === "string" &&
              rawVal.includes('"type"') &&
              rawVal.includes('"root"')
                ? normalizeShopifyRichText(rawVal)
                : rawVal;
            return (
              <label key={locale} className="grid min-w-0 gap-1 text-xs">
                <span>{locale.toUpperCase()}</span>
                <textarea
                  dir={locale === "ar" ? "rtl" : "ltr"}
                  required={field.required}
                  maxLength={12000}
                  rows={3}
                  disabled={disabled}
                  className={inputClass}
                  value={displayVal}
                  onChange={(e) => {
                    const inputVal = e.target.value;
                    const cleanVal =
                      typeof inputVal === "string" &&
                      inputVal.includes('"type"') &&
                      inputVal.includes('"root"')
                        ? normalizeShopifyRichText(inputVal)
                        : inputVal;
                    onChange({ en: "", fr: "", ar: "", ...value, [locale]: cleanVal });
                  }}
                />
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  if (field.type === "blocks")
    return (
      <fieldset className="md:col-span-2">
        <legend className="mb-3 text-sm font-semibold">{title}</legend>
        <div className="space-y-4">
          {(value ?? []).map((block: any, index: number) => (
            <div
              key={index}
              className="grid gap-3 border bg-neutral-50 p-4 md:grid-cols-2"
            >
              <label className="grid gap-1 text-xs">
                {t("fields.type")}
                <select
                  className={inputClass}
                  value={block.type}
                  onChange={(e) =>
                    onChange(
                      value.map((b: any, i: number) =>
                        i === index ? { ...b, type: e.target.value } : b,
                      ),
                    )
                  }
                >
                  {["text", "image", "link", "faq"].map((type) => (
                    <option key={type} value={type}>
                      {t(`values.${type}`)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="min-h-11 text-sm text-red-700"
                onClick={() =>
                  onChange(value.filter((_: unknown, i: number) => i !== index))
                }
              >
                {t("removeBlock")}
              </button>
              {["heading", "body"].map((key) => (
                <FieldEditor
                  key={key}
                  field={{ key, type: "localized" }}
                  value={block[key]}
                  onChange={(v) =>
                    onChange(
                      value.map((b: any, i: number) =>
                        i === index ? { ...b, [key]: v } : b,
                      ),
                    )
                  }
                />
              ))}
              {["url", "image"].map((key) => (
                <FieldEditor
                  key={key}
                  field={{ key, type: "text" }}
                  value={block[key]}
                  onChange={(v) =>
                    onChange(
                      value.map((b: any, i: number) =>
                        i === index ? { ...b, [key]: v } : b,
                      ),
                    )
                  }
                />
              ))}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-3 min-h-11 border px-4 text-sm"
          onClick={() =>
            onChange([
              ...(value ?? []),
              {
                type: "text",
                heading: { en: "", fr: "", ar: "" },
                body: { en: "", fr: "", ar: "" },
              },
            ])
          }
        >
          {t("addBlock")}
        </button>
      </fieldset>
    );
  if (field.type === "dates")
    return (
      <label className="grid gap-1 text-xs">
        {title}
        <textarea
          className={inputClass}
          placeholder="YYYY-MM-DD"
          value={(value ?? []).map((date: string) => date.slice(0, 10)).join("\n")}
          onChange={(e) => onChange(e.target.value.split("\n").filter(Boolean))}
        />
      </label>
    );
  if (field.type === "hours" || field.type === "breaks")
    return (
      <fieldset className="md:col-span-2">
        <legend className="mb-3 text-sm">{title}</legend>
        {(value ?? []).map((row: any, index: number) => (
          <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4" key={index}>
            {(field.type === "breaks"
              ? ["day", "start", "end"]
              : ["day", "open", "close"]
            ).map((key) => (
              <label className="grid gap-1 text-xs" key={key}>
                {t(`fields.${key}`)}
                <input
                  type={key === "day" ? "number" : "time"}
                  min={0}
                  max={6}
                  required
                  value={row[key]}
                  className={inputClass}
                  onChange={(e) =>
                    onChange(
                      value.map((v: any, i: number) =>
                        i === index
                          ? {
                              ...v,
                              [key]:
                                key === "day" ? Number(e.target.value) : e.target.value,
                            }
                          : v,
                      ),
                    )
                  }
                />
              </label>
            ))}
            <button
              type="button"
              className="min-h-11 text-sm text-red-700"
              onClick={() =>
                onChange(value.filter((_: unknown, i: number) => i !== index))
              }
            >
              {t("removeBlock")}
            </button>
          </div>
        ))}
        <button
          type="button"
          className="min-h-11 border px-4 text-sm"
          disabled={(value?.length ?? 0) >= 7}
          onClick={() =>
            onChange([
              ...(value ?? []),
              field.type === "breaks"
                ? { day: 0, start: "12:00", end: "13:00" }
                : { day: value?.length ?? 0, open: "09:00", close: "18:00" },
            ])
          }
        >
          {t("addHours")}
        </button>
      </fieldset>
    );
  return (
    <label
      className={`grid min-w-0 gap-1 text-xs ${field.type === "textarea" || ["urls", "lines"].includes(field.type) ? "md:col-span-2" : ""}`}
    >
      <span className="font-semibold">
        {title}
        {field.required ? " *" : ""}
      </span>
      {field.type === "reference" || field.type === "references" ? (
        <ReferenceField
          field={field}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      ) : field.type === "select" ? (
        <select
          required={field.required}
          disabled={disabled}
          className={inputClass}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">—</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {t.has(`values.${option}`) ? t(`values.${option}`) : option}
            </option>
          ))}
        </select>
      ) : field.type === "boolean" ? (
        <span className="flex min-h-11 items-center">
          <input
            type="checkbox"
            disabled={disabled}
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="size-5"
          />
        </span>
      ) : field.type === "textarea" || ["urls", "lines"].includes(field.type) ? (
        <textarea
          rows={3}
          required={field.required}
          className={inputClass}
          value={
            ["urls", "lines"].includes(field.type)
              ? (value ?? []).join("\n")
              : (value ?? "")
          }
          onChange={(e) =>
            onChange(
              ["urls", "lines"].includes(field.type)
                ? e.target.value.split("\n").filter(Boolean)
                : e.target.value,
            )
          }
        />
      ) : (
        <input
          disabled={disabled}
          required={field.required}
          type={
            field.type === "number" || field.type === "money"
              ? "number"
              : field.type === "date"
                ? "datetime-local"
                : "text"
          }
          min={field.min}
          max={field.max}
          step={
            field.key.startsWith("coordinates.")
              ? "any"
              : field.type === "money"
                ? "0.01"
                : "1"
          }
          className={inputClass}
          value={
            field.type === "money"
              ? value == null
                ? ""
                : value / 100
              : field.type === "date"
                ? value
                  ? new Date(new Date(value).getTime() + 14400000)
                      .toISOString()
                      .slice(0, 16)
                  : ""
                : (value ?? "")
          }
          onChange={(e) =>
            onChange(
              field.type === "money"
                ? e.target.value === ""
                  ? null
                  : Math.round(Number(e.target.value) * 100)
                : field.type === "number"
                  ? e.target.value === ""
                    ? null
                    : Number(e.target.value)
                  : field.type === "date"
                    ? e.target.value
                      ? `${e.target.value}:00+04:00`
                      : null
                    : e.target.value,
            )
          }
        />
      )}
    </label>
  );
}
export function AdminForm({
  resource,
  record,
  defaults = {},
  onSaved,
}: {
  resource: AdminResource;
  record?: Record<string, any>;
  defaults?: Record<string, unknown>;
  onSaved: (id: string) => void;
}) {
  const t = useTranslations("AdminExperience");
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, any>>(() =>
    Object.fromEntries(
      resource.fields.map((field) => [
        field.key,
        record
          ? (field.key.split(".").reduce((v, part) => v?.[part], record) ??
            (field.type === "localized"
              ? { en: "", fr: "", ar: "" }
              : field.type === "boolean"
                ? false
                : [
                      "urls",
                      "lines",
                      "references",
                      "hours",
                      "breaks",
                      "dates",
                      "blocks",
                    ].includes(field.type)
                  ? []
                  : ""))
          : (defaults[field.key] ??
            (field.type === "localized"
              ? { en: "", fr: "", ar: "" }
              : field.type === "boolean"
                ? false
                : [
                      "urls",
                      "lines",
                      "references",
                      "hours",
                      "breaks",
                      "dates",
                      "blocks",
                    ].includes(field.type)
                  ? []
                  : "")),
      ]),
    ),
  );
  const save = useMutation({
    mutationFn: () => {
      const body = Object.fromEntries(
        resource.fields
          .filter((field) => !(record && field.immutable))
          .map((field) => [
            field.key,
            values[field.key] === "" &&
            !field.required &&
            ["reference", "number", "money", "date", "select"].includes(field.type)
              ? null
              : field.type === "dates"
                ? (values[field.key] ?? []).map((date: string) => date.slice(0, 10))
                : values[field.key],
          ]),
      );
      return apiFetch<{ id: string }>(
        `/admin/resources/${resource.key}${record ? `/${record._id}` : ""}`,
        { method: record ? "PATCH" : "POST", body: JSON.stringify(body) },
      );
    },
    onSuccess: async (result) => {
      await qc.invalidateQueries();
      onSaved(result.id);
    },
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="space-y-5"
    >
      <div className="grid gap-5 md:grid-cols-2">
        {resource.fields.map((field) => (
          <FieldEditor
            key={field.key}
            field={field}
            disabled={!!record && field.immutable}
            value={values[field.key]}
            onChange={(value) =>
              setValues((v) => ({
                ...v,
                [field.key]: value,
                ...(resource.key === "content" &&
                field.key === "kind" &&
                ["homepage", "navigation", "footer", "faq"].includes(value)
                  ? {
                      slug:
                        value === "homepage" ? "home" : value === "faq" ? "faq" : "main",
                    }
                  : {}),
              }))
            }
          />
        ))}
      </div>
      {save.isError && (
        <p role="alert" className="text-sm text-red-700">
          {t("error")}
        </p>
      )}
      <button type="submit" disabled={save.isPending} className="pl-btn pl-btn--primary">
        {t(save.isPending ? "saving" : "save")}
      </button>
    </form>
  );
}
