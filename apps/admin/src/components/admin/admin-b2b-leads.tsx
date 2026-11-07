"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Download,
  FileText,
  Mail,
  Paperclip,
  Phone,
  Search,
  X,
} from "lucide-react";
import { useAdminAccess } from "@/hooks/use-admin";
import { apiFetch, apiUpload } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge, Button, Card, Field, Input, Select, Textarea } from "./polaris";
import { AdminQueryState, useAdminFormat } from "./admin-ui";

type Status = "pending" | "validated" | "customer" | "rejected";
interface LeadDoc {
  documentId: string;
  kind: "trade_license" | "trn" | "other";
  originalName: string;
}
interface Lead {
  _id: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
  email: string;
  locale: string;
  status: Status;
  notes: string;
  documents: LeadDoc[];
  rejectionReason: string | null;
  profileId: string | null;
  createdAt: string;
  history: { status: string; at: string; note: string | null }[];
}
interface Contact {
  name: string;
  phone: string;
  email: string;
}

const TONE: Record<Status, "neutral" | "warning" | "success" | "critical"> = {
  pending: "warning",
  validated: "success",
  customer: "success",
  rejected: "critical",
};
const LABEL: Record<Status, string> = {
  pending: "Pending",
  validated: "Validated",
  customer: "Customer",
  rejected: "Rejected",
};
const KIND: Record<string, string> = {
  trade_license: "Trade License",
  trn: "TRN",
  other: "Other",
};

