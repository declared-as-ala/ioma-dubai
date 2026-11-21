"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAdminAccess } from "@/hooks/use-admin";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge, Button, Card, Input, Select, Textarea } from "./polaris";

type Status = "pending" | "published" | "rejected" | "hidden" | "withdrawn";
interface Review {
  _id: string;
  productId: string;
  productSlug: string;
  productName?: { en?: string };
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  locale?: string;
  verifiedPurchase: boolean;
  status: Status;
  createdAt: string;
  reply?: { text: string; by: string; at: string };
  moderation?: { by: string; at: string; note?: string; from?: string };
}
interface List {
  items: Review[];
  total: number;
  page: number;
  limit: number;
}
interface Stats {
  total: number;
  byStatus: Record<string, number>;
  publishedAverage: number | null;
  publishedVerified: number;
}

const TONE: Record<Status, "success" | "warning" | "critical" | "neutral"> = {
  pending: "warning",
  published: "success",
  rejected: "critical",
  hidden: "neutral",
  withdrawn: "neutral",
};
const LABEL: Record<Status, string> = {
  pending: "Awaiting approval",
  published: "Published",
  rejected: "Rejected",
  hidden: "Hidden",
  withdrawn: "Withdrawn by customer",
};

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className="size-3.5"
          style={{ color: "#b28600" }}
          fill={i <= value ? "#b28600" : "transparent"}
          aria-hidden
        />
      ))}
    </span>
  );
}

