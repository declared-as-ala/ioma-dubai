"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, MoreHorizontal, ExternalLink, ShieldAlert } from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
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

/** Manual creation of a professional account (no application needed): the person receives an email to choose a password. */
function AddProfessionalDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const empty = {
    firstName: "",
    lastName: "",
    email: "",
    companyName: "",
    phone: "",
    locale: "en",
  };
  const [f, setF] = useState(empty);
  const [done, setDone] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>("/professional/admin/accounts", {
        method: "POST",
        body: JSON.stringify({ ...f, phone: f.phone.trim() || undefined }),
      }),
    onSuccess: async (r) => {
      await qc.invalidateQueries({ queryKey: ["admin"] });
      setDone(r.message);
      setF(empty);
    },
  });
  const valid =
    f.firstName.trim() &&
    f.lastName.trim() &&
    f.companyName.trim().length >= 2 &&
    /^\S+@\S+\.\S+$/.test(f.email.trim());
  const set =
    (k: keyof typeof empty) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setF((x) => ({ ...x, [k]: e.target.value }));
  const err = create.error as (Error & { message?: string }) | null;
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setDone(null);
          create.reset();
        }
      }}
    >
      <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto">
        <DialogTitle>Add a professional</DialogTitle>
        <DialogDescription>
          Creates an approved professional account straight away. They receive an email to
          choose their own password. If the email already belongs to a customer, that
          customer gains professional access.
        </DialogDescription>
        {done ? (
          <div className="space-y-4" role="status">
            <p className="text-[14px]">{done}</p>
            <Button variant="primary" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (valid) create.mutate();
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-[13px] font-medium">
                First name *
                <Input value={f.firstName} onChange={set("firstName")} maxLength={100} />
              </label>
              <label className="grid gap-1 text-[13px] font-medium">
                Last name *
                <Input value={f.lastName} onChange={set("lastName")} maxLength={100} />
              </label>
            </div>
            <label className="grid gap-1 text-[13px] font-medium">
              Business name *
              <Input
                value={f.companyName}
                onChange={set("companyName")}
                maxLength={120}
              />
            </label>
            <label className="grid gap-1 text-[13px] font-medium">
              Email *
              <Input
                type="email"
                value={f.email}
                onChange={set("email")}
                maxLength={160}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-[13px] font-medium">
                Phone
                <Input value={f.phone} onChange={set("phone")} maxLength={40} dir="ltr" />
              </label>
              <label className="grid gap-1 text-[13px] font-medium">
                Email language
                <Select value={f.locale} onChange={set("locale")}>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="ar">العربية</option>
                </Select>
              </label>
            </div>
            {create.isError && (
              <p
                role="alert"
                className="text-[13px]"
                style={{ color: "var(--pl-critical)" }}
              >
                {err?.message || "The account could not be created."}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button
                variant="primary"
                type="submit"
                disabled={!valid || create.isPending}
              >
                {create.isPending ? "Creating…" : "Create account"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Per-row management: open the business, show or hide its public listing, jump to B2B suspension. */
function BusinessActions({ row, manage }: { row: HubRow; manage: boolean }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const box = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  const toggle = useMutation({
    mutationFn: (status: "active" | "inactive") =>
      apiFetch(`/admin/resources/partners/${row.partnerId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: async (_d, status) => {
      await qc.invalidateQueries({ queryKey: ["admin"] });
      setNote(
        status === "active"
          ? "Public listing is now visible."
          : "Public listing is now hidden.",
      );
    },
    onError: () => setNote("Could not update. Nothing was changed."),
  });
  const href = `/admin/professional-accounts/${encodeURIComponent(row.key)}`;
  const item =
    "flex w-full items-center gap-2 px-3 py-2 text-[13px] hover:bg-neutral-100";
  return (
    <span ref={box} className="relative inline-flex">
      <button
        type="button"
        className="pl-btn pl-btn--plain pl-btn--sm"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${row.name}`}
        onClick={() => setOpen((o) => !o)}
      >
        <MoreHorizontal className="size-4" aria-hidden />
      </button>
      {open && (
        <ul
          role="menu"
          className="absolute end-0 top-full z-30 mt-1 min-w-52 rounded-lg border bg-white py-1 text-start shadow-lg"
        >
          <li role="none">
            <Link role="menuitem" href={href} className={item}>
              <ExternalLink className="size-4" aria-hidden /> Open &amp; edit business
            </Link>
          </li>
          {manage && row.partnerId && row.visibility !== "none" && (
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className={item}
                disabled={toggle.isPending}
                onClick={() => {
                  setOpen(false);
                  toggle.mutate(row.visibility === "active" ? "inactive" : "active");
                }}
              >
                {row.visibility === "active" ? (
                  <>
                    <EyeOff className="size-4" aria-hidden /> Hide public listing
                  </>
                ) : (
                  <>
                    <Eye className="size-4" aria-hidden /> Show public listing
                  </>
                )}
              </button>
            </li>
          )}
          {manage && row.b2bStatus !== "none" && (
            <li role="none">
              <Link role="menuitem" href={href} className={item}>
                <ShieldAlert className="size-4" aria-hidden />
                {row.b2bStatus === "approved"
                  ? "Suspend B2B access\u2026"
                  : "Reactivate B2B access\u2026"}
              </Link>
            </li>
          )}
        </ul>
      )}
      {note && (
        <span role="status" className="sr-only">
          {note}
        </span>
      )}
    </span>
  );
}

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
  const qc = useQueryClient();
  const manage = !!access.data?.permissions.includes("b2b.manage");
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState<string | null>(null);
  const toggleRow = (key: string) =>
    setSelected((cur) => {
      const n = new Set(cur);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  const chosen = (d?.items ?? []).filter((r) => selected.has(r.key));
  const downloadCsv = (rows: HubRow[]) => {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      [
        "Business",
        "Type",
        "City",
        "Emirate",
        "B2B account",
        "Public listing",
        "Email",
        "Phone",
      ],
      ...rows.map((r) => [
        r.name,
        r.businessType,
        r.city,
        r.emirate,
        r.b2bStatus,
        r.visibility,
        r.email,
        r.phone,
      ]),
    ]
      .map((l) => l.map(esc).join(","))
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" }),
    );
    a.download = `ioma_professionals_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  // exports the whole filtered result (every page), or only the ticked rows
  const exportRows = async () => {
    if (chosen.length) return downloadCsv(chosen);
    const rows: HubRow[] = [];
    for (let pg = 1; pg < 50; pg++) {
      const p = new URLSearchParams(qs);
      p.set("page", String(pg));
      p.set("limit", "100");
      const r = await apiFetch<HubList>(`/admin/hub?${p}`);
      rows.push(...r.items);
      if (rows.length >= r.total || r.items.length === 0) break;
    }
    downloadCsv(rows);
  };
  const bulkListing = async (status: "active" | "inactive") => {
    const targets = chosen.filter((r) => r.partnerId && r.visibility !== "none");
    let ok = 0;
    for (const r of targets) {
      try {
        await apiFetch(`/admin/resources/partners/${r.partnerId}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        ok++;
      } catch {
        /* reported below */
      }
    }
    await qc.invalidateQueries({ queryKey: ["admin"] });
    setNote(
      `${ok} of ${targets.length} public listings are now ${status === "active" ? "visible" : "hidden"}.`,
    );
    setSelected(new Set());
  };
  const reset = (fn: () => void) => {
    fn();
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="pl-page-title">Professionals</h1>
          <p className="pl-help !mt-1">
            Every IOMA partner is one business: its B2B account, orders and pricing, and
            its public profile, services and bookings.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportRows}>
            {chosen.length ? "Export selected" : "Export"}
          </Button>
          {manage && (
            <Button variant="primary" onClick={() => setAdding(true)}>
              Add professional
            </Button>
          )}
        </div>
      </header>
      <AddProfessionalDialog open={adding} onOpenChange={setAdding} />

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
              {(chosen.length > 0 || note) && (
                <div
                  className="flex flex-wrap items-center gap-2 border-b p-3 text-[13px]"
                  role="status"
                >
                  {chosen.length > 0 && (
                    <span className="font-medium">{chosen.length} selected</span>
                  )}
                  {chosen.length > 0 && manage && (
                    <>
                      <Button small onClick={() => bulkListing("active")}>
                        Show public listing
                      </Button>
                      <Button small onClick={() => bulkListing("inactive")}>
                        Hide public listing
                      </Button>
                    </>
                  )}
                  {chosen.length > 0 && (
                    <Button small onClick={() => setSelected(new Set())}>
                      Clear
                    </Button>
                  )}
                  {note && <span className="pl-help !mt-0">{note}</span>}
                </div>
              )}
              <div className="pl-table-wrap">
                <table className="pl-table">
                  <thead>
                    <tr>
                      <th className="w-10 !text-center">
                        <input
                          type="checkbox"
                          className="pl-check"
                          aria-label="Select all rows on this page"
                          checked={
                            d.items.length > 0 &&
                            d.items.every((r) => selected.has(r.key))
                          }
                          onChange={(e) =>
                            setSelected(
                              e.target.checked
                                ? new Set(d.items.map((r) => r.key))
                                : new Set(),
                            )
                          }
                        />
                      </th>
                      <th>Business</th>
                      <th>Type</th>
                      <th>Location</th>
                      <th>B2B account</th>
                      <th>Public profile</th>
                      <th>Contact</th>
                      <th>
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.items.map((r) => (
                      <tr
                        key={r.key}
                        className={selected.has(r.key) ? "pl-row--selected" : ""}
                      >
                        <td className="!text-center">
                          <input
                            type="checkbox"
                            className="pl-check"
                            aria-label={`Select ${r.name}`}
                            checked={selected.has(r.key)}
                            onChange={() => toggleRow(r.key)}
                          />
                        </td>
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
                        <td className="!text-end">
                          <BusinessActions
                            row={r}
                            manage={!!access.data?.permissions.includes("b2b.manage")}
                          />
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