export function AdminB2bLeads() {
  const f = useAdminFormat();
  const qc = useQueryClient();
  const access = useAdminAccess();
  const manage = !!access.data?.permissions.includes("b2b.manage");
  const [tab, setTab] = useState<Status | "all">("pending");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["admin", "b2b-leads"],
    queryFn: () =>
      apiFetch<{ items: Lead[]; counts: Partial<Record<Status, number>> }>(
        "/professional/admin/leads",
      ),
  });
  const counts = list.data?.counts ?? {};
  const total = Object.values(counts).reduce((n, c) => n + (c ?? 0), 0);
  const term = search.trim().toLowerCase();
  const rows = (list.data?.items ?? []).filter(
    (l) =>
      (tab === "all" || l.status === tab) &&
      (!term ||
        `${l.firstName} ${l.lastName} ${l.companyName} ${l.email} ${l.phone}`
          .toLowerCase()
          .includes(term)),
  );
  const current = list.data?.items.find((l) => l._id === openId) ?? null;
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "b2b-leads"] });

  const [selected, setSelected] = useState<string[]>([]);
  const [bulkReason, setBulkReason] = useState<string | null>(null);
  const [bulkMsg, setBulkMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null,
  );
  const rowIds = rows.map((l) => l._id);
  const allSelected = rowIds.length > 0 && rowIds.every((id) => selected.includes(id));
  const chosen = rows.filter((l) => selected.includes(l._id));
  const pendingChosen = chosen.filter((l) => l.status === "pending");
  const validatable = pendingChosen.filter((l) =>
    l.documents.some((d) => d.kind === "trade_license"),
  );
  const changeTab = (key: Status | "all") => {
    setTab(key);
    setSelected([]);
    setBulkReason(null);
  };
  const runBulk = useMutation({
    mutationFn: async ({
      action,
      targets,
      reason,
    }: {
      action: "validate" | "reject";
      targets: Lead[];
      reason?: string;
    }) => {
      let done = 0;
      const failed: string[] = [];
      for (const l of targets) {
        try {
          await apiFetch(`/professional/admin/leads/${l._id}/${action}`, {
            method: "PATCH",
            body: JSON.stringify(action === "reject" ? { reason } : {}),
          });
          done += 1;
        } catch (e) {
          failed.push(`${l.companyName}: ${e instanceof Error ? e.message : "failed"}`);
        }
      }
      return { action, done, failed };
    },
    onSuccess: async ({ action, done, failed }) => {
      setSelected([]);
      setBulkReason(null);
      const verb = action === "validate" ? "validated" : "rejected";
      setBulkMsg(
        failed.length
          ? {
              kind: "error",
              text: `${done} ${verb}, ${failed.length} failed - ${failed[0]}`,
            }
          : { kind: "ok", text: `${done} lead${done === 1 ? "" : "s"} ${verb}.` },
      );
      await refresh();
    },
    onError: (e) =>
      setBulkMsg({
        kind: "error",
        text: e instanceof Error ? e.message : "Bulk action failed.",
      }),
  });
  const exportLeads = (items: Lead[]) => {
    if (!items.length) return;
    const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [
      ["First name", "Last name", "Company", "Email", "Phone", "Status", "Registered"]
        .map(q)
        .join(","),
      ...items.map((l) =>
        [
          l.firstName,
          l.lastName,
          l.companyName,
          l.email,
          l.phone,
          LABEL[l.status],
          new Date(l.createdAt).toISOString().slice(0, 10),
        ]
          .map((v) => q(String(v)))
          .join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `ioma_b2b_leads_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const tabs: { key: Status | "all"; label: string; count: number }[] = [
    { key: "pending", label: "Pending", count: counts.pending ?? 0 },
    { key: "validated", label: "Validated", count: counts.validated ?? 0 },
    { key: "customer", label: "Customers", count: counts.customer ?? 0 },
    { key: "rejected", label: "Rejected", count: counts.rejected ?? 0 },
    { key: "all", label: "All", count: total },
  ];

  return (
    <div className="mx-auto max-w-[1280px] space-y-4">
      <div className="min-w-0">
        <h1 className="pl-page-title">B2B leads</h1>
        <p className="pl-help !mt-0">
          Trade access requests. Call the lead, attach the Trade License and TRN, then
          validate or reject.
        </p>
      </div>

      <div className="pl-card pl-card--flush">
        <div className="pl-stats" role="tablist" aria-label="Lead status">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => changeTab(t.key)}
              className={`pl-stat ${t.key === "pending" && t.count ? "pl-stat--warning" : ""}`}
            >
              <span className="pl-stat-label">{t.label}</span>
              <span className="pl-stat-value">{t.count}</span>
            </button>
          ))}
        </div>
        {bulkMsg && (
          <div
            role={bulkMsg.kind === "error" ? "alert" : "status"}
            className="flex items-start justify-between gap-3 px-4 py-2 text-[13px]"
            style={{
              color:
                bulkMsg.kind === "error" ? "var(--pl-critical)" : "var(--pl-success)",
            }}
          >
            <span>{bulkMsg.text}</span>
            <button
              type="button"
              aria-label="Dismiss"
              className="pl-icon-btn"
              onClick={() => setBulkMsg(null)}
            >
              <X />
            </button>
          </div>
        )}
        {selected.length > 0 ? (
          <div className="pl-toolbar" role="region" aria-label="Bulk actions">
            <label className="pl-choice">
              <input
                type="checkbox"
                className="pl-check"
                aria-label="Clear selection"
                checked={allSelected}
                ref={(n) => {
                  if (n) n.indeterminate = !allSelected;
                }}
                onChange={() => setSelected([])}
              />
              <span className="font-semibold">{selected.length} selected</span>
            </label>
            {bulkReason === null ? (
              <div className="ms-auto flex flex-wrap items-center gap-2">
                <Button small onClick={() => exportLeads(chosen)}>
                  <Download /> Export selected
                </Button>
                {manage && (
                  <>
                    <Button
                      small
                      disabled={!validatable.length || runBulk.isPending}
                      onClick={() =>
                        runBulk.mutate({ action: "validate", targets: validatable })
                      }
                    >
                      Validate ({validatable.length})
                    </Button>
                    <Button
                      small
                      variant="destructive"
                      disabled={!pendingChosen.length}
                      onClick={() => setBulkReason("")}
                    >
                      Reject ({pendingChosen.length})
                    </Button>
                  </>
                )}
                <Button small variant="plain" onClick={() => setSelected([])}>
                  Clear
                </Button>
              </div>
            ) : (
              <div
                role="alertdialog"
                aria-label="Confirm bulk rejection"
                className="ms-auto flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2"
              >
                <input
                  className="pl-input !w-auto min-w-[240px] flex-1"
                  aria-label="Reason for rejection (internal)"
                  placeholder={`Reason for rejecting ${pendingChosen.length} lead${pendingChosen.length === 1 ? "" : "s"}`}
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                />
                <Button
                  small
                  variant="destructive"
                  disabled={bulkReason.trim().length < 3 || runBulk.isPending}
                  onClick={() =>
                    runBulk.mutate({
                      action: "reject",
                      targets: pendingChosen,
                      reason: bulkReason.trim(),
                    })
                  }
                >
                  {runBulk.isPending ? "Rejecting..." : "Confirm reject"}
                </Button>
                <Button small variant="plain" onClick={() => setBulkReason(null)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="pl-toolbar">
            <div className="pl-search">
              <Search aria-hidden />
              <input
                className="pl-input"
                aria-label="Search leads"
                placeholder="Search by name, company, email or phone"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button small onClick={() => exportLeads(rows)} disabled={!rows.length}>
              <Download /> Export
            </Button>
          </div>
        )}

        <AdminQueryState query={list}>
          <div
            className="pl-table-wrap"
            style={{ borderTop: "1px solid var(--pl-border-subtle)" }}
          >
            <table className="pl-table" style={{ minWidth: 860 }}>
              <thead>
                <tr>
                  <th className="w-10 !text-center">
                    <input
                      type="checkbox"
                      className="pl-check"
                      aria-label="Select all leads in this view"
                      checked={allSelected}
                      ref={(n) => {
                        if (n) n.indeterminate = selected.length > 0 && !allSelected;
                      }}
                      disabled={!rowIds.length}
                      onChange={() => setSelected(selected.length ? [] : rowIds)}
                    />
                  </th>
                  <th>Contact</th>
                  <th>Company</th>
                  <th>Registered</th>
                  <th>Documents</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="!py-10 text-center pl-help">
                      No leads in this view.
                    </td>
                  </tr>
                ) : (
                  rows.map((l) => (
                    <tr
                      key={l._id}
                      className={`cursor-pointer ${selected.includes(l._id) ? "pl-row--selected" : ""}`}
                      onClick={() => setOpenId(l._id)}
                    >
                      <td className="!text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="pl-check"
                          aria-label={`Select ${l.firstName} ${l.lastName}`}
                          checked={selected.includes(l._id)}
                          onChange={() =>
                            setSelected((ids) =>
                              ids.includes(l._id)
                                ? ids.filter((x) => x !== l._id)
                                : [...ids, l._id],
                            )
                          }
                        />
                      </td>
                      <td>
                        <span className="block font-medium">
                          {l.firstName} {l.lastName}
                        </span>
                        <span className="pl-help block !mt-0">{l.email}</span>
                      </td>
                      <td>{l.companyName}</td>
                      <td className="whitespace-nowrap">{f.date(l.createdAt, true)}</td>
                      <td>
                        <span className="flex flex-wrap gap-1">
                          <Badge
                            tone={
                              l.documents.some((d) => d.kind === "trade_license")
                                ? "success"
                                : "neutral"
                            }
                          >
                            License
                          </Badge>
                          <Badge
                            tone={
                              l.documents.some((d) => d.kind === "trn")
                                ? "success"
                                : "neutral"
                            }
                          >
                            TRN
                          </Badge>
                        </span>
                      </td>
                      <td>
                        <Badge tone={TONE[l.status]}>{LABEL[l.status]}</Badge>
                      </td>
                      <td className="!text-end">
                        <Button
                          small
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenId(l._id);
                          }}
                        >
                          Open
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </AdminQueryState>
      </div>

      <Sheet open={!!current} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent
          side="right"
          className="admin-shell w-full gap-0 overflow-y-auto p-0 sm:max-w-xl"
        >
          {current && (
            <LeadPanel
              key={current._id}
              lead={current}
              manage={manage}
              onChanged={refresh}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function LeadPanel({
  lead,
  manage,
  onChanged,
}: {
  lead: Lead;
  manage: boolean;
  onChanged: () => void;
}) {
  const f = useAdminFormat();
  const [notes, setNotes] = useState(lead.notes);
  const [kind, setKind] = useState<LeadDoc["kind"]>("trade_license");
  const [file, setFile] = useState<File | null>(null);
  const [confirm, setConfirm] = useState<"validate" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null,
  );
  const [contact, setContact] = useState<Contact>({ name: "", phone: "", email: "" });

  const done = (text: string) => {
    setMessage({ kind: "ok", text });
    onChanged();
  };
  const fail = (e: unknown) =>
    setMessage({
      kind: "error",
      text: e instanceof Error ? e.message : "Something went wrong.",
    });

  const saveNotes = useMutation({
    mutationFn: () =>
      apiFetch(`/professional/admin/leads/${lead._id}/notes`, {
        method: "PATCH",
        body: JSON.stringify({ notes }),
      }),
    onSuccess: () => done("Notes saved."),
    onError: fail,
  });
  const attach = useMutation({
    mutationFn: () => {
      const form = new FormData();
      form.append("kind", kind);
      form.append("file", file!);
      return apiUpload(`/professional/admin/leads/${lead._id}/documents`, form);
    },
    onSuccess: () => {
      setFile(null);
      done("Document attached.");
    },
    onError: fail,
  });
  const validate = useMutation({
    mutationFn: () =>
      apiFetch(`/professional/admin/leads/${lead._id}/validate`, { method: "PATCH" }),
    onSuccess: () => {
      setConfirm(null);
      done(
        "Account validated. The professional received an email to set their password.",
      );
    },
    onError: (e) => {
      setConfirm(null);
      fail(e);
    },
  });
  const reject = useMutation({
    mutationFn: () =>
      apiFetch(`/professional/admin/leads/${lead._id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      setConfirm(null);
      done("Lead rejected.");
    },
    onError: fail,
  });
  const saveContact = useMutation({
    mutationFn: () =>
      apiFetch(`/professional/admin/profiles/${lead.profileId}/contact`, {
        method: "PATCH",
        body: JSON.stringify(contact),
      }),
    onSuccess: () => done("Dedicated contact saved."),
    onError: fail,
  });
  const openDoc = useMutation({
    mutationFn: (documentId: string) =>
      apiFetch<{ url: string }>(
        `/professional/admin/leads/${lead._id}/documents/${documentId}`,
      ),
    onSuccess: ({ url }) => window.open(url, "_blank", "noopener,noreferrer"),
    onError: fail,
  });

  const hasLicense = lead.documents.some((d) => d.kind === "trade_license");
  const pending = lead.status === "pending";

  return (
    <div className="flex flex-col">
      <SheetHeader className="border-b border-[var(--pl-border)] bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <SheetTitle className="text-[16px] font-semibold">
              {lead.companyName}
            </SheetTitle>
            <SheetDescription className="pl-help !mt-0">
              {lead.firstName} {lead.lastName} · registered {f.date(lead.createdAt, true)}
            </SheetDescription>
          </div>
          <Badge tone={TONE[lead.status]}>{LABEL[lead.status]}</Badge>
        </div>
      </SheetHeader>

      <div className="space-y-4 p-5">
        {message && (
          <p
            role={message.kind === "error" ? "alert" : "status"}
            className="pl-card !p-3 text-[13px]"
            style={{
              color:
                message.kind === "error" ? "var(--pl-critical)" : "var(--pl-success)",
            }}
          >
            {message.text}
          </p>
        )}

        <Card title="Contact">
          <div className="flex flex-col gap-2 text-[13px]">
            <a
              className="pl-link inline-flex items-center gap-2"
              href={`tel:${lead.phone.replace(/\s+/g, "")}`}
              dir="ltr"
            >
              <Phone className="size-4" aria-hidden /> {lead.phone}
            </a>
            <a
              className="pl-link inline-flex items-center gap-2 break-all"
              href={`mailto:${lead.email}`}
            >
              <Mail className="size-4" aria-hidden /> {lead.email}
            </a>
            <p className="pl-help !mt-1">
              Language: {lead.locale === "ar" ? "Arabic" : "English"}
            </p>
          </div>
        </Card>

        <Card title="Documents">
          {lead.documents.length === 0 ? (
            <p className="pl-help !mt-0">
              No document yet. Ask for the Trade License (and the TRN if VAT-registered).
            </p>
          ) : (
            <ul className="divide-y divide-[var(--pl-border-subtle)]">
              {lead.documents.map((d) => (
                <li
                  key={d.documentId}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <span className="flex min-w-0 items-center gap-2 text-[13px]">
                    <FileText className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">{d.originalName}</span>
                    <Badge>{KIND[d.kind]}</Badge>
                  </span>
                  <Button
                    small
                    onClick={() => openDoc.mutate(d.documentId)}
                    disabled={openDoc.isPending}
                  >
                    Open
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {manage && lead.status !== "rejected" && (
            <div className="mt-4 grid gap-3 border-t border-[var(--pl-border-subtle)] pt-4 sm:grid-cols-[160px_minmax(0,1fr)_auto] sm:items-end">
              <Field label="Type" htmlFor="doc-kind">
                <Select
                  id="doc-kind"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as LeadDoc["kind"])}
                >
                  <option value="trade_license">Trade License</option>
                  <option value="trn">TRN certificate</option>
                  <option value="other">Other</option>
                </Select>
              </Field>
              <Field label="File (PDF, JPG, PNG or WebP, up to 10 MB)" htmlFor="doc-file">
                <input
                  id="doc-file"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  className="pl-input !h-auto py-1"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </Field>
              <Button
                onClick={() => attach.mutate()}
                disabled={!file || attach.isPending}
              >
                <Paperclip /> Attach
              </Button>
            </div>
          )}
        </Card>

        <Card title="Internal notes">
          <Textarea
            aria-label="Internal notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={!manage}
            placeholder="Notes from the call (never shown to the lead)"
          />
          {manage && (
            <div className="mt-3">
              <Button
                small
                onClick={() => saveNotes.mutate()}
                disabled={saveNotes.isPending || notes === lead.notes}
              >
                Save notes
              </Button>
            </div>
          )}
        </Card>

        {(lead.status === "validated" || lead.status === "customer") &&
          lead.profileId &&
          manage && (
            <Card title="Dedicated IOMA contact">
              <p className="pl-help !mt-0 mb-3">
                Shown to this account once it becomes a customer. Empty fields fall back
                to the default contact in B2B settings.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Name" htmlFor="c-name">
                  <Input
                    id="c-name"
                    value={contact.name}
                    onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  />
                </Field>
                <Field label="Phone" htmlFor="c-phone">
                  <Input
                    id="c-phone"
                    dir="ltr"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  />
                </Field>
                <Field label="Email" htmlFor="c-email">
                  <Input
                    id="c-email"
                    type="email"
                    dir="ltr"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  />
                </Field>
              </div>
              <div className="mt-3">
                <Button
                  small
                  onClick={() => saveContact.mutate()}
                  disabled={saveContact.isPending}
                >
                  Save contact
                </Button>
              </div>
            </Card>
          )}

        {lead.status === "rejected" && lead.rejectionReason && (
          <Card title="Rejection reason">
            <p className="text-[13px]">{lead.rejectionReason}</p>
          </Card>
        )}

        {pending && manage && (
          <Card title="Decision">
            {confirm === "validate" ? (
              <div
                role="alertdialog"
                aria-label="Confirm validation"
                className="space-y-3 text-[13px]"
              >
                <p>
                  Validate this account? A login is created for{" "}
                  <strong>{lead.email}</strong> and they receive an email to set their
                  password. Trade prices and ordering open immediately.
                </p>
                <div className="flex gap-2">
                  <Button small onClick={() => setConfirm(null)}>
                    Cancel
                  </Button>
                  <Button
                    small
                    variant="primary"
                    onClick={() => validate.mutate()}
                    disabled={validate.isPending}
                  >
                    <Check /> {validate.isPending ? "Validating…" : "Validate account"}
                  </Button>
                </div>
              </div>
            ) : confirm === "reject" ? (
              <div
                role="alertdialog"
                aria-label="Confirm rejection"
                className="space-y-3"
              >
                <Field label="Reason (internal)" htmlFor="rej">
                  <Textarea
                    id="rej"
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Missing documents, ineligible business…"
                  />
                </Field>
                <div className="flex gap-2">
                  <Button small onClick={() => setConfirm(null)}>
                    Cancel
                  </Button>
                  <Button
                    small
                    variant="primary"
                    onClick={() => reject.mutate()}
                    disabled={reason.trim().length < 3 || reject.isPending}
                  >
                    <X /> Reject lead
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="primary"
                  onClick={() => setConfirm("validate")}
                  disabled={!hasLicense}
                >
                  <Check /> Validate account
                </Button>
                <Button variant="destructive" onClick={() => setConfirm("reject")}>
                  Reject
                </Button>
                {!hasLicense && (
                  <span className="pl-help !mt-0">Attach the Trade License first.</span>
                )}
              </div>
            )}
          </Card>
        )}

        <Card title="History">
          <ol className="space-y-2 text-[13px]">
            {[...lead.history].reverse().map((h, i) => (
              <li key={i} className="flex items-start justify-between gap-3">
                <span>
                  <strong className="font-medium">
                    {LABEL[h.status as Status] ?? h.status}
                  </strong>
                  {h.note ? ` — ${h.note}` : ""}
                </span>
                <span className="pl-help !mt-0 shrink-0">{f.date(h.at, true)}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
