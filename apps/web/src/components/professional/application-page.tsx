"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { applicationFormSchema, type ApplicationFormValues } from "@ioma/validation";
import type { ProfessionalApplication } from "@ioma/types";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import {
  useApplications,
  useCreateDraftMutation,
  useSubmitApplicationMutation,
  useUploadDocumentMutation,
} from "@/hooks/use-professional";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, ArrowRight } from "lucide-react";
import { PageLoader } from "@/components/ui/loading-screen";

const businessTypes = [
  "spa",
  "clinic",
  "beauty_institute",
  "hotel",
  "retail",
  "distributor",
] as const;
const emirates = ["AUH", "DXB", "SHJ", "AJM", "UAQ", "RAK", "FUJ"] as const;
const applicationPath = "/professionals/apply";
const linkClass =
  "inline-flex min-h-11 items-center gap-2 underline underline-offset-4 hover:text-sf-champagne focus-visible:outline-2 focus-visible:outline-offset-4";

export default function ApplicationPage() {
  const t = useTranslations("Professionals.apply");
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthHydrated();
  const query = useApplications();
  const [reapply, setReapply] = useState(false);
  const latest = query.data?.[0];
  return (
    <main className="mx-auto min-h-[50vh] w-full max-w-[800px] px-4 py-12 md:px-6 md:py-20">
      <h1 className="font-display text-3xl md:text-4xl">{t("title")}</h1>
      <p className="mt-4 text-muted-foreground">{t("subtitle")}</p>
      <ol
        aria-label={t("progressLabel")}
        className="my-8 grid grid-cols-3 gap-2 border-y py-4 text-xs md:text-sm"
      >
        {["account", "application", "review"].map((step, i) => (
          <li key={step}>
            {i + 1}. {t(`steps.${step}`)}
          </li>
        ))}
      </ol>
      {!hydrated ? (
        <PageLoader variant="luxury" fullScreen={false} label={t("loading")} />
      ) : !user ? (
        <section className="border p-6 md:p-8" aria-label={t("account.title")}>
          <h2 className="font-display text-xl">{t("account.title")}</h2>
          <p className="mt-3 text-muted-foreground">{t("account.description")}</p>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
            <Link
              className={linkClass}
              href={`/register?redirect=${encodeURIComponent(applicationPath)}`}
            >
              {t("account.register")}
              <ArrowRight aria-hidden="true" className="size-4 rtl:rotate-180" />
            </Link>
            <Link
              className={linkClass}
              href={`/login?redirect=${encodeURIComponent(applicationPath)}`}
            >
              {t("account.signIn")}
            </Link>
          </div>
        </section>
      ) : query.isPending ? (
        <PageLoader variant="luxury" fullScreen={false} label={t("loading")} />
      ) : query.isError ? (
        <div role="alert">
          <p>{t("errors.load")}</p>
          <Button onClick={() => query.refetch()} className="mt-4">
            {t("retry")}
          </Button>
        </div>
      ) : latest &&
        !["draft", "documents_requested"].includes(latest.status) &&
        !(latest.status === "rejected" && reapply) ? (
        <ApplicationStatus application={latest} onReapply={() => setReapply(true)} />
      ) : (
        <ApplicationForm
          key={user.id}
          initial={latest?.status === "rejected" ? undefined : latest}
          email={user.email}
        />
      )}
    </main>
  );
}

function ApplicationStatus({
  application: app,
  onReapply,
}: {
  application: ProfessionalApplication;
  onReapply: () => void;
}) {
  const t = useTranslations("Professionals.apply");
  const locale = useLocale();
  const pending = ["submitted", "pending_review"].includes(app.status);
  return (
    <section className="border p-6 md:p-8" data-testid="application-status">
      {pending && (
        <CheckCircle aria-hidden="true" className="mb-4 size-8 text-sf-champagne" />
      )}
      <h2 className="font-display text-2xl">
        {pending ? t("success.title") : t(`statuses.${app.status}`)}
      </h2>
      <p className="mt-3 text-muted-foreground">
        {pending ? t("success.description") : t(`nextSteps.${app.status}`)}
      </p>
      <dl className="mt-6 space-y-3 text-sm">
        <div>
          <dt className="text-muted-foreground">{t("reference")}</dt>
          <dd className="break-all" data-testid="application-reference">
            {app._id}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("status.company")}</dt>
          <dd>{app.companyName}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("statusLabel")}</dt>
          <dd>{t(`statuses.${app.status}`)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("status.submitted")}</dt>
          <dd>{new Date(app.submittedAt ?? app.createdAt).toLocaleDateString(locale)}</dd>
        </div>
      </dl>
      {app.applicantMessage && (
        <p className="mt-4 whitespace-pre-wrap break-words">{app.applicantMessage}</p>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-6">
        <Link href="/" className={linkClass}>
          {t("success.backToHome")}
        </Link>
        {app.status === "approved" && (
          <Link href="/portal" className={linkClass}>
            {t("portal")}
          </Link>
        )}
        {app.status === "rejected" && (
          <Button variant="outline" onClick={onReapply}>
            {t("actions.newApplication")}
          </Button>
        )}
      </div>
    </section>
  );
}

