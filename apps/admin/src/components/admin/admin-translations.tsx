"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAdminAccess } from "@/hooks/use-admin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge, Button, Card } from "./polaris";

type Level = "ok" | "warn" | "fail";
interface Check {
  level: Level;
  message: string;
}
interface FieldRow {
  field: string;
  source: string;
  liveEn: string;
  liveAr: string;
  draftEn: string;
  draftAr: string;
  enChecks: Check[];
  arChecks: Check[];
}
interface Item {
  id: string;
  slug: string;
  name: string;
  visibility: string;
  enStatus: string;
  arStatus: string;
  level: Level;
  fields: FieldRow[];
}
interface Preview {
  total: number;
  pending: { en: number; ar: number };
  items: Item[];
}
interface Batch {
  id: string;
  by: string;
  at: string;
  langs: string[];
  products: number;
  fields: number;
  rolledBackAt: string | null;
}

const FIELD: Record<string, string> = {
  accroche: "Tagline",
  details: "Details",
  texture: "Texture",
  results: "Results",
  howToUse: "How to use",
};
const TONE: Record<Level, "success" | "warning" | "critical"> = {
  ok: "success",
  warn: "warning",
  fail: "critical",
};
const LEVEL_LABEL: Record<Level, string> = {
  ok: "Checks passed",
  warn: "Check warnings",
  fail: "Verification failed",
};

function Checks({ checks }: { checks: Check[] }) {
  if (!checks.length)
    return (
      <p className="pl-help !mt-1" style={{ color: "#198038" }}>
        Checks passed
      </p>
    );
  return (
    <ul className="mt-1 space-y-0.5">
      {checks.map((c, i) => (
        <li
          key={i}
          className="text-[12px]"
          style={{
            color: c.level === "fail" ? "var(--pl-critical, #da1e28)" : "#8e6a00",
          }}
        >
          {c.level === "fail" ? "✕" : "!"} {c.message}
        </li>
      ))}
    </ul>
  );
}

