"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileJson,
  History,
  RefreshCw,
  Undo2,
  UploadCloud,
} from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge, Button, Card, Checkbox, DataTable, Select } from "./polaris";
import { AdminEmpty, AdminQueryState } from "./admin-ui";

/* ----------------------------- API types ----------------------------- */
type Action = "create" | "update" | "conflict" | "unchanged" | "missing_from_source";
type Owner = "source" | "local" | "mixed";
interface Change {
  field: string;
  owner: Owner;
  important: boolean;
  kind: "update" | "conflict" | "diverged";
  local: unknown;
  source: unknown;
}
interface Item {
  externalId: string;
  handle: string;
  title: string;
  action: Action;
  productId: string | null;
  changes: Change[];
  variantsToAdd: { externalId: string; sku: string; title: string; options: string[] }[];
  missingVariants: string[];
  newImages: number;
  hasImportant: boolean;
  duplicateOf?: string;
  sourceUpdatedAt: string | null;
  variantCount: number;
  imageCount: number;
  applied?: {
    at: string;
    fields: string[];
    createdProductId?: string;
    createdVariantIds: string[];
    imagesAdded: number;
    imageErrors: string[];
    rolledBack?: boolean;
  };
  error?: string;
}
interface Run {
  id: string;
  origin: "file" | "live";
  status: string;
  counts: Record<string, number>;
  issues: { index: number; handle?: string; message: string }[];
  note: string | null;
  actorEmail: string | null;
  createdAt: string | null;
  items: Item[];
  fullCatalogue: boolean;
}
interface Overview {
  source: {
    system: string;
    origin: string;
    mode: string;
    scheduled: boolean;
    note: string;
  };
  lastRun: {
    id: string;
    status: string;
    origin: string;
    counts: Record<string, number>;
    at: string | null;
  } | null;
  lastApplied: { id: string; at: string | null } | null;
  catalogue: { total: number; linkedToSource: number; manual: number; conflicts: number };
  ownership: { field: string; owner: Owner; important: boolean; note: string }[];
}
interface HistoryRow {
  id: string;
  origin: string;
  status: string;
  counts: Record<string, number>;
  actorEmail: string | null;
  createdAt: string | null;
  note: string | null;
}
interface RangeOpt {
  id: string;
  slug: string;
  name: { en: string };
}
interface Choice {
  fields: Record<string, "source" | "local">;
  rangeId?: string;
  approveImportant?: boolean;
  downloadImages?: boolean;
}

const ACTION_LABEL: Record<Action, string> = {
  create: "New",
  update: "Update",
  conflict: "Conflict",
  unchanged: "Unchanged",
  missing_from_source: "Missing from source",
};
const ACTION_TONE: Record<Action, "success" | "neutral" | "warning" | "critical"> = {
  create: "success",
  update: "warning",
  conflict: "critical",
  unchanged: "neutral",
  missing_from_source: "neutral",
};
const KIND_LABEL = {
  update: "Source changed",
  conflict: "Conflict",
  diverged: "Differs (first sync)",
} as const;
const OWNER_LABEL: Record<Owner, string> = {
  source: "Source",
  local: "Dubai",
  mixed: "Mixed",
};
const show = (v: unknown) =>
  Array.isArray(v)
    ? v.join(", ") || "—"
    : v === "" || v === null || v === undefined
      ? "—"
      : String(v);
const when = (v: string | null) =>
  v
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Dubai",
      }).format(new Date(v))
    : "—";
const errorText = (e: unknown) =>
  e instanceof ApiError ? e.message : "Something went wrong. Please try again.";

const OVERVIEW = ["admin", "sync", "overview"];
const HISTORY = ["admin", "sync", "history"];

