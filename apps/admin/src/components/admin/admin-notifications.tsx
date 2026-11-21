"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAdminAccess } from "@/hooks/use-admin";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge, Button, Card, Input, Select } from "./polaris";

interface Row {
  _id: string;
  to: string;
  subject: string;
  kind: string | null;
  ref: string | null;
  status: "pending" | "sent" | "failed" | "skipped";
  attempts: number;
  lastError: string | null;
  createdAt: string;
  sentAt: string | null;
  nextAttemptAt: string;
}
interface Page {
  items: Row[];
  total: number;
  page: number;
  limit: number;
}
interface Summary {
  counts: Record<string, number>;
  config: {
    smtp: Record<string, "ok" | "failed">;
    customerFrom: string | null;
    adminFrom: string | null;
    replyTo: string;
    adminRecipients: string[];
    adminRecipientsConfigured: number;
  };
}

const TONE = {
  sent: "success",
  pending: "warning",
  failed: "critical",
  skipped: "neutral",
} as const;
const LABEL = {
  sent: "Sent",
  pending: "Waiting to send",
  failed: "Failed",
  skipped: "Not sent (SMTP off)",
} as const;
const KIND: Record<string, string> = {
  "order.placed.customer": "Order confirmation",
  "order.placed.admin": "New order (team)",
  "order.payment_received.customer": "Payment received",
  "order.confirmed.customer": "Order confirmed",
  "order.shipped.customer": "Order shipped",
  "order.delivered.customer": "Order delivered",
  "order.cancelled.customer": "Order cancelled",
  "order.refunded.customer": "Refund",
  "order.cancelled_refunded.customer": "Cancelled and refunded",
};
const kindLabel = (k: string | null) => {
  if (!k) return "Other";
  const base = k.replace(/\.(b2c|b2b)$/, "");
  const ch = k.endsWith(".b2b") ? " (B2B)" : k.endsWith(".b2c") ? " (B2C)" : "";
  return (KIND[base] ?? k) + ch;
};