/** Review and publish translation drafts: original, English and Arabic side by side, with verification. */
export function AdminTranslations() {
  const access = useAdminAccess();
  const manage = !!access.data?.permissions.includes("commerce.manage");
  const qc = useQueryClient();
  const preview = useQuery({
    queryKey: ["admin", "translations-bulk"],
    queryFn: () => apiFetch<Preview>("/catalog-sync/translations/bulk/preview"),
    retry: false,
  });
  const batches = useQuery({
    queryKey: ["admin", "translations-batches"],
    queryFn: () => apiFetch<Batch[]>("/catalog-sync/translations/bulk/batches"),
    retry: false,
  });
  const [filter, setFilter] = useState<"pending" | "clean" | "attention" | "done">(
    "pending",
  );
  const [open, setOpen] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [langs, setLangs] = useState<{ en: boolean; ar: boolean }>({
    en: true,
    ar: true,
  });
  const [includeFailed, setIncludeFailed] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [rollbackId, setRollbackId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const items = preview.data?.items ?? [];
  const shown = useMemo(
    () =>
      items.filter((i) => {
        const pending = i.enStatus === "draft" || i.arStatus === "draft";
        if (filter === "pending") return pending;
        if (filter === "clean") return pending && i.level === "ok";
        if (filter === "attention") return pending && i.level !== "ok";
        return !pending;
      }),
    [items, filter],
  );

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const approve = useMutation({
    mutationFn: () =>
      apiFetch<{
        approved: number;
        fields: number;
        batchId: string | null;
        skipped: { slug: string; reason: string }[];
      }>("/catalog-sync/translations/bulk/approve", {
        method: "POST",
        body: JSON.stringify({
          productIds: [...selected],
          langs: (["en", "ar"] as const).filter((l) => langs[l]),
          includeFailed,
        }),
      }),
    onSuccess: async (r) => {
      await qc.invalidateQueries({ queryKey: ["admin"] });
      await qc.invalidateQueries({ queryKey: ["catalog-sync"] });
      setConfirm(false);
      setSelected(new Set());
      setMessage({
        ok: r.approved > 0,
        text:
          `${r.approved} product${r.approved === 1 ? "" : "s"} published (${r.fields ?? 0} texts).` +
          (r.skipped.length
            ? ` Skipped: ${r.skipped.map((s) => `${s.slug} (${s.reason})`).join("; ")}`
            : ""),
      });
    },
    onError: () => {
      setConfirm(false);
      setMessage({ ok: false, text: "Nothing was published. Please try again." });
    },
  });
  const rollback = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ restored: number; leftAsEdited: string[] }>(
        `/catalog-sync/translations/bulk/rollback/${id}`,
        { method: "POST" },
      ),
    onSuccess: async (r) => {
      await qc.invalidateQueries({ queryKey: ["admin"] });
      await qc.invalidateQueries({ queryKey: ["catalog-sync"] });
      setRollbackId(null);
      setMessage({
        ok: true,
        text:
          `${r.restored} texts restored to what was live before.` +
          (r.leftAsEdited.length
            ? ` ${r.leftAsEdited.length} were edited by hand since and were left as they are.`
            : ""),
      });
    },
    onError: () => {
      setRollbackId(null);
      setMessage({ ok: false, text: "The rollback failed. Nothing was changed." });
    },
  });

  const chosen = items.filter((i) => selected.has(i.id));
  const chosenFailed = chosen.filter((i) => i.level === "fail").length;
  const canApprove = manage && chosen.length > 0 && (langs.en || langs.ar);

  return (
    <div className="mx-auto max-w-[1180px] space-y-4">
      <div className="min-w-0">
        <h1 className="pl-page-title">Translations</h1>
        <p className="pl-help !mt-0">
          Check the English and Arabic drafts against the original, then publish the ones
          you select. Nothing goes live until you approve it, and every approval can be
          rolled back.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <div className="p-4">
            <p className="pl-help !mt-0">English drafts waiting</p>
            <p className="text-2xl font-semibold">
              {preview.data ? preview.data.pending.en : "…"}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="pl-help !mt-0">Arabic drafts waiting</p>
            <p className="text-2xl font-semibold">
              {preview.data ? preview.data.pending.ar : "…"}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="pl-help !mt-0">Selected</p>
            <p className="text-2xl font-semibold">{selected.size}</p>
          </div>
        </Card>
      </div>

      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className="rounded border p-3 text-[13px]"
          style={{ color: message.ok ? "#198038" : "var(--pl-critical, #da1e28)" }}
        >
          {message.text}
        </p>
      )}

      <Card flush>
        <div
          className="flex flex-wrap items-center gap-2 border-b p-3"
          role="tablist"
          aria-label="Filter"
        >
          {(
            [
              ["pending", "Waiting"],
              ["clean", "Checks passed"],
              ["attention", "Needs attention"],
              ["done", "Already published"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={filter === v}
              className={`pl-btn pl-btn--sm ${filter === v ? "pl-btn--primary" : ""}`}
              onClick={() => setFilter(v)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b p-3 text-[13px]">
          <Button
            small
            onClick={() =>
              setSelected(new Set(shown.filter((i) => i.level === "ok").map((i) => i.id)))
            }
          >
            Select all with passed checks
          </Button>
          <Button small onClick={() => setSelected(new Set(shown.map((i) => i.id)))}>
            Select all shown
          </Button>
          <Button small onClick={() => setSelected(new Set())}>
            Clear
          </Button>
          <span className="ms-auto flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={langs.en}
                onChange={(e) => setLangs((l) => ({ ...l, en: e.target.checked }))}
              />
              English
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={langs.ar}
                onChange={(e) => setLangs((l) => ({ ...l, ar: e.target.checked }))}
              />
              Arabic
            </label>
            <Button
              variant="primary"
              disabled={!canApprove}
              onClick={() => setConfirm(true)}
            >
              Approve selected ({chosen.length})
            </Button>
          </span>
        </div>

        {preview.isError ? (
          <p role="alert" className="p-4" style={{ color: "var(--pl-critical)" }}>
            The drafts could not be loaded. Please refresh.
          </p>
        ) : preview.isLoading ? (
          <p className="pl-help p-4">Loading&hellip;</p>
        ) : shown.length === 0 ? (
          <p className="pl-help p-6 text-center">Nothing here.</p>
        ) : (
          <ul>
            {shown.map((i) => (
              <li key={i.id} className="border-b last:border-b-0">
                <div className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                  <input
                    type="checkbox"
                    aria-label={`Select ${i.name}`}
                    checked={selected.has(i.id)}
                    onChange={() => toggle(i.id)}
                  />
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-start"
                    aria-expanded={open === i.id}
                    onClick={() => setOpen(open === i.id ? null : i.id)}
                  >
                    {open === i.id ? (
                      <ChevronDown className="size-4 shrink-0" aria-hidden />
                    ) : (
                      <ChevronRight className="size-4 shrink-0" aria-hidden />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-medium">
                        {i.name}
                      </span>
                      <span className="pl-help !mt-0 block">
                        {i.fields.length} texts &middot; EN{" "}
                        {i.enStatus === "draft" ? "waiting" : i.enStatus} &middot; AR{" "}
                        {i.arStatus === "draft" ? "waiting" : i.arStatus}
                      </span>
                    </span>
                  </button>
                  <Badge tone={TONE[i.level]}>{LEVEL_LABEL[i.level]}</Badge>
                </div>
                {open === i.id && (
                  <div className="space-y-4 bg-neutral-50 px-3 py-4">
                    {i.fields.map((f) => (
                      <div key={f.field} className="rounded border bg-white p-3">
                        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-neutral-600">
                          {FIELD[f.field] ?? f.field}
                        </p>
                        <div className="grid gap-3 lg:grid-cols-3">
                          <div className="min-w-0">
                            <p className="pl-help !mt-0">Original (French)</p>
                            <p className="whitespace-pre-line break-words text-[13px] leading-relaxed">
                              {f.source}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="pl-help !mt-0">English draft</p>
                            <p className="whitespace-pre-line break-words text-[13px] leading-relaxed">
                              {f.draftEn || "—"}
                            </p>
                            {f.draftEn && <Checks checks={f.enChecks} />}
                          </div>
                          <div className="min-w-0" dir="rtl">
                            <p className="pl-help !mt-0" dir="ltr">
                              Arabic draft
                            </p>
                            <p className="whitespace-pre-line break-words text-[13px] leading-relaxed">
                              {f.draftAr || "—"}
                            </p>
                            <div dir="ltr">
                              {f.draftAr && <Checks checks={f.arChecks} />}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <p className="pl-help">
                      To change a translation before publishing, edit it in the product
                      (More options &rarr; Translation review).
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Publishing history and rollback">
        <div className="p-4">
          {batches.data && batches.data.length === 0 ? (
            <p className="pl-help !mt-0">Nothing has been published in bulk yet.</p>
          ) : (
            <ul className="divide-y">
              {batches.data?.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center gap-3 py-2.5 text-[13px]"
                >
                  <span className="min-w-0 flex-1">
                    {new Date(b.at).toLocaleString()} &middot; {b.by}
                    <span className="pl-help !mt-0 block">
                      {b.products} products, {b.fields} texts &middot;{" "}
                      {b.langs.join(" + ").toUpperCase()}
                    </span>
                  </span>
                  {b.rolledBackAt ? (
                    <Badge>Rolled back</Badge>
                  ) : (
                    manage && (
                      <Button small onClick={() => setRollbackId(b.id)}>
                        Roll back
                      </Button>
                    )
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogTitle>
            Publish {chosen.length} product{chosen.length === 1 ? "" : "s"}?
          </DialogTitle>
          <DialogDescription>
            The selected{" "}
            {[langs.en && "English", langs.ar && "Arabic"].filter(Boolean).join(" and ")}{" "}
            drafts replace the text customers see. The French original is kept. You can
            roll this publication back from the history below.
          </DialogDescription>
          {chosenFailed > 0 && (
            <div
              className="rounded border p-3 text-[13px]"
              style={{ borderColor: "#da1e28" }}
            >
              <p>
                {chosenFailed} selected product{chosenFailed === 1 ? " has" : "s have"}{" "}
                failed verification (a figure, an official name or the language does not
                match).
              </p>
              <label className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeFailed}
                  onChange={(e) => setIncludeFailed(e.target.checked)}
                />
                Publish them anyway (I checked them)
              </label>
              {!includeFailed && <p className="pl-help">Otherwise they are skipped.</p>}
            </div>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => setConfirm(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={approve.isPending}
              onClick={() => approve.mutate()}
            >
              {approve.isPending ? "Publishing…" : "Publish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rollbackId} onOpenChange={(o) => !o && setRollbackId(null)}>
        <DialogContent>
          <DialogTitle>Roll back this publication?</DialogTitle>
          <DialogDescription>
            The text that was live before this batch is restored and the drafts return to
            &ldquo;waiting&rdquo;. Anything you edited by hand since is not touched.
          </DialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => setRollbackId(null)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={rollback.isPending}
              onClick={() => rollbackId && rollback.mutate(rollbackId)}
            >
              {rollback.isPending ? "Restoring…" : "Roll back"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
