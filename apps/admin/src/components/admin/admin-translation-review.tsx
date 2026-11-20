"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAdminQuery } from "@/hooks/use-admin";
import { Badge, Button, Card, Checkbox, Textarea } from "./polaris";

interface FieldRow {
  field: string;
  en: string;
  fr: string;
  liveAr: string;
  draftAr: string;
}
interface Review {
  id: string;
  status: "none" | "draft" | "approved" | "rejected";
  source: string | null;
  draftedAt: string | null;
  reviewedBy: string | null;
  fields: FieldRow[];
}

const LABEL: Record<string, string> = {
  name: "Name",
  accroche: "Tagline",
  shortBenefit: "Short description",
  description: "Description",
  details: "Details",
  texture: "Texture",
  results: "Results",
  howToUse: "How to use",
};

/**
 * Arabic review: a proposed translation sits next to the English and French text and the live Arabic.
 * Nothing goes live until it is approved (after any edits). Brand names and technical references stay in Latin script.
 */
export function TranslationReviewCard({
  productId,
  readOnly,
  onApplied,
}: {
  productId?: string;
  values?: Record<string, unknown>;
  readOnly: boolean;
  onApplied: () => void;
}) {
  const q = useAdminQuery<Review>(`catalog-sync/translations/${productId}`, !!productId);
  const [edit, setEdit] = useState<Record<string, string>>({});
  const [chosen, setChosen] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!q.data) return;
    setEdit(
      Object.fromEntries(
        q.data.fields.filter((f) => f.draftAr).map((f) => [f.field, f.draftAr]),
      ),
    );
    setChosen(new Set(q.data.fields.filter((f) => f.draftAr).map((f) => f.field)));
  }, [q.data]);

  const approve = useMutation({
    mutationFn: () =>
      apiFetch(`/catalog-sync/translations/${productId}/approve`, {
        method: "POST",
        body: JSON.stringify({
          fields: Object.fromEntries([...chosen].map((f) => [f, edit[f] ?? ""])),
        }),
      }),
    onSuccess: async () => {
      await q.refetch();
      onApplied();
    },
  });
  const reject = useMutation({
    mutationFn: () =>
      apiFetch(`/catalog-sync/translations/${productId}/reject`, { method: "POST" }),
    onSuccess: async () => {
      await q.refetch();
      onApplied();
    },
  });

  if (!productId)
    return (
      <Card title="Arabic translation review">
        <p className="pl-help !mt-0">Save the product first.</p>
      </Card>
    );
  const d = q.data;
  const status = d?.status ?? "none";
  return (
    <Card
      title="Arabic translation review"
      action={
        <Badge
          tone={
            status === "draft" ? "warning" : status === "approved" ? "success" : "neutral"
          }
        >
          {status === "draft"
            ? "Draft to review"
            : status === "approved"
              ? "Approved"
              : status === "rejected"
                ? "Draft rejected"
                : "No draft"}
        </Badge>
      }
    >
      <div className="space-y-4 p-4">
        {!d ? (
          <p className="pl-help !mt-0">Loading…</p>
        ) : status !== "draft" ? (
          <p className="pl-help !mt-0">
            {status === "approved"
              ? `The Arabic text was reviewed and approved${d.reviewedBy ? ` by ${d.reviewedBy}` : ""}. You can still edit it in General information.`
              : "No Arabic draft is waiting for review for this product. Arabic text is edited in General information (language switch: العربية)."}
          </p>
        ) : (
          <>
            <p className="pl-help !mt-0">
              The Arabic below is a proposal{d.source ? ` (${d.source})` : ""}. Edit it if
              needed, tick what you approve, then approve. Brand names and technical
              references are kept as they are. Nothing changes on the site until you
              approve.
            </p>
            {d.fields.map((f) => (
              <div key={f.field} className="space-y-2 rounded-lg border p-3">
                <Checkbox
                  checked={chosen.has(f.field)}
                  disabled={readOnly || !f.draftAr}
                  onChange={(e) =>
                    setChosen((s) => {
                      const n = new Set(s);
                      if (e.target.checked) n.add(f.field);
                      else n.delete(f.field);
                      return n;
                    })
                  }
                  label={<strong>{LABEL[f.field] ?? f.field}</strong>}
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1 text-[13px]">
                    <p className="pl-help !mt-0">English</p>
                    <p className="whitespace-pre-wrap">{f.en || "—"}</p>
                    {f.fr && (
                      <>
                        <p className="pl-help">Français</p>
                        <p className="whitespace-pre-wrap">{f.fr}</p>
                      </>
                    )}
                  </div>
                  <div className="space-y-1 text-[13px]">
                    <p className="pl-help !mt-0">Arabic draft (editable)</p>
                    <Textarea
                      dir="rtl"
                      rows={f.field === "name" ? 2 : 5}
                      disabled={readOnly || !f.draftAr}
                      value={edit[f.field] ?? ""}
                      onChange={(e) =>
                        setEdit((x) => ({ ...x, [f.field]: e.target.value }))
                      }
                    />
                    {f.liveAr && (
                      <p className="pl-help" dir="rtl">
                        Live now: {f.liveAr}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!readOnly && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  disabled={chosen.size === 0 || approve.isPending}
                  onClick={() => approve.mutate()}
                >
                  Approve {chosen.size} field{chosen.size === 1 ? "" : "s"}
                </Button>
                <Button disabled={reject.isPending} onClick={() => reject.mutate()}>
                  Reject this draft
                </Button>
              </div>
            )}
            {(approve.isError || reject.isError) && (
              <p role="alert" style={{ color: "var(--pl-critical)" }}>
                Could not complete the action. Nothing was changed.
              </p>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
