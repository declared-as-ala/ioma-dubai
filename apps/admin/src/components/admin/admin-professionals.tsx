"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useAdminAccess, useAdminQuery } from "@/hooks/use-admin";
import { Badge, Button, Card, Input, Select } from "./polaris";
import { AdminQueryState, AdminEmpty } from "./admin-ui";

export interface HubRow {
  key: string;
  kind: "professional" | "partner";
  name: string;
  businessType: string;
  city: string;
  emirate: string;
  b2bStatus: "approved" | "suspended" | "none";
  visibility: "active" | "inactive" | "none";
  partnerId: string | null;
  email: string;
  phone: string;
}
interface HubList {
  items: HubRow[];
  total: number;
  page: number;
  limit: number;
  counts: {
    all: number;
    approved: number;
    suspended: number;
    publicListings: number;
    unlinked: number;
  };
}

export const label = (v: string) =>
  v.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

export function B2bBadge({ status }: { status: HubRow["b2bStatus"] }) {
  if (status === "approved") return <Badge tone="success">B2B approved</Badge>;
  if (status === "suspended") return <Badge tone="critical">B2B suspended</Badge>;
  return <Badge>No B2B account</Badge>;
}
export function VisibilityBadge({ status }: { status: HubRow["visibility"] }) {
  if (status === "active") return <Badge tone="success">Public listing: visible</Badge>;
  if (status === "inactive") return <Badge tone="warning">Public listing: hidden</Badge>;
  return <Badge>No public profile</Badge>;
}

const TYPES = [
  "spa",
  "clinic",
  "beauty_institute",
  "hotel",
  "retail",
  "diagnostic_center",
  "distributor",
];

/** One list for every IOMA business: professionals (B2B) and their public partner profiles. */
export function AdminProfessionals() {
  const access = useAdminAccess();
  const [q, setQ] = useState("");
  const [b2b, setB2b] = useState("");
  const [visibility, setVisibility] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const qs = new URLSearchParams({ page: String(page), limit: "15" });
  if (q.trim()) qs.set("q", q.trim());
  if (b2b) qs.set("b2b", b2b);
  if (visibility) qs.set("visibility", visibility);
  if (type) qs.set("type", type);
  const list = useAdminQuery<HubList>(
    `hub?${qs.toString()}`,
    !!access.data?.permissions.includes("b2b.view"),
  );
  if (access.data && !access.data.permissions.includes("b2b.view"))
    return <p role="alert">You do not have access to this section.</p>;

  const d = list.data;
  const pages = d ? Math.max(1, Math.ceil(d.total / d.limit)) : 1;
  const reset = (fn: () => void) => {
    fn();
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-4">
      <header>
        <h1 className="pl-page-title">Professionals</h1>
        <p className="pl-help !mt-1">
          Every IOMA partner is one business: its B2B account, orders and pricing, and its
          public profile, services and bookings.
        </p>
      </header>

      {d && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ["Businesses", d.counts.all],
            ["B2B approved", d.counts.approved],
            ["B2B suspended", d.counts.suspended],
            ["Public listings visible", d.counts.publicListings],
            ["Public only (no B2B)", d.counts.unlinked],
          ].map(([name, n]) => (
            <div key={name as string} className="pl-card !p-3">
              <p className="pl-help !mt-0">{name}</p>
              <p className="text-xl font-semibold">{n}</p>
            </div>
          ))}
        </div>
      )}

      <Card>
        <div className="grid gap-3 p-4 md:grid-cols-4">
          <Input
            aria-label="Search professionals"
            placeholder="Search name, email, city, phone"
            value={q}
            onChange={(e) => reset(() => setQ(e.target.value))}
          />
          <Select
            aria-label="B2B status"
            value={b2b}
            onChange={(e) => reset(() => setB2b(e.target.value))}
          >
            <option value="">All B2B statuses</option>
            <option value="approved">Approved</option>
            <option value="suspended">Suspended</option>
            <option value="none">No B2B account</option>
          </Select>
          <Select
            aria-label="Public visibility"
            value={visibility}
            onChange={(e) => reset(() => setVisibility(e.target.value))}
          >
            <option value="">All public visibility</option>
            <option value="active">Visible</option>
            <option value="inactive">Hidden</option>
            <option value="none">No public profile</option>
          </Select>
          <Select
            aria-label="Business type"
            value={type}
            onChange={(e) => reset(() => setType(e.target.value))}
          >
            <option value="">All business types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {label(t)}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <AdminQueryState query={list}>
        {d && d.items.length === 0 ? (
          <AdminEmpty />
        ) : (
          d && (
            <Card flush>
              <div className="pl-table-wrap">
                <table className="pl-table">
                  <thead>
                    <tr>
                      <th>Business</th>
                      <th>Type</th>
                      <th>Location</th>
                      <th>B2B account</th>
                      <th>Public profile</th>
                      <th>Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.items.map((r) => (
                      <tr key={r.key}>
                        <td>
                          <Link
                            className="pl-link font-medium"
                            href={`/admin/professional-accounts/${encodeURIComponent(r.key)}`}
                          >
                            {r.name}
                          </Link>
                        </td>
                        <td>{label(r.businessType || "—")}</td>
                        <td>{[r.city, r.emirate].filter(Boolean).join(", ") || "—"}</td>
                        <td>
                          <B2bBadge status={r.b2bStatus} />
                        </td>
                        <td>
                          <VisibilityBadge status={r.visibility} />
                        </td>
                        <td className="text-[13px]">
                          <span className="block break-all">{r.email || "—"}</span>
                          <span dir="ltr">{r.phone}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between gap-3 p-3 text-[13px]">
                <span>
                  {d.total} result{d.total === 1 ? "" : "s"} · page {d.page} of {pages}
                </span>
                <span className="flex gap-2">
                  <Button
                    small
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
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
            </Card>
          )
        )}
      </AdminQueryState>
    </div>
  );
}
