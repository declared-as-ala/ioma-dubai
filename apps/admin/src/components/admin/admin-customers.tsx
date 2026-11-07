"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Badge, Button as PlButton, IconButton } from "./polaris";
import { useTranslations } from "next-intl";
import { useAdminAccess, useAdminQuery, type AdminList } from "@/hooks/use-admin";
import { useAdminFormat } from "./admin-ui";
import { useRouter, usePathname } from "@/i18n/navigation";
import { AdminCustomerDrawer } from "./admin-customer-drawer";
import { AdminCustomerCreateModal } from "./admin-customer-create-modal";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Edit3,
  Lock,
  Unlock,
  KeyRound,
  Download,
  Trash2,
  Building2,
  Briefcase,
  CheckCircle2,
  Clock,
  ShoppingBag,
  Sparkles,
  TrendingUp,
} from "lucide-react";

interface CustomerMetrics {
  totalCustomers: number;
  newThisMonth: number;
  activeCustomers: number;
  customersWithOrders: number;
  professionalAccounts: number;
}

export function AdminCustomers() {
  const t = useTranslations("AdminExperience");
  const format = useAdminFormat();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const access = useAdminAccess();
  const canManage = access.data?.permissions.includes("customers.manage") ?? false;

  // Search & Filter state from URL params
  const qParam = searchParams.get("q") ?? "";
  const typeParam = searchParams.get("type") ?? "all";
  const statusParam = searchParams.get("status") ?? "all";
  const hasOrdersParam = searchParams.get("hasOrders") ?? "all";
  const proStatusParam = searchParams.get("proStatus") ?? "all";
  const pageParam = Number(searchParams.get("page") ?? "1") || 1;
  const limitParam = Number(searchParams.get("limit") ?? "25") || 25;

  const [searchTerm, setSearchTerm] = useState(qParam);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"view" | "edit">("view");
  const [drawerTab, setDrawerTab] = useState("overview");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Sync search input if URL changes externally
  useEffect(() => {
    setSearchTerm(qParam);
  }, [qParam]);

  // Debounced search updater
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== qParam) {
        updateParams({ q: searchTerm || undefined, page: 1 });
      }
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const updateParams = (updates: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === "" || v === "all") {
        next.delete(k);
      } else {
        next.set(k, String(v));
      }
    });
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`);
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    startTransition(() => {
      router.replace(pathname);
    });
  };

  const hasActiveFilters =
    !!qParam ||
    typeParam !== "all" ||
    statusParam !== "all" ||
    hasOrdersParam !== "all" ||
    proStatusParam !== "all";

  // Build query string for API
  const apiQueryString = new URLSearchParams();
  apiQueryString.set("page", String(pageParam));
  apiQueryString.set("limit", String(limitParam));
  if (qParam) apiQueryString.set("q", qParam);
  if (typeParam !== "all") apiQueryString.set("type", typeParam);
  if (statusParam !== "all") apiQueryString.set("status", statusParam);
  if (hasOrdersParam !== "all") apiQueryString.set("hasOrders", hasOrdersParam);
  if (proStatusParam !== "all") apiQueryString.set("professionalStatus", proStatusParam);

  // Queries
  const listQuery = useAdminQuery<AdminList>(
    `resources/customers?${apiQueryString.toString()}`,
  );
  const metricsQuery = useAdminQuery<CustomerMetrics>("customers/metrics");

  const customers = listQuery.data?.items || [];
  const totalRecords = listQuery.data?.total || 0;
  const totalPages = Math.ceil(totalRecords / limitParam) || 1;
  const metrics = metricsQuery.data;

  // Multi-selection (current page). Cleared whenever the result set changes.
  const cache = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmStatus, setConfirmStatus] = useState<
    "locked" | "active" | "deleted" | null
  >(null);
  const [bulkMessage, setBulkMessage] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);
  useEffect(() => {
    setSelected([]);
    setConfirmStatus(null);
  }, [
    qParam,
    typeParam,
    statusParam,
    hasOrdersParam,
    proStatusParam,
    pageParam,
    limitParam,
  ]);

  const visibleIds = customers.map((c: any) => c._id as string);
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const toggleOne = (id: string) =>
    setSelected((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  const selectedRows = customers.filter((c: any) => selected.includes(c._id));

  const bulkStatus = useMutation({
    mutationFn: async (status: "locked" | "active" | "deleted") => {
      let done = 0;
      const failed: string[] = [];
      for (const id of selected) {
        try {
          await apiFetch(`/admin/customers/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
          });
          done += 1;
        } catch (e) {
          failed.push(e instanceof Error ? e.message : "failed");
        }
      }
      return { done, failed, status };
    },
    onSuccess: async ({ done, failed, status }) => {
      setConfirmStatus(null);
      setSelected([]);
      setBulkMessage(
        failed.length
          ? {
              kind: "error",
              text: `${done} updated, ${failed.length} failed: ${failed[0]}`,
            }
          : {
              kind: "ok",
              text: `${done} customer${done === 1 ? "" : "s"} ${status === "locked" ? "suspended" : status === "deleted" ? "deleted" : "reactivated"}.`,
            },
      );
      await cache.invalidateQueries();
    },
    onError: (e) => {
      setConfirmStatus(null);
      setBulkMessage({
        kind: "error",
        text: e instanceof Error ? e.message : "Update failed.",
      });
    },
  });

  const openCustomer = (id: string, mode: "view" | "edit" = "view", tab = "overview") => {
    setSelectedCustomerId(id);
    setDrawerMode(mode);
    setDrawerTab(tab);
    setDrawerOpen(true);
  };

  const exportCsv = (source: any[] = customers) => {
    if (!source.length) return;
    const headers = [
      "Customer ID",
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Account Type",
      "Status",
      "Order Count",
      "Lifetime Spend (AED)",
      "Created Date",
    ];
    const rows = source.map((c: any) => [
      c._id,
      `"${c.firstName || ""}"`,
      `"${c.lastName || ""}"`,
      c.email || "",
      c.phone || "",
      c.isProfessional ? "Professional" : "Customer",
      c.status || "active",
      c.orderCount || 0,
      ((c.lifetimeSpendMinor || 0) / 100).toFixed(2),
      c.createdAt || "",
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `ioma_customers_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = [
    { label: "Total customers", value: metrics?.totalCustomers, tone: "" },
    { label: "New this month", value: metrics?.newThisMonth, tone: "success" },
    { label: "Active", value: metrics?.activeCustomers, tone: "" },
    { label: "With orders", value: metrics?.customersWithOrders, tone: "" },
    { label: "Pro accounts", value: metrics?.professionalAccounts, tone: "" },
  ];

  return (
    <div className="mx-auto max-w-[1280px] space-y-4">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="pl-page-title">Customers</h1>
          <p className="pl-help !mt-0">
            Manage customer profiles, order histories, addresses and accounts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PlButton onClick={() => exportCsv()} disabled={customers.length === 0}>
            <Download />
            Export
          </PlButton>
          {canManage && (
            <PlButton variant="primary" onClick={() => setCreateModalOpen(true)}>
              <UserPlus />
              Add customer
            </PlButton>
          )}
        </div>
      </div>

      {bulkMessage && (
        <div
          role={bulkMessage.kind === "error" ? "alert" : "status"}
          className="pl-card flex items-start justify-between gap-3 !p-3"
          style={{
            color:
              bulkMessage.kind === "error" ? "var(--pl-critical)" : "var(--pl-success)",
          }}
        >
          <span>{bulkMessage.text}</span>
          <IconButton label="Dismiss" onClick={() => setBulkMessage(null)}>
            <X />
          </IconButton>
        </div>
      )}

      <div className="pl-card pl-card--flush">
        {/* Summary strip */}
        <div className="pl-stats">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`pl-stat ${s.tone ? `pl-stat--${s.tone}` : ""}`}
              style={{ cursor: "default" }}
            >
              <span className="pl-stat-label">{s.label}</span>
              <span className="pl-stat-value">
                {s.value === undefined ? "—" : format.number(s.value)}
              </span>
            </div>
          ))}
        </div>

        {/* Toolbar: filters, or the bulk bar once rows are selected */}
        {selected.length > 0 && canManage ? (
          <div className="pl-toolbar" role="region" aria-label="Bulk actions">
            <label className="pl-choice">
              <input
                type="checkbox"
                className="pl-check"
                aria-label="Select all customers on this page"
                checked={allSelected}
                ref={(node) => {
                  if (node) node.indeterminate = selected.length > 0 && !allSelected;
                }}
                onChange={() => setSelected(selected.length > 0 ? [] : visibleIds)}
              />
              <span className="font-semibold">{selected.length} selected</span>
            </label>
            <div className="ms-auto flex flex-wrap items-center gap-2">
              <PlButton small onClick={() => exportCsv(selectedRows)}>
                <Download />
                Export selected
              </PlButton>
              <PlButton
                small
                onClick={() => setConfirmStatus("active")}
                disabled={bulkStatus.isPending}
              >
                <Unlock />
                Reactivate
              </PlButton>
              <PlButton
                small
                variant="destructive"
                onClick={() => setConfirmStatus("locked")}
                disabled={bulkStatus.isPending}
              >
                <Lock />
                Suspend
              </PlButton>
              <PlButton
                small
                variant="destructive"
                onClick={() => setConfirmStatus("deleted")}
                disabled={bulkStatus.isPending}
              >
                <Trash2 />
                Delete
              </PlButton>
              <PlButton small variant="plain" onClick={() => setSelected([])}>
                Clear
              </PlButton>
            </div>
          </div>
        ) : (
          <div className="pl-toolbar">
            <div className="pl-search">
              <Search aria-hidden />
              <input
                type="text"
                className="pl-input"
                aria-label="Search customers"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search customers by name, email, phone or company"
              />
              {searchTerm && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchTerm("")}
                  className="pl-icon-btn pl-search-clear"
                >
                  <X />
                </button>
              )}
            </div>
            <select
              aria-label="Account type"
              value={typeParam}
              onChange={(e) => updateParams({ type: e.target.value, page: 1 })}
              className="pl-input !w-auto"
            >
              <option value="all">All types</option>
              <option value="customer">Retail customer</option>
              <option value="professional">Professional (B2B)</option>
            </select>
            <select
              aria-label="Account status"
              value={statusParam}
              onChange={(e) => updateParams({ status: e.target.value, page: 1 })}
              className="pl-input !w-auto"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="locked">Suspended / locked</option>
              <option value="deleted">Deleted</option>
            </select>
            <select
              aria-label="Orders"
              value={hasOrdersParam}
              onChange={(e) => updateParams({ hasOrders: e.target.value, page: 1 })}
              className="pl-input !w-auto"
            >
              <option value="all">Orders: all</option>
              <option value="yes">With orders</option>
              <option value="no">No orders</option>
            </select>
            {hasActiveFilters && (
              <PlButton variant="plain" onClick={clearFilters}>
                <X />
                Clear all
              </PlButton>
            )}
          </div>
        )}

        {confirmStatus && (
          <div
            role="alertdialog"
            aria-label="Confirm bulk action"
            className="pl-toolbar justify-between"
            style={{ background: "var(--pl-surface-subdued)" }}
          >
            <span>
              {confirmStatus === "locked"
                ? "Suspend"
                : confirmStatus === "deleted"
                  ? "Delete"
                  : "Reactivate"}{" "}
              {selected.length} customer{selected.length === 1 ? "" : "s"}?
              {confirmStatus === "locked" && " They will not be able to sign in."}
              {confirmStatus === "deleted" &&
                " They will lose access and be hidden from active lists; order history is kept."}
            </span>
            <span className="flex gap-2">
              <PlButton
                small
                onClick={() => setConfirmStatus(null)}
                disabled={bulkStatus.isPending}
              >
                Cancel
              </PlButton>
              <PlButton
                small
                variant="primary"
                disabled={bulkStatus.isPending}
                onClick={() => bulkStatus.mutate(confirmStatus)}
              >
                {bulkStatus.isPending
                  ? "Working…"
                  : confirmStatus === "locked"
                    ? "Suspend"
                    : confirmStatus === "deleted"
                      ? "Delete"
                      : "Reactivate"}
              </PlButton>
            </span>
          </div>
        )}

        {/* Table */}
        <div
          className="pl-table-wrap"
          style={{ borderTop: "1px solid var(--pl-border-subtle)" }}
        >
          <table className="pl-table" style={{ minWidth: 980 }}>
            <thead>
              <tr>
                {canManage && (
                  <th className="w-10 !text-center">
                    <input
                      type="checkbox"
                      className="pl-check"
                      aria-label="Select all customers on this page"
                      checked={allSelected}
                      ref={(node) => {
                        if (node)
                          node.indeterminate = selected.length > 0 && !allSelected;
                      }}
                      disabled={listQuery.isLoading || visibleIds.length === 0}
                      onChange={() => setSelected(selected.length > 0 ? [] : visibleIds)}
                    />
                  </th>
                )}
                <th>Customer</th>
                <th>Contact</th>
                <th>Type</th>
                <th className="pl-num">Orders</th>
                <th className="pl-num">Lifetime spend</th>
                <th>Last order</th>
                <th>Created</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {listQuery.isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx}>
                    <td colSpan={canManage ? 10 : 9}>
                      <div className="ioma-skel h-4 w-full" />
                    </td>
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 10 : 9} className="!py-10 text-center pl-help">
                    {hasActiveFilters
                      ? "No customers match the current filters."
                      : "No customer records found."}
                  </td>
                </tr>
              ) : (
                customers.map((c: any) => {
                  const initials =
                    `${c.firstName?.[0] || ""}${c.lastName?.[0] || ""}`.toUpperCase() ||
                    "CU";
                  const isSelected = selected.includes(c._id);
                  return (
                    <tr
                      key={c._id}
                      onClick={() => openCustomer(c._id, "view")}
                      className={`cursor-pointer ${isSelected ? "pl-row--selected" : ""}`}
                    >
                      {canManage && (
                        <td className="!text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="pl-check"
                            aria-label={`Select ${c.firstName ?? ""} ${c.lastName ?? ""}`.trim()}
                            checked={isSelected}
                            onChange={() => toggleOne(c._id)}
                          />
                        </td>
                      )}
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--pl-bg)] text-[11px] font-semibold">
                            {initials}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium">
                              {c.firstName} {c.lastName}
                            </span>
                            <span className="pl-help block truncate !mt-0">
                              {c.city || c.emirate
                                ? `${c.city || ""}${c.city && c.emirate ? ", " : ""}${c.emirate || ""}`
                                : c.email}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="block truncate">{c.email}</span>
                        <span className="pl-help block !mt-0">{c.phone || "—"}</span>
                      </td>
                      <td>
                        {c.roles?.includes("professional_approved") ? (
                          <Badge tone="success" icon={<Briefcase />}>
                            Approved pro
                          </Badge>
                        ) : c.roles?.includes("professional_pending") ||
                          c.proStatus === "pending_review" ? (
                          <Badge tone="warning" icon={<Clock />}>
                            Pro pending
                          </Badge>
                        ) : (
                          <Badge>Customer</Badge>
                        )}
                        {c.companyName && (
                          <span className="pl-help block truncate !mt-1 max-w-[140px]">
                            {c.companyName}
                          </span>
                        )}
                      </td>
                      <td className="pl-num">{c.orderCount || 0}</td>
                      <td className="pl-num">
                        {format.money(c.lifetimeSpendMinor || 0)}
                      </td>
                      <td className="pl-help !mt-0 whitespace-nowrap">
                        {c.lastOrderAt ? format.date(c.lastOrderAt) : "Never"}
                      </td>
                      <td className="pl-help !mt-0 whitespace-nowrap">
                        {format.date(c.createdAt)}
                      </td>
                      <td>
                        {c.status === "active" ? (
                          <Badge tone="success">Active</Badge>
                        ) : c.status === "locked" ? (
                          <Badge tone="warning">Suspended</Badge>
                        ) : (
                          <Badge>Deleted</Badge>
                        )}
                      </td>
                      <td className="!text-end" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-0.5">
                          <IconButton
                            label="View customer"
                            onClick={() => openCustomer(c._id, "view")}
                          >
                            <Eye />
                          </IconButton>
                          {canManage && (
                            <IconButton
                              label="Edit customer"
                              onClick={() => openCustomer(c._id, "edit")}
                            >
                              <Edit3 />
                            </IconButton>
                          )}
                          {canManage && c.status !== "deleted" && (
                            <IconButton
                              label="Delete customer"
                              destructive
                              onClick={() => {
                                setSelected([c._id]);
                                setConfirmStatus("deleted");
                              }}
                            >
                              <Trash2 />
                            </IconButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          className="pl-toolbar justify-between"
          style={{ background: "var(--pl-surface-subdued)" }}
        >
          <span className="pl-help !mt-0">
            {totalRecords > 0 ? (pageParam - 1) * limitParam + 1 : 0}–
            {Math.min(pageParam * limitParam, totalRecords)} of{" "}
            {format.number(totalRecords)} customers
          </span>
          <div className="flex items-center gap-2">
            <select
              aria-label="Rows per page"
              value={limitParam}
              onChange={(e) => updateParams({ limit: e.target.value, page: 1 })}
              className="pl-input !w-auto"
            >
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
            <IconButton
              label="Previous page"
              disabled={pageParam <= 1}
              onClick={() => updateParams({ page: pageParam - 1 })}
            >
              <ChevronLeft className="rtl:rotate-180" />
            </IconButton>
            <span className="font-medium tabular-nums">
              {pageParam} / {totalPages}
            </span>
            <IconButton
              label="Next page"
              disabled={pageParam >= totalPages}
              onClick={() => updateParams({ page: pageParam + 1 })}
            >
              <ChevronRight className="rtl:rotate-180" />
            </IconButton>
          </div>
        </div>
      </div>

      {/* Right-side view/edit drawer */}
      <AdminCustomerDrawer
        customerId={selectedCustomerId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        initialMode={drawerMode}
        initialTab={drawerTab}
      />

      {/* Create customer modal */}
      <AdminCustomerCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={(id) => openCustomer(id, "view")}
      />
    </div>
  );
}