function ReviewDrawer({
  id,
  manage,
  onClose,
}: {
  id: string | null;
  manage: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "review", id],
    queryFn: () => apiFetch<Review>(`/admin/reviews/${id}`),
    enabled: !!id,
  });
  const r = q.data;
  const [note, setNote] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
    await qc.invalidateQueries({ queryKey: ["admin", "review", id] });
  };
  const moderate = useMutation({
    mutationFn: (status: Status) =>
      apiFetch(`/admin/reviews/${id}/moderate`, {
        method: "PATCH",
        body: JSON.stringify({ status, note }),
      }),
    onSuccess: async (_d, status) => {
      await refresh();
      setNote("");
      setMessage({ ok: true, text: `Review is now: ${LABEL[status].toLowerCase()}.` });
    },
    onError: () =>
      setMessage({ ok: false, text: "Could not update. Nothing was changed." }),
  });
  const saveReply = useMutation({
    mutationFn: (text: string) =>
      apiFetch(`/admin/reviews/${id}/reply`, {
        method: "PATCH",
        body: JSON.stringify({ text }),
      }),
    onSuccess: async () => {
      await refresh();
      setReply(null);
      setMessage({ ok: true, text: "Reply saved." });
    },
    onError: () => setMessage({ ok: false, text: "Could not save the reply." }),
  });

  return (
    <Sheet
      open={!!id}
      onOpenChange={(o) => {
        if (!o) {
          setMessage(null);
          setReply(null);
          setNote("");
          onClose();
        }
      }}
    >
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Review</SheetTitle>
          <SheetDescription>
            Only published reviews appear on the website and count towards ratings.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-4 pb-8">
          {q.isLoading && <p className="pl-help">Loading&hellip;</p>}
          {q.isError && (
            <p role="alert" style={{ color: "var(--pl-critical)" }}>
              This review could not be loaded.
            </p>
          )}
          {r && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={TONE[r.status]}>{LABEL[r.status]}</Badge>
                {r.verifiedPurchase ? (
                  <Badge tone="success">Verified purchase</Badge>
                ) : (
                  <Badge>Not a verified purchase</Badge>
                )}
              </div>
              <div className="space-y-1">
                <p className="pl-help !mt-0">
                  {r.productName?.en ?? r.productSlug} &middot; {r.authorName} &middot;{" "}
                  {new Date(r.createdAt).toLocaleString()}
                </p>
                <Stars value={r.rating} />
                {r.title && <p className="font-medium">{r.title}</p>}
                <p className="whitespace-pre-line break-words text-[14px] leading-relaxed">
                  {r.comment}
                </p>
              </div>

              {r.moderation && (
                <p className="pl-help">
                  Last decision by {r.moderation.by} on{" "}
                  {new Date(r.moderation.at).toLocaleString()}
                  {r.moderation.note ? `: ${r.moderation.note}` : ""}
                </p>
              )}

              {manage && r.status !== "withdrawn" && (
                <Card title="Moderation">
                  <div className="space-y-3 p-4">
                    <Input
                      placeholder="Internal note (optional, never shown to customers)"
                      value={note}
                      maxLength={500}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                      {r.status !== "published" && (
                        <Button
                          variant="primary"
                          disabled={moderate.isPending}
                          onClick={() => moderate.mutate("published")}
                        >
                          Approve &amp; publish
                        </Button>
                      )}
                      {r.status === "pending" && (
                        <Button
                          disabled={moderate.isPending}
                          onClick={() => moderate.mutate("rejected")}
                        >
                          Reject
                        </Button>
                      )}
                      {r.status === "published" && (
                        <Button
                          disabled={moderate.isPending}
                          onClick={() => moderate.mutate("hidden")}
                        >
                          Hide from the website
                        </Button>
                      )}
                      {(r.status === "hidden" || r.status === "rejected") && (
                        <Button
                          disabled={moderate.isPending}
                          onClick={() => moderate.mutate("pending")}
                        >
                          Move back to pending
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              <Card title="Reply from IOMA">
                <div className="space-y-3 p-4">
                  {manage ? (
                    <>
                      <Textarea
                        rows={4}
                        maxLength={1000}
                        placeholder="Write a public reply, shown under the review once it is published."
                        value={reply ?? r.reply?.text ?? ""}
                        onChange={(e) => setReply(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          disabled={saveReply.isPending || reply === null}
                          onClick={() => saveReply.mutate(reply ?? "")}
                        >
                          {reply === "" ? "Remove reply" : "Save reply"}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="whitespace-pre-line">{r.reply?.text ?? "No reply."}</p>
                  )}
                </div>
              </Card>

              {message && (
                <p
                  role={message.ok ? "status" : "alert"}
                  style={{
                    color: message.ok
                      ? "var(--pl-success, #198038)"
                      : "var(--pl-critical)",
                  }}
                >
                  {message.text}
                </p>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Customer reviews: real submissions only, moderated before they appear on the website. */
export function AdminReviews() {
  const access = useAdminAccess();
  const manage = !!access.data?.permissions.includes("commerce.manage");
  const [status, setStatus] = useState<string>("pending");
  const [rating, setRating] = useState("");
  const [verified, setVerified] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);

  const qs = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) qs.set("status", status);
  if (rating) qs.set("rating", rating);
  if (verified) qs.set("verified", "1");
  if (q.trim()) qs.set("q", q.trim());

  const list = useQuery({
    queryKey: ["admin", "reviews", qs.toString()],
    queryFn: () => apiFetch<List>(`/admin/reviews?${qs}`),
    placeholderData: (prev) => prev,
  });
  const stats = useQuery({
    queryKey: ["admin", "reviews", "stats"],
    queryFn: () => apiFetch<Stats>("/admin/reviews/stats"),
  });
  const s = stats.data;
  const pages = list.data ? Math.max(1, Math.ceil(list.data.total / list.data.limit)) : 1;

  const tabs: [string, string][] = [
    ["pending", `Awaiting approval${s ? ` (${s.byStatus.pending ?? 0})` : ""}`],
    ["published", `Published${s ? ` (${s.byStatus.published ?? 0})` : ""}`],
    ["hidden", "Hidden"],
    ["rejected", "Rejected"],
    ["", "All"],
  ];

  return (
    <div className="mx-auto max-w-[1100px] space-y-4">
      <div className="min-w-0">
        <h1 className="pl-page-title">Customer reviews</h1>
        <p className="pl-help !mt-0">
          Reviews written by registered customers. Approve them before they appear on the
          website.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <div className="p-4">
            <p className="pl-help !mt-0">Awaiting approval</p>
            <p className="text-2xl font-semibold">
              {s ? (s.byStatus.pending ?? 0) : "…"}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="pl-help !mt-0">Published</p>
            <p className="text-2xl font-semibold">
              {s ? (s.byStatus.published ?? 0) : "…"}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="pl-help !mt-0">Average rating (published)</p>
            <p className="text-2xl font-semibold">
              {s ? (s.publishedAverage != null ? `${s.publishedAverage} / 5` : "—") : "…"}
            </p>
          </div>
        </Card>
      </div>

      <Card flush>
        <div
          className="flex flex-wrap gap-2 border-b p-3"
          role="tablist"
          aria-label="Review status"
        >
          {tabs.map(([value, label]) => (
            <button
              key={value || "all"}
              type="button"
              role="tab"
              aria-selected={status === value}
              className={`pl-btn pl-btn--sm ${status === value ? "pl-btn--primary" : ""}`}
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 p-3">
          <div className="min-w-[200px] flex-1">
            <Input
              placeholder="Search by product, customer or text"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              aria-label="Search reviews"
            />
          </div>
          <Select
            aria-label="Filter by rating"
            value={rating}
            onChange={(e) => {
              setRating(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All ratings</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} stars
              </option>
            ))}
          </Select>
          <label className="flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => {
                setVerified(e.target.checked);
                setPage(1);
              }}
            />
            Verified purchases only
          </label>
        </div>

        {list.isError ? (
          <p role="alert" className="p-4" style={{ color: "var(--pl-critical)" }}>
            Reviews could not be loaded. Please refresh.
          </p>
        ) : list.isLoading ? (
          <p className="pl-help p-4">Loading&hellip;</p>
        ) : list.data && list.data.items.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-[13px] font-semibold">No reviews here yet</p>
            <p className="pl-help">
              Customers can review a product from its page on the website once they are
              signed in.
            </p>
          </div>
        ) : (
          <div className="pl-table-wrap">
            <table className="pl-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.data?.items.map((r) => (
                  <tr
                    key={r._id}
                    className="cursor-pointer"
                    onClick={() => setOpen(r._id)}
                  >
                    <td className="max-w-[180px] truncate">
                      {r.productName?.en ?? r.productSlug}
                    </td>
                    <td>
                      {r.authorName}
                      {r.verifiedPurchase && (
                        <span className="pl-help !mt-0 block">Verified purchase</span>
                      )}
                    </td>
                    <td>
                      <Stars value={r.rating} />
                    </td>
                    <td className="max-w-[280px]">
                      <span className="line-clamp-2 break-words text-[13px]">
                        {r.title ? `${r.title}: ` : ""}
                        {r.comment}
                      </span>
                    </td>
                    <td>
                      <Badge tone={TONE[r.status]}>{LABEL[r.status]}</Badge>
                    </td>
                    <td className="whitespace-nowrap text-[13px]">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="!text-end" onClick={(e) => e.stopPropagation()}>
                      <Button small onClick={() => setOpen(r._id)}>
                        {manage && r.status === "pending" ? "Review" : "Open"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {list.data && list.data.total > list.data.limit && (
          <div className="flex items-center justify-between gap-3 p-3 text-[13px]">
            <span>
              {list.data.total} reviews · page {list.data.page} of {pages}
            </span>
            <span className="flex gap-2">
              <Button small disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button
                small
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </span>
          </div>
        )}
      </Card>

      <ReviewDrawer id={open} manage={manage} onClose={() => setOpen(null)} />
    </div>
  );
}