/** Every email the platform queued: delivery status, failures with the reason, preview and retry. */
export function AdminNotifications() {
  const access = useAdminAccess();
  const qc = useQueryClient();
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<string | null>(null);
  const can = !!access.data?.permissions.includes("commerce.view");
  const manage = !!access.data?.permissions.includes("commerce.manage");

  const qs = new URLSearchParams({ page: String(page), limit: "20" });
  if (status !== "all") qs.set("status", status);
  if (q.trim()) qs.set("q", q.trim());
  const list = useQuery({
    queryKey: ["admin", "notifications", qs.toString()],
    queryFn: () => apiFetch<Page>(`/admin/notifications?${qs}`),
    enabled: can,
    placeholderData: (p) => p,
    refetchInterval: 15_000,
  });
  const summary = useQuery({
    queryKey: ["admin", "notifications-summary"],
    queryFn: () => apiFetch<Summary>("/admin/notifications/summary"),
    enabled: can,
    refetchInterval: 30_000,
  });
  const retry = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/notifications/${id}/retry`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });
  const prev = useQuery({
    queryKey: ["admin", "notification-preview", preview],
    queryFn: () =>
      apiFetch<{ html: string; subject: string; to: string }>(
        `/admin/notifications/${preview}/preview`,
      ),
    enabled: !!preview,
  });

  if (access.data && !can)
    return <p role="alert">You do not have access to this section.</p>;
  const d = list.data;
  const pages = d ? Math.max(1, Math.ceil(d.total / d.limit)) : 1;
  const c = summary.data?.counts ?? {};
  const cfg = summary.data?.config;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="pl-page-title">Email notifications</h1>
        <p className="pl-help !mt-1">
          Every order email (customer and team) and every partner email, with its delivery
          status. A failed email is retried automatically for about a day; you can also
          retry it by hand.
        </p>
      </header>

      <Card>
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="pl-help !m-0">Mail server</p>
            <p className="mt-1 flex flex-wrap gap-1">
              {cfg
                ? Object.entries(cfg.smtp).map(([k, v]) => (
                    <Badge key={k} tone={v === "ok" ? "success" : "critical"}>
                      {k}: {v === "ok" ? "connected" : "not connected"}
                    </Badge>
                  ))
                : "…"}
            </p>
          </div>
          <div>
            <p className="pl-help !m-0">Customer emails come from</p>
            <p className="mt-1 break-all text-[13px]">
              {cfg?.customerFrom ?? "not configured"}
            </p>
            <p className="pl-help !m-0 !mt-1">Replies go to {cfg?.replyTo}</p>
          </div>
          <div>
            <p className="pl-help !m-0">Team notifications come from</p>
            <p className="mt-1 break-all text-[13px]">
              {cfg?.adminFrom ?? "not configured"}
            </p>
          </div>
          <div>
            <p className="pl-help !m-0">New orders are announced to</p>
            {cfg && cfg.adminRecipientsConfigured === 0 ? (
              <p
                role="alert"
                className="mt-1 text-[13px]"
                style={{ color: "var(--pl-critical)" }}
              >
                No recipient configured
              </p>
            ) : (
              <p className="mt-1 break-all text-[13px]">
                {cfg?.adminRecipients.join(", ")}
              </p>
            )}
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        {(["failed", "pending", "sent", "skipped"] as const).map((s) => (
          <button
            key={s}
            type="button"
            className="pl-badge"
            aria-pressed={status === s}
            onClick={() => {
              setStatus(status === s ? "all" : s);
              setPage(1);
            }}
            style={status === s ? { outline: "2px solid currentColor" } : undefined}
          >
            {LABEL[s]}: {c[s] ?? 0}
          </button>
        ))}
        <div className="ml-auto flex min-w-0 flex-wrap gap-2">
          <Input
            aria-label="Search notifications"
            placeholder="Search order number, email or subject"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="min-w-[14rem]"
          />
          <Select
            aria-label="Status filter"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All statuses</option>
            <option value="failed">Failed</option>
            <option value="pending">Waiting to send</option>
            <option value="sent">Sent</option>
            <option value="skipped">Not sent</option>
          </Select>
        </div>
      </div>

      {list.isError ? (
        <p role="alert" style={{ color: "var(--pl-critical)" }}>
          The notifications could not be loaded.
        </p>
      ) : list.isLoading ? (
        <p className="pl-help">Loading&hellip;</p>
      ) : d && d.items.length === 0 ? (
        <p className="pl-help">No email matches these filters.</p>
      ) : (
        <div className="pl-table-wrap">
          <table className="pl-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Email</th>
                <th>To</th>
                <th>Status</th>
                <th>Tries</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {d?.items.map((r) => (
                <tr key={r._id}>
                  <td className="whitespace-nowrap text-[12px]">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="text-[13px]">
                    <strong className="font-medium">{kindLabel(r.kind)}</strong>
                    {r.ref ? <span className="pl-help !m-0 block">{r.ref}</span> : null}
                    <span className="pl-help !m-0 block max-w-[28rem] truncate">
                      {r.subject}
                    </span>
                  </td>
                  <td className="break-all text-[12px]">{r.to}</td>
                  <td>
                    <Badge tone={TONE[r.status]}>{LABEL[r.status]}</Badge>
                    {r.status === "sent" && r.sentAt ? (
                      <span className="pl-help !m-0 block">
                        {new Date(r.sentAt).toLocaleString()}
                      </span>
                    ) : null}
                    {r.lastError && r.status !== "sent" ? (
                      <span
                        className="pl-help !m-0 block"
                        style={{ color: "var(--pl-critical)" }}
                      >
                        {r.lastError}
                      </span>
                    ) : null}
                    {r.status === "pending" && r.attempts > 0 ? (
                      <span className="pl-help !m-0 block">
                        next try {new Date(r.nextAttemptAt).toLocaleTimeString()}
                      </span>
                    ) : null}
                  </td>
                  <td className="tabular-nums">{r.attempts}</td>
                  <td className="whitespace-nowrap">
                    <span className="flex gap-1">
                      <Button small onClick={() => setPreview(r._id)}>
                        Preview
                      </Button>
                      {manage && r.status !== "sent" ? (
                        <Button
                          small
                          variant="primary"
                          disabled={retry.isPending}
                          onClick={() => retry.mutate(r._id)}
                        >
                          Retry now
                        </Button>
                      ) : null}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {retry.isError && (
        <p role="alert" style={{ color: "var(--pl-critical)" }}>
          The retry could not be started.
        </p>
      )}

      {d && d.total > d.limit && (
        <div className="flex items-center justify-between gap-3 text-[13px]">
          <span>
            {d.total} emails &middot; page {d.page} of {pages}
          </span>
          <span className="flex gap-2">
            <Button small disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button small disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </span>
        </div>
      )}

      <Sheet open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle>{prev.data?.subject ?? "Email preview"}</SheetTitle>
            <SheetDescription>To {prev.data?.to ?? "…"}</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-8">
            {prev.isLoading ? (
              <p className="pl-help">Loading&hellip;</p>
            ) : prev.data ? (
              <iframe
                title="Email preview"
                sandbox=""
                srcDoc={prev.data.html}
                className="h-[75vh] w-full rounded border"
              />
            ) : (
              <p role="alert">The preview could not be loaded.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