export function AdminImportCenter() {
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [filter, setFilter] = useState<Action | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const [open, setOpen] = useState<Item | null>(null);
  const [full, setFull] = useState(false);
  const [autoPublish, setAutoPublish] = useState(false);
  const [confirm, setConfirm] = useState<"apply" | "rollback" | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null,
  );

  const overview = useQuery({
    queryKey: OVERVIEW,
    queryFn: () => apiFetch<Overview>("/catalog-sync/overview"),
  });
  const history = useQuery({
    queryKey: HISTORY,
    queryFn: () => apiFetch<HistoryRow[]>("/catalog-sync/runs?limit=15"),
  });
  const ranges = useQuery({
    queryKey: ["admin", "sync", "ranges"],
    queryFn: () => apiFetch<RangeOpt[]>("/catalog-sync/ranges"),
  });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: OVERVIEW });
    void qc.invalidateQueries({ queryKey: HISTORY });
  };

  const startRun = (r: Run) => {
    setRun(r);
    setSelected(
      new Set(
        r.items
          .filter((i) => i.action === "create" || i.action === "update")
          .map((i) => i.externalId),
      ),
    );
    setChoices({});
    setFilter("all");
  };

  const preview = useMutation({
    mutationFn: (body: { mode: "file" | "live"; json?: unknown }) =>
      apiFetch<Run>("/catalog-sync/preview", {
        method: "POST",
        body: JSON.stringify({ ...body, full }),
      }),
    onSuccess: (r) => {
      startRun(r);
      setNotice(r.note ? { kind: "error", text: r.note } : null);
      refresh();
    },
    onError: (e) => setNotice({ kind: "error", text: errorText(e) }),
  });

  const apply = useMutation({
    mutationFn: (ids: string[]) =>
      apiFetch<{
        run: Run;
        results: {
          externalId: string;
          handle: string;
          outcome: string;
          message?: string;
        }[];
      }>(`/catalog-sync/runs/${run!.id}/apply`, {
        method: "POST",
        body: JSON.stringify({ items: ids, choices, autoPublish }),
      }),
    onSuccess: ({ run: r, results }) => {
      setRun(r);
      setConfirm(null);
      const ok = results.filter((x) => x.outcome === "applied").length;
      const bad = results.filter((x) => x.outcome === "error").length;
      setNotice({
        kind: bad ? "error" : "ok",
        text: `${ok} applied${bad ? `, ${bad} could not be applied (see the rows marked in red).` : "."}`,
      });
      refresh();
    },
    onError: (e) => {
      setConfirm(null);
      setNotice({ kind: "error", text: errorText(e) });
    },
  });

  const rollback = useMutation({
    mutationFn: () =>
      apiFetch<{ restored: number }>(`/catalog-sync/runs/${run!.id}/rollback`, {
        method: "POST",
      }),
    onSuccess: async (r) => {
      setConfirm(null);
      setNotice({ kind: "ok", text: `Rolled back ${r.restored} product(s).` });
      setRun(await apiFetch<Run>(`/catalog-sync/runs/${run!.id}`));
      refresh();
    },
    onError: (e) => {
      setConfirm(null);
      setNotice({ kind: "error", text: errorText(e) });
    },
  });

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024)
      return setNotice({ kind: "error", text: "The file is larger than 25 MB." });
    try {
      preview.mutate({ mode: "file", json: JSON.parse(await file.text()) });
    } catch {
      setNotice({ kind: "error", text: "That file is not valid JSON." });
    }
    if (fileInput.current) fileInput.current.value = "";
  };

  const downloadReport = async (id: string) => {
    const token = useAuthStore.getState().accessToken;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/catalog-sync/runs/${id}/report.csv`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );
    if (!res.ok)
      return setNotice({ kind: "error", text: "The report could not be downloaded." });
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = `ioma-import-${id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const rows = useMemo(
    () => (run?.items ?? []).filter((i) => filter === "all" || i.action === filter),
    [run, filter],
  );
  const picked = (run?.items ?? []).filter((i) => selected.has(i.externalId));
  const needsRange = picked.filter(
    (i) => i.action === "create" && !choices[i.externalId]?.rangeId,
  );
  const needsApproval = picked.filter(
    (i) => i.hasImportant && !choices[i.externalId]?.approveImportant,
  );
  const failed = (run?.items ?? []).filter((i) => i.error);
  const canRollback = run && ["applied", "partially_applied"].includes(run.status);
  const setChoice = (id: string, patch: Partial<Choice>) =>
    setChoices((c) => ({ ...c, [id]: { fields: {}, ...c[id], ...patch } }));
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div className="space-y-5">
      <div>
        <p className="pl-help !mt-0">Catalogue</p>
        <h1 className="pl-page-title">Product import center</h1>
        <p className="pl-help">
          Bring products from the IOMA Paris catalogue into Dubai. Nothing changes until
          you review the differences and apply them. AED prices, professional prices,
          stock, publication and SEO are never overwritten.
        </p>
      </div>

      {notice && (
        <div
          role={notice.kind === "error" ? "alert" : "status"}
          className="pl-card"
          style={{
            boxShadow: `0 0 0 1px var(--pl-${notice.kind === "error" ? "critical" : "success"})`,
          }}
        >
          <p>{notice.text}</p>
        </div>
      )}

      {/* Source connection and catalogue state */}
      <AdminQueryState query={overview}>
        {overview.data && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card title="Source connection">
              <p>
                <Badge tone="neutral">Manual only</Badge>{" "}
                <span className="pl-help">{overview.data.source.origin}</span>
              </p>
              <p className="pl-help">{overview.data.source.note}</p>
              <p className="pl-help">
                Last run:{" "}
                {overview.data.lastRun
                  ? `${overview.data.lastRun.status} · ${when(overview.data.lastRun.at)}`
                  : "none yet"}
              </p>
              <p className="pl-help">
                Last applied import:{" "}
                {overview.data.lastApplied
                  ? when(overview.data.lastApplied.at)
                  : "none yet"}
              </p>
            </Card>
            <Card title="Catalogue">
              <dl className="grid grid-cols-2 gap-3">
                {[
                  ["Products", overview.data.catalogue.total],
                  ["Linked to source", overview.data.catalogue.linkedToSource],
                  ["Created manually", overview.data.catalogue.manual],
                  ["Sync conflicts", overview.data.catalogue.conflicts],
                ].map(([l, v]) => (
                  <div key={String(l)}>
                    <dt className="pl-help !mt-0">{l}</dt>
                    <dd className="text-xl font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
            <Card title="Start an import">
              <div className="space-y-3">
                <input
                  ref={fileInput}
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  aria-label="Choose a products JSON file"
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
                <Button
                  variant="primary"
                  disabled={preview.isPending}
                  onClick={() => fileInput.current?.click()}
                >
                  <UploadCloud size={14} aria-hidden /> Preview from a JSON file
                </Button>
                <Button
                  disabled={preview.isPending}
                  onClick={() => preview.mutate({ mode: "live" })}
                >
                  <RefreshCw size={14} aria-hidden /> Preview from ioma-paris.com
                </Button>
                <Checkbox
                  checked={full}
                  onChange={(e) => setFull(e.target.checked)}
                  label="This is the full catalogue (flag local products missing from it)"
                />
                {preview.isPending && (
                  <p className="pl-help" role="status">
                    Reading the catalogue…
                  </p>
                )}
              </div>
            </Card>
          </div>
        )}
      </AdminQueryState>

      {/* Preview */}
      {run && (
        <Card
          title={
            <span>
              Preview{" "}
              <Badge tone="neutral">
                {run.origin === "live" ? "ioma-paris.com" : "JSON file"}
              </Badge>{" "}
              <Badge
                tone={
                  run.status === "applied"
                    ? "success"
                    : run.status === "rolled_back"
                      ? "warning"
                      : "neutral"
                }
              >
                {run.status.replace("_", " ")}
              </Badge>
            </span>
          }
          action={
            <span className="flex gap-2">
              <Button small onClick={() => downloadReport(run.id)}>
                <Download size={13} aria-hidden /> Export report
              </Button>
              {canRollback && (
                <Button
                  small
                  variant="destructive"
                  onClick={() => setConfirm("rollback")}
                >
                  <Undo2 size={13} aria-hidden /> Roll back
                </Button>
              )}
            </span>
          }
        >
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            {(
              [
                ["Discovered", run.counts.discovered],
                ["New", run.counts.create],
                ["Updated", run.counts.update],
                ["Conflicts", run.counts.conflict],
                ["Unchanged", run.counts.unchanged],
                ["Errors", run.issues.length],
              ] as const
            ).map(([l, v]) => (
              <div key={l}>
                <p className="pl-help !mt-0">{l}</p>
                <p className="text-lg font-semibold">{v ?? 0}</p>
              </div>
            ))}
          </div>

          {run.issues.length > 0 && (
            <div
              role="alert"
              className="mt-4 rounded p-3"
              style={{ boxShadow: "0 0 0 1px var(--pl-critical)" }}
            >
              <p className="font-semibold">
                <AlertTriangle size={14} className="inline" aria-hidden />{" "}
                {run.issues.length} row(s) in the file could not be read
              </p>
              <ul className="pl-help">
                {run.issues.slice(0, 6).map((e, i) => (
                  <li key={i}>
                    Row {e.index + 1}
                    {e.handle ? ` (${e.handle})` : ""}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(
              [
                "all",
                "create",
                "update",
                "conflict",
                "unchanged",
                "missing_from_source",
              ] as const
            ).map((f) => (
              <Button
                key={f}
                small
                variant={filter === f ? "primary" : "secondary"}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "All" : ACTION_LABEL[f]}{" "}
                {f === "all"
                  ? run.items.length
                  : run.items.filter((i) => i.action === f).length}
              </Button>
            ))}
          </div>

          <div className="mt-3">
            {rows.length === 0 ? (
              <AdminEmpty text="No products in this view." />
            ) : (
              <DataTable
                minWidth={900}
                columns={[
                  { key: "s", label: "", width: "40px" },
                  { key: "p", label: "Product" },
                  { key: "a", label: "Status" },
                  { key: "c", label: "Changes" },
                  { key: "v", label: "Variants to add" },
                  { key: "i", label: "New images" },
                  { key: "r", label: "Result" },
                  { key: "d", label: "" },
                ]}
              >
                {rows.map((i) => {
                  const actionable =
                    i.action === "create" ||
                    i.action === "update" ||
                    i.action === "conflict";
                  return (
                    <tr key={i.externalId}>
                      <td>
                        {actionable && (
                          <Checkbox
                            checked={selected.has(i.externalId)}
                            onChange={() => toggle(i.externalId)}
                            label={<span className="sr-only">Select {i.title}</span>}
                          />
                        )}
                      </td>
                      <td>
                        <strong>{i.title}</strong>
                        <br />
                        <span className="pl-help !mt-0">{i.handle}</span>
                      </td>
                      <td>
                        <Badge tone={ACTION_TONE[i.action]}>
                          {ACTION_LABEL[i.action]}
                        </Badge>
                        {i.hasImportant && actionable && (
                          <>
                            {" "}
                            <Badge tone="warning">Needs approval</Badge>
                          </>
                        )}
                      </td>
                      <td>{i.changes.length || "—"}</td>
                      <td>{i.variantsToAdd.length || "—"}</td>
                      <td>{i.newImages || "—"}</td>
                      <td>
                        {i.error ? (
                          <Badge tone="critical">{i.error}</Badge>
                        ) : i.applied && !i.applied.rolledBack ? (
                          <Badge tone="success" icon={<CheckCircle2 size={12} />}>
                            Applied
                          </Badge>
                        ) : i.applied?.rolledBack ? (
                          <Badge>Rolled back</Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <Button small onClick={() => setOpen(i)}>
                          View differences
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </DataTable>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Checkbox
              checked={autoPublish}
              onChange={(e) => setAutoPublish(e.target.checked)}
              label="Publish new products immediately (off: they arrive as drafts)"
            />
            <Button
              variant="primary"
              disabled={!picked.length || apply.isPending}
              onClick={() => setConfirm("apply")}
            >
              Import selected ({picked.length})
            </Button>
            {failed.length > 0 && (
              <Button
                disabled={apply.isPending}
                onClick={() => apply.mutate(failed.map((i) => i.externalId))}
              >
                Retry failed ({failed.length})
              </Button>
            )}
            {needsRange.length > 0 && (
              <span className="pl-help">
                {needsRange.length} new product(s) need a range: open “View differences”.
              </span>
            )}
          </div>
        </Card>
      )}

      {/* History */}
      <Card
        title={
          <span>
            <History size={14} className="inline" aria-hidden /> Import history
          </span>
        }
      >
        <AdminQueryState query={history}>
          {!history.data?.length ? (
            <AdminEmpty text="No imports yet." />
          ) : (
            <DataTable
              minWidth={720}
              columns={[
                { key: "w", label: "When" },
                { key: "o", label: "Source" },
                { key: "s", label: "Status" },
                { key: "c", label: "Result" },
                { key: "u", label: "By" },
                { key: "x", label: "" },
              ]}
            >
              {history.data.map((h) => (
                <tr key={h.id}>
                  <td>{when(h.createdAt)}</td>
                  <td>{h.origin === "live" ? "ioma-paris.com" : "JSON file"}</td>
                  <td>
                    <Badge
                      tone={
                        h.status === "applied"
                          ? "success"
                          : h.status === "failed"
                            ? "critical"
                            : "neutral"
                      }
                    >
                      {h.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="pl-help !mt-0">
                    {h.counts.create ?? 0} new · {h.counts.update ?? 0} updated ·{" "}
                    {h.counts.conflict ?? 0} conflicts · {h.counts.applied ?? 0} applied
                  </td>
                  <td>{h.actorEmail ?? "—"}</td>
                  <td>
                    <Button
                      small
                      onClick={async () =>
                        startRun(await apiFetch<Run>(`/catalog-sync/runs/${h.id}`))
                      }
                    >
                      Open
                    </Button>{" "}
                    <Button small onClick={() => downloadReport(h.id)}>
                      Report
                    </Button>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </AdminQueryState>
      </Card>

      {/* Ownership matrix */}
      {overview.data && (
        <Card
          title={
            <span>
              <FileJson size={14} className="inline" aria-hidden /> Who owns each field
            </span>
          }
        >
          <p className="pl-help !mt-0">
            Source = may be updated from IOMA Paris. Dubai = never touched by a sync.
            Mixed = the source gives the first value, a local edit then wins and later
            source changes become conflicts.
          </p>
          <DataTable
            minWidth={680}
            columns={[
              { key: "f", label: "Field" },
              { key: "o", label: "Owner" },
              { key: "i", label: "Approval" },
              { key: "n", label: "Note" },
            ]}
          >
            {overview.data.ownership.map((o) => (
              <tr key={o.field}>
                <td>{o.field}</td>
                <td>
                  <Badge
                    tone={
                      o.owner === "local"
                        ? "neutral"
                        : o.owner === "source"
                          ? "warning"
                          : "success"
                    }
                  >
                    {OWNER_LABEL[o.owner]}
                  </Badge>
                </td>
                <td>{o.important ? "Required" : "—"}</td>
                <td className="pl-help !mt-0">{o.note}</td>
              </tr>
            ))}
          </DataTable>
        </Card>
      )}

      {/* Differences drawer */}
      <Sheet
        open={!!open}
        onOpenChange={(v) => {
          if (!v) setOpen(null);
        }}
      >
        <SheetContent side="right" className="w-full max-w-2xl overflow-y-auto">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle>{open.title}</SheetTitle>
                <SheetDescription>
                  {open.handle} ·{" "}
                  <Badge tone={ACTION_TONE[open.action]}>
                    {ACTION_LABEL[open.action]}
                  </Badge>{" "}
                  · source updated{" "}
                  {open.sourceUpdatedAt ? when(open.sourceUpdatedAt) : "—"}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 p-4">
                {open.action === "create" && (
                  <Card title="New product">
                    <p className="pl-help !mt-0">
                      Created as a draft, unpriced (AED price 0) and marked pending for
                      the UAE. English and Arabic start as the French text and count as
                      untranslated.
                    </p>
                    <label className="pl-label" htmlFor="sync-range">
                      IOMA range
                    </label>
                    <Select
                      id="sync-range"
                      value={choices[open.externalId]?.rangeId ?? ""}
                      onChange={(e) =>
                        setChoice(open.externalId, {
                          rangeId: e.target.value || undefined,
                        })
                      }
                    >
                      <option value="">Choose a range…</option>
                      {ranges.data?.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name.en}
                        </option>
                      ))}
                    </Select>
                  </Card>
                )}
                {open.changes.length > 0 && (
                  <Card title="Field differences" flush>
                    <DataTable
                      minWidth={560}
                      columns={[
                        { key: "f", label: "Field" },
                        { key: "l", label: "Dubai now" },
                        { key: "s", label: "Source" },
                        { key: "k", label: "Use" },
                      ]}
                    >
                      {open.changes.map((c) => {
                        const choice =
                          choices[open.externalId]?.fields[c.field] ??
                          (c.kind === "update" ? "source" : "local");
                        return (
                          <tr key={c.field}>
                            <td>
                              <strong>{c.field}</strong>
                              <br />
                              <Badge
                                tone={
                                  c.kind === "conflict"
                                    ? "critical"
                                    : c.kind === "update"
                                      ? "warning"
                                      : "neutral"
                                }
                              >
                                {KIND_LABEL[c.kind]}
                              </Badge>
                            </td>
                            <td className="pl-help !mt-0">{show(c.local)}</td>
                            <td className="pl-help !mt-0">{show(c.source)}</td>
                            <td>
                              <Select
                                aria-label={`Value to keep for ${c.field}`}
                                value={choice}
                                onChange={(e) =>
                                  setChoice(open.externalId, {
                                    fields: {
                                      ...(choices[open.externalId]?.fields ?? {}),
                                      [c.field]: e.target.value as "source" | "local",
                                    },
                                  })
                                }
                              >
                                <option value="local">Keep Dubai</option>
                                <option value="source">Use source</option>
                              </Select>
                            </td>
                          </tr>
                        );
                      })}
                    </DataTable>
                  </Card>
                )}
                {open.variantsToAdd.length > 0 && (
                  <Card title={`Variants to add (${open.variantsToAdd.length})`}>
                    <p className="pl-help !mt-0">
                      Added unpriced with no stock. Price and stock stay yours to set.
                    </p>
                    <ul>
                      {open.variantsToAdd.map((v) => (
                        <li key={v.sku}>
                          <code>{v.sku}</code> {v.options.join(" / ") || v.title}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
                {open.missingVariants.length > 0 && (
                  <Card
                    title={`Not in the source anymore (${open.missingVariants.length})`}
                  >
                    <p className="pl-help !mt-0">Flagged only. Nothing is removed.</p>
                    <ul>
                      {open.missingVariants.map((s) => (
                        <li key={s}>
                          <code>{s}</code>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
                {open.newImages > 0 && (
                  <Card title={`New source images (${open.newImages})`}>
                    <Checkbox
                      checked={!!choices[open.externalId]?.downloadImages}
                      onChange={(e) =>
                        setChoice(open.externalId, { downloadImages: e.target.checked })
                      }
                      label="Download them into the media library when importing"
                    />
                  </Card>
                )}
                {open.changes.length === 0 &&
                  !open.variantsToAdd.length &&
                  !open.newImages &&
                  open.action !== "create" && <AdminEmpty text="No differences." />}
                {(open.action === "create" ||
                  open.action === "update" ||
                  open.action === "conflict") &&
                  open.hasImportant && (
                    <Checkbox
                      checked={!!choices[open.externalId]?.approveImportant}
                      onChange={(e) =>
                        setChoice(open.externalId, { approveImportant: e.target.checked })
                      }
                      label="I reviewed these changes and approve them (name, type, variants or images are affected)"
                    />
                  )}
                {open.error && (
                  <p role="alert" className="pl-error">
                    {open.error}
                  </p>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirmation */}
      <Sheet
        open={confirm !== null}
        onOpenChange={(v) => {
          if (!v) setConfirm(null);
        }}
      >
        <SheetContent side="right" className="w-full max-w-md">
          <SheetHeader>
            <SheetTitle>
              {confirm === "rollback"
                ? "Roll back this import?"
                : `Import ${picked.length} product(s)?`}
            </SheetTitle>
            <SheetDescription>
              {confirm === "rollback"
                ? "Restores the fields this import changed, archives products it created and removes variants it added (only those with no stock)."
                : "Only the checked items are applied. Prices, stock, visibility and SEO are not touched."}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-3 p-4">
            {confirm === "apply" && (
              <>
                <p>
                  {picked.filter((i) => i.action === "create").length} new ·{" "}
                  {picked.filter((i) => i.action !== "create").length} updated
                </p>
                {autoPublish && (
                  <p role="alert" className="pl-error">
                    New products will be published immediately.
                  </p>
                )}
                {needsRange.length > 0 && (
                  <p role="alert" className="pl-error">
                    {needsRange.length} new product(s) still need a range.
                  </p>
                )}
                {needsApproval.length > 0 && (
                  <p role="alert" className="pl-error">
                    {needsApproval.length} item(s) still need your approval (open “View
                    differences”).
                  </p>
                )}
              </>
            )}
            <div className="flex gap-2">
              {confirm === "apply" ? (
                <Button
                  variant="primary"
                  disabled={
                    apply.isPending || needsRange.length > 0 || needsApproval.length > 0
                  }
                  onClick={() => apply.mutate(picked.map((i) => i.externalId))}
                >
                  {apply.isPending ? "Applying…" : "Apply now"}
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  disabled={rollback.isPending}
                  onClick={() => rollback.mutate()}
                >
                  {rollback.isPending ? "Rolling back…" : "Roll back"}
                </Button>
              )}
              <Button onClick={() => setConfirm(null)}>Cancel</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