function ApplicationForm({
  initial,
  email,
}: {
  initial?: ProfessionalApplication;
  email: string;
}) {
  const t = useTranslations("Professionals.apply");
  const createDraft = useCreateDraftMutation();
  const submit = useSubmitApplicationMutation();
  const upload = useUploadDocumentMutation();
  const busyRef = useRef(false);
  const idRef = useRef(initial?._id);
  const [busy, setBusy] = useState(false);
  const [documents, setDocuments] = useState(initial?.documents ?? []);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      companyName: initial?.companyName ?? "",
      contactPerson: initial?.contactPerson ?? "",
      businessType: initial?.businessType,
      tradeLicenceNumber: initial?.tradeLicenceNumber ?? "",
      vatNumber: initial?.vatNumber ?? "",
      email: initial?.email ?? email,
      phone: initial?.phone ?? "",
      address: initial?.address ?? "",
      emirate: initial?.emirate as ApplicationFormValues["emirate"],
      city: initial?.city ?? "",
      website: initial?.website ?? "",
      socialMedia: initial?.socialMedia ?? "",
      locationsCount: initial?.locationsCount ?? 1,
      expectedOrderVolume: initial?.expectedOrderVolume ?? "",
      message: initial?.message ?? "",
      termsAccepted: false,
    },
  });
  async function ensureDraft() {
    if (!idRef.current) {
      const draft = await createDraft.mutateAsync();
      if (!["draft", "documents_requested"].includes(draft.status))
        throw new Error("Application already submitted");
      idRef.current = draft._id;
    }
    return idRef.current;
  }
  async function uploadFile(file?: File) {
    if (!file || busyRef.current) return;
    setError(null);
    if (
      !file.size ||
      file.size > 10 * 1024 * 1024 ||
      !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)
    ) {
      setError(t("errors.file"));
      return;
    }
    busyRef.current = true;
    setBusy(true);
    try {
      const id = await ensureDraft();
      const doc = await upload.mutateAsync({ applicationId: id, file });
      setDocuments((current) => [...current, { ...doc, mimeType: file.type }]);
    } catch {
      setError(t("errors.upload"));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function onSubmit(values: ApplicationFormValues) {
    if (busyRef.current) return;
    setError(null);
    if (
      !documents.length ||
      (initial?.status === "documents_requested" &&
        documents.length <= (initial.requestedDocumentsCount ?? 0))
    ) {
      setError(t("errors.documentRequired"));
      return;
    }
    busyRef.current = true;
    setBusy(true);
    try {
      await submit.mutateAsync({ id: await ensureDraft(), data: values });
    } catch {
      setError(t("errors.submit"));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  const labels: Partial<Record<keyof ApplicationFormValues, string>> = {
    tradeLicenceNumber: "tradeLicence",
  };
  function fieldError(name: keyof ApplicationFormValues) {
    return form.formState.errors[name] ? (
      <p id={`${name}-error`} role="alert" className="mt-1 text-sm text-destructive">
        {t(`validation.${name}`)}
      </p>
    ) : null;
  }
  function field(name: keyof ApplicationFormValues, type = "text", optional = false) {
    return (
      <div key={name} className="min-w-0">
        <Label htmlFor={name}>
          {t(`fields.${labels[name] ?? name}`)}
          {optional ? ` (${t("fields.optional")})` : ""}
        </Label>
        <Input
          id={name}
          type={type}
          dir={["email", "tel", "url"].includes(type) ? "ltr" : "auto"}
          min={type === "number" ? 1 : undefined}
          {...form.register(name)}
          className="mt-2 min-h-11"
          aria-invalid={!!form.formState.errors[name]}
          aria-describedby={form.formState.errors[name] ? `${name}-error` : undefined}
        />
        {fieldError(name)}
      </div>
    );
  }
  function select(
    name: "businessType" | "emirate",
    values: readonly string[],
    group: string,
  ) {
    return (
      <div>
        <Label htmlFor={name}>{t(`fields.${name}`)}</Label>
        <select
          id={name}
          {...form.register(name)}
          defaultValue={form.getValues(name) ?? ""}
          className="mt-2 min-h-11 w-full rounded-none border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-sf-champagne"
          aria-invalid={!!form.formState.errors[name]}
          aria-describedby={form.formState.errors[name] ? `${name}-error` : undefined}
        >
          <option value="">{t(`fields.${name}Placeholder`)}</option>
          {values.map((value) => (
            <option key={value} value={value}>
              {t(`${group}.${value}`)}
            </option>
          ))}
        </select>
        {fieldError(name)}
      </div>
    );
  }
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="space-y-8"
      aria-busy={busy}
    >
      {initial?.status === "documents_requested" && (
        <div role="status" className="border-s-2 border-sf-champagne p-4">
          <h2>{t("statuses.documents_requested")}</h2>
          <p className="mt-2 whitespace-pre-wrap">{initial.applicantMessage}</p>
        </div>
      )}
      <fieldset
        disabled={busy}
        className="grid min-w-0 gap-5 border p-5 md:grid-cols-2 md:p-8"
      >
        <legend className="px-2 font-display text-xl">{t("sections.company")}</legend>
        {field("companyName")}
        {field("contactPerson")}
        {select("businessType", businessTypes, "businessTypes")}
        {field("tradeLicenceNumber")}
        {field("vatNumber", "text", true)}
      </fieldset>
      <fieldset
        disabled={busy}
        className="grid min-w-0 gap-5 border p-5 md:grid-cols-2 md:p-8"
      >
        <legend className="px-2 font-display text-xl">{t("sections.contact")}</legend>
        {field("email", "email")}
        {field("phone", "tel")}
        {field("address")}
        {select("emirate", emirates, "emirates")}
        {field("city")}
        {field("website", "url", true)}
        {field("socialMedia", "text", true)}
      </fieldset>
      <fieldset
        disabled={busy}
        className="grid min-w-0 gap-5 border p-5 md:grid-cols-2 md:p-8"
      >
        <legend className="px-2 font-display text-xl">{t("sections.business")}</legend>
        {field("locationsCount", "number")}
        {field("expectedOrderVolume")}
        <div className="md:col-span-2">
          <Label htmlFor="message">
            {t("fields.message")} ({t("fields.optional")})
          </Label>
          <Textarea id="message" {...form.register("message")} className="mt-2" />
        </div>
      </fieldset>
      <fieldset disabled={busy} className="min-w-0 border p-5 md:p-8">
        <legend className="px-2 font-display text-xl">{t("documents.title")}</legend>
        <p id="document-hint" className="mb-4 text-sm text-muted-foreground">
          {t("documents.help")}
        </p>
        <Label htmlFor="application-document">{t("documents.label")}</Label>
        <input
          id="application-document"
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="mt-2 block min-h-11 w-full min-w-0 max-w-full text-sm file:me-3 file:min-h-11 file:cursor-pointer file:border file:bg-background file:px-3"
          aria-describedby="document-hint"
          onChange={(e) => {
            void uploadFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {upload.isPending && <p role="status">{t("documents.uploading")}</p>}
        <ul className="mt-3 space-y-2 text-sm" aria-live="polite">
          {documents.map((doc) => (
            <li key={doc.documentId} className="break-all">
              {doc.originalName} — {t("documents.uploaded")}
            </li>
          ))}
        </ul>
      </fieldset>
      <div>
        <label
          className="flex min-h-11 cursor-pointer items-center gap-3"
          htmlFor="termsAccepted"
        >
          <input
            id="termsAccepted"
            type="checkbox"
            {...form.register("termsAccepted")}
            disabled={busy}
            className="size-5 shrink-0"
          />
          {t("terms")}
        </label>
        <Link
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          {t("readTerms")}
        </Link>
        {fieldError("termsAccepted")}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className={linkClass}>
          {t("actions.cancel")}
        </Link>
        <Button type="submit" disabled={busy} className="min-h-11">
          {busy ? t("actions.submitting") : t("actions.submit")}
        </Button>
      </div>
    </form>
  );
}
