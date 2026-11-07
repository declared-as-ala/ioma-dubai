"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAdminAccess, useAdminQuery, type AdminList } from "@/hooks/use-admin";
import { useAdminFormat } from "./admin-ui";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { AdminOrderDrawer } from "./admin-order-drawer";
import { Badge, Button as PlButton, IconButton } from "./polaris";
import {
  ShoppingBag,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Edit3,
  Download,
  Building2,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Printer,
  Copy,
  Check,
  Trash2,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

interface OrderMetrics {
  all: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  refunded: number;
  b2c: number;
  b2b: number;
}

export function AdminOrders() {
  const t = useTranslations("AdminExperience");
  const format = useAdminFormat();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const qc = useQueryClient();

  const access = useAdminAccess();
  const canManage = access.data?.permissions.includes("commerce.manage") ?? false;

  // Search & Filter state from URL params
  const qParam = searchParams.get("q") ?? "";
  const statusParam = searchParams.get("status") ?? "all";
  const channelParam = searchParams.get("type") ?? "all";
  const paymentParam = searchParams.get("paymentStatus") ?? "all";
  const pageParam = parseInt(searchParams.get("page") ?? "1", 10);
  const limitParam = parseInt(searchParams.get("limit") ?? "25", 10);

  const [searchQuery, setSearchQuery] = useState(qParam);
  const [selectedStatusTab, setSelectedStatusTab] = useState(statusParam);
  const [selectedChannel, setSelectedChannel] = useState(channelParam);
  const [selectedPayment, setSelectedPayment] = useState(paymentParam);
  const [page, setPage] = useState(pageParam);
  const [limit, setLimit] = useState(limitParam);

  // Selected table row IDs for bulk actions
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerOrderId, setDrawerOrderId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<"view" | "edit" | "create">("view");

  // Sync internal state when URL search params change
  useEffect(() => {
    setSearchQuery(qParam);
    setSelectedStatusTab(statusParam);
    setSelectedChannel(channelParam);
    setSelectedPayment(paymentParam);
    setPage(pageParam);
    setLimit(limitParam);
  }, [qParam, statusParam, channelParam, paymentParam, pageParam, limitParam]);

  // Debounced search query update to URL
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery !== qParam) {
        updateFilterUrl({ q: searchQuery, page: "1" });
      }
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery, qParam]);

  // Helper to update query string
  const updateFilterUrl = (params: Record<string, string | null>) => {
    const current = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, val]) => {
      if (val === null || val === "" || val === "all") {
        current.delete(key);
      } else {
        current.set(key, val);
      }
    });
    startTransition(() => {
      router.replace(`${pathname}?${current.toString()}`);
    });
  };

  // Fetch KPI counters
  const { data: metrics } = useAdminQuery<OrderMetrics>("orders/metrics");

  // Build query string for resources/orders
  const queryParts = [`page=${page}`, `limit=${limit}`];
  if (searchQuery.trim()) queryParts.push(`q=${encodeURIComponent(searchQuery.trim())}`);
  if (selectedStatusTab !== "all") {
    if (selectedStatusTab === "refunded") {
      queryParts.push(`paymentStatus=refunded`);
    } else {
      queryParts.push(`fulfillmentStatus=${selectedStatusTab}`);
    }
  }
  if (selectedChannel !== "all") queryParts.push(`type=${selectedChannel}`);
  if (selectedPayment !== "all") queryParts.push(`paymentStatus=${selectedPayment}`);

  const {
    data: listData,
    isLoading,
    isFetching,
  } = useAdminQuery<AdminList>(`resources/orders?${queryParts.join("&")}`);

  const orders = listData?.items || [];
  const totalCount = listData?.total || 0;
  const totalPages = Math.ceil(totalCount / limit) || 1;

  // Delete state
  const [orderToDelete, setOrderToDelete] = useState<{
    _id: string;
    orderNumber: string;
  } | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Single delete mutation
  const singleDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiFetch(`/admin/orders/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      setOrderToDelete(null);
      qc.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "admin",
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return apiFetch(`/admin/orders/bulk-delete`, {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
    },
    onSuccess: () => {
      setShowBulkDeleteModal(false);
      setSelectedRowIds([]);
      qc.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "admin",
      });
    },
  });

  // Bulk update mutation
  const bulkStatusMutation = useMutation({
    mutationFn: async ({
      ids,
      fulfillmentStatus,
    }: {
      ids: string[];
      fulfillmentStatus: string;
    }) => {
      return Promise.all(
        ids.map((id) =>
          apiFetch(`/admin/orders/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ fulfillmentStatus }),
          }),
        ),
      );
    },
    onSuccess: () => {
      setSelectedRowIds([]);
      qc.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "admin",
      });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRowIds(orders.map((o) => o._id));
    } else {
      setSelectedRowIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRowIds((prev) => [...prev, id]);
    } else {
      setSelectedRowIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleOpenDrawer = (id: string, mode: "view" | "edit" = "view") => {
    setDrawerOrderId(id);
    setDrawerMode(mode);
    setDrawerOpen(true);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportCsv = () => {
    if (!orders.length) return;
    const headers = [
      "Order Number",
      "Customer",
      "Email",
      "Phone",
      "Type",
      "Fulfillment Status",
      "Payment Status",
      "Total AED",
      "Emirate",
      "City",
      "Created Date",
    ];
    const rows = orders.map((o) => [
      `"${o.orderNumber}"`,
      `"${o.shippingAddress?.fullName || ""}"`,
      `"${o.customerEmail || ""}"`,
      `"${o.shippingAddress?.phone || ""}"`,
      `"${o.type}"`,
      `"${o.fulfillmentStatus}"`,
      `"${o.paymentStatus}"`,
      `"${(o.totalMinor / 100).toFixed(2)}"`,
      `"${o.shippingAddress?.emirate || ""}"`,
      `"${o.shippingAddress?.city || ""}"`,
      `"${new Date(o.createdAt).toISOString()}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `ioma_orders_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedStatusTab !== "all" ||
    selectedChannel !== "all" ||
    selectedPayment !== "all";

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedStatusTab("all");
    setSelectedChannel("all");
    setSelectedPayment("all");
    setPage(1);
    startTransition(() => {
      router.replace(pathname);
    });
  };

  const getFulfillmentBadge = (st: string) => {
    switch (st) {
      case "delivered":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: CheckCircle2,
          label: "Delivered",
        };
      case "shipped":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          icon: Truck,
          label: "Shipped",
        };
      case "processing":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          icon: Clock,
          label: "Processing",
        };
      case "cancelled":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          icon: XCircle,
          label: "Cancelled",
        };
      default:
        return {
          bg: "bg-neutral-100 text-neutral-700 border-neutral-200",
          icon: AlertTriangle,
          label: "Pending",
        };
    }
  };

  const getPaymentBadge = (st: string) => {
    switch (st) {
      case "paid":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          label: "Paid",
        };
      case "authorized":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          label: "Authorized",
        };
      case "refunded":
        return {
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          label: "Refunded",
        };
      case "failed":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          label: "Failed",
        };
      default:
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          label: "Pending",
        };
    }
  };

  const fulfillTone = (st: string): "success" | "neutral" | "warning" | "critical" =>
    st === "delivered"
      ? "success"
      : st === "cancelled"
        ? "critical"
        : st === "processing"
          ? "warning"
          : "neutral";
  const payTone = (st: string): "success" | "neutral" | "warning" | "critical" =>
    st === "paid"
      ? "success"
      : st === "failed"
        ? "critical"
        : st === "refunded" || st === "authorized"
          ? "neutral"
          : "warning";

  const statusTabs = [
    { key: "all", label: "All", count: metrics?.all, tone: "" },
    { key: "pending", label: "Pending", count: metrics?.pending, tone: "" },
    {
      key: "processing",
      label: "Processing",
      count: metrics?.processing,
      tone: "warning",
    },
    { key: "shipped", label: "Shipped", count: metrics?.shipped, tone: "" },
    { key: "delivered", label: "Delivered", count: metrics?.delivered, tone: "success" },
    { key: "cancelled", label: "Cancelled", count: metrics?.cancelled, tone: "critical" },
    { key: "refunded", label: "Refunded", count: metrics?.refunded, tone: "" },
  ];
  const allSelected = orders.length > 0 && selectedRowIds.length === orders.length;

  return (
    <div className="mx-auto max-w-[1280px] space-y-4">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="pl-page-title">Orders</h1>
          <p className="pl-help !mt-0">
            Manage B2C and B2B orders, payment, fulfilment and customer information.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PlButton onClick={exportCsv} disabled={orders.length === 0}>
            <Download />
            Export
          </PlButton>
          {canManage && (
            <PlButton
              variant="primary"
              onClick={() => {
                setDrawerOrderId(null);
                setDrawerMode("create");
                setDrawerOpen(true);
              }}
            >
              <Plus />
              Create order
            </PlButton>
          )}
        </div>
      </div>

      <div className="pl-card pl-card--flush">
        {/* Status views with live counts */}
        <div className="pl-stats" role="tablist" aria-label="Order status">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={selectedStatusTab === tab.key}
              onClick={() => {
                setSelectedStatusTab(tab.key);
                setPage(1);
                updateFilterUrl({ status: tab.key, page: "1" });
              }}
              className={`pl-stat ${tab.tone ? `pl-stat--${tab.tone}` : ""}`}
            >
              <span className="pl-stat-label">{tab.label}</span>
              <span className="pl-stat-value">
                {tab.count === undefined ? "—" : format.number(tab.count)}
              </span>
            </button>
          ))}
        </div>

        {/* Toolbar: search + filters, or the bulk bar once rows are selected */}
        {selectedRowIds.length > 0 ? (
          <div className="pl-toolbar" role="region" aria-label="Bulk actions">
            <label className="pl-choice">
              <input
                type="checkbox"
                className="pl-check"
                aria-label="Select all orders on this page"
                checked={allSelected}
                ref={(node) => {
                  if (node)
                    node.indeterminate = selectedRowIds.length > 0 && !allSelected;
                }}
                onChange={() => handleSelectAll(selectedRowIds.length === 0)}
              />
              <span className="font-semibold">
                {selectedRowIds.length} order{selectedRowIds.length > 1 ? "s" : ""}{" "}
                selected
              </span>
            </label>
            <div className="ms-auto flex flex-wrap items-center gap-2">
              {canManage && (
                <>
                  <PlButton
                    small
                    disabled={bulkStatusMutation.isPending}
                    onClick={() =>
                      bulkStatusMutation.mutate({
                        ids: selectedRowIds,
                        fulfillmentStatus: "processing",
                      })
                    }
                  >
                    Mark processing
                  </PlButton>
                  <PlButton
                    small
                    disabled={bulkStatusMutation.isPending}
                    onClick={() =>
                      bulkStatusMutation.mutate({
                        ids: selectedRowIds,
                        fulfillmentStatus: "shipped",
                      })
                    }
                  >
                    <Truck />
                    Mark shipped
                  </PlButton>
                  <PlButton
                    small
                    variant="destructive"
                    disabled={bulkDeleteMutation.isPending}
                    onClick={() => setShowBulkDeleteModal(true)}
                  >
                    <Trash2 />
                    Delete
                  </PlButton>
                </>
              )}
              <PlButton small variant="plain" onClick={() => setSelectedRowIds([])}>
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
                aria-label="Search orders"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders by number, customer, phone or tracking"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery("")}
                  className="pl-icon-btn pl-search-clear"
                >
                  <X />
                </button>
              )}
            </div>
            <select
              aria-label="Channel"
              value={selectedChannel}
              onChange={(e) => {
                setSelectedChannel(e.target.value);
                setPage(1);
                updateFilterUrl({ type: e.target.value, page: "1" });
              }}
              className="pl-input !w-auto"
            >
              <option value="all">All channels</option>
              <option value="b2c">B2C retail</option>
              <option value="b2b">B2B professional</option>
            </select>
            <select
              aria-label="Payment status"
              value={selectedPayment}
              onChange={(e) => {
                setSelectedPayment(e.target.value);
                setPage(1);
                updateFilterUrl({ paymentStatus: e.target.value, page: "1" });
              }}
              className="pl-input !w-auto"
            >
              <option value="all">All payment statuses</option>
              <option value="paid">Paid</option>
              <option value="authorized">Authorized</option>
              <option value="pending">Payment pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            {hasActiveFilters && (
              <PlButton variant="plain" onClick={clearAllFilters}>
                <X />
                Clear all
              </PlButton>
            )}
          </div>
        )}

        {/* Orders table */}
        <div
          className="pl-table-wrap"
          style={{ borderTop: "1px solid var(--pl-border-subtle)" }}
          aria-busy={isFetching}
        >
          <table
            className="pl-table"
            style={{ minWidth: 1020, opacity: isFetching && !isLoading ? 0.6 : 1 }}
          >
            <thead>
              <tr>
                <th className="w-10 !text-center">
                  <input
                    type="checkbox"
                    className="pl-check"
                    aria-label="Select all orders on this page"
                    checked={allSelected}
                    ref={(node) => {
                      if (node)
                        node.indeterminate = selectedRowIds.length > 0 && !allSelected;
                    }}
                    disabled={orders.length === 0}
                    onChange={() => handleSelectAll(selectedRowIds.length === 0)}
                  />
                </th>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Location</th>
                <th>Fulfilment</th>
                <th>Payment</th>
                <th className="pl-num">Total</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={9}>
                      <div className="ioma-skel h-4 w-full" />
                    </td>
                  </tr>
                ))}

              {!isLoading && orders.length === 0 && (
                <tr>
                  <td colSpan={9} className="!py-12 text-center">
                    <ShoppingBag
                      className="mx-auto size-8"
                      style={{ color: "var(--pl-placeholder)" }}
                    />
                    <p className="mt-2 text-[13px] font-semibold">No orders found</p>
                    <p className="pl-help">
                      {hasActiveFilters
                        ? "Try adjusting or clearing your search filters."
                        : "No customer or B2B orders recorded yet."}
                    </p>
                  </td>
                </tr>
              )}

              {orders.map((order) => {
                const isSelected = selectedRowIds.includes(order._id);
                const fulfill = getFulfillmentBadge(order.fulfillmentStatus);
                const pay = getPaymentBadge(order.paymentStatus);
                const isB2B = order.type === "b2b";
                return (
                  <tr
                    key={order._id}
                    onClick={() => handleOpenDrawer(order._id, "view")}
                    className={`cursor-pointer ${isSelected ? "pl-row--selected" : ""}`}
                  >
                    <td className="!text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="pl-check"
                        aria-label={`Select order ${order.orderNumber}`}
                        checked={isSelected}
                        onChange={(e) => handleSelectRow(order._id, e.target.checked)}
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{order.orderNumber}</span>
                        {isB2B && <Badge>B2B</Badge>}
                      </div>
                      <span className="pl-help block !mt-0">
                        {(order.items || []).length} items
                      </span>
                    </td>
                    <td>
                      <span className="block max-w-[200px] truncate font-medium">
                        {order.shippingAddress?.fullName ||
                          order.customerEmail ||
                          "Guest"}
                      </span>
                      <span className="pl-help block max-w-[200px] truncate !mt-0">
                        {isB2B && order.companyName ? (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="size-3" />
                            {order.companyName}
                          </span>
                        ) : (
                          order.customerEmail || "—"
                        )}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
                      {format.date(order.createdAt, true)}
                    </td>
                    <td className="max-w-[140px] truncate">
                      {[order.shippingAddress?.city, order.shippingAddress?.emirate]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                    <td className="whitespace-nowrap">
                      <Badge
                        tone={fulfillTone(order.fulfillmentStatus)}
                        icon={<fulfill.icon />}
                      >
                        {fulfill.label}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap">
                      <Badge tone={payTone(order.paymentStatus)}>{pay.label}</Badge>
                    </td>
                    <td className="pl-num whitespace-nowrap font-medium">
                      {format.money(order.totalMinor)}
                    </td>
                    <td
                      className="whitespace-nowrap !text-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-0.5">
                        <IconButton
                          label="View order"
                          onClick={() => handleOpenDrawer(order._id, "view")}
                        >
                          <Eye />
                        </IconButton>
                        {canManage && (
                          <>
                            <IconButton
                              label="Edit order"
                              onClick={() => handleOpenDrawer(order._id, "edit")}
                            >
                              <Edit3 />
                            </IconButton>
                            <IconButton
                              label="Delete order"
                              destructive
                              onClick={() =>
                                setOrderToDelete({
                                  _id: order._id,
                                  orderNumber: order.orderNumber,
                                })
                              }
                            >
                              <Trash2 />
                            </IconButton>
                          </>
                        )}
                        <IconButton
                          label={copiedId === order._id ? "Copied" : "Copy order ID"}
                          onClick={() => handleCopyId(order._id)}
                        >
                          {copiedId === order._id ? <Check /> : <Copy />}
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          className="pl-toolbar justify-between"
          style={{ background: "var(--pl-surface-subdued)" }}
        >
          <span className="pl-help !mt-0">
            {totalCount === 0
              ? "0 orders"
              : `${(page - 1) * limit + 1}–${Math.min(page * limit, totalCount)} of ${format.number(totalCount)} orders`}
          </span>
          <div className="flex items-center gap-2">
            <select
              aria-label="Rows per page"
              value={limit}
              onChange={(e) => {
                const newLimit = parseInt(e.target.value, 10);
                setLimit(newLimit);
                setPage(1);
                updateFilterUrl({ limit: String(newLimit), page: "1" });
              }}
              className="pl-input !w-auto"
            >
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
            <IconButton
              label="Previous page"
              disabled={page <= 1}
              onClick={() => {
                const newPage = page - 1;
                setPage(newPage);
                updateFilterUrl({ page: String(newPage) });
              }}
            >
              <ChevronLeft className="rtl:rotate-180" />
            </IconButton>
            <span className="font-medium tabular-nums">
              {page} / {totalPages}
            </span>
            <IconButton
              label="Next page"
              disabled={page >= totalPages}
              onClick={() => {
                const newPage = page + 1;
                setPage(newPage);
                updateFilterUrl({ page: String(newPage) });
              }}
            >
              <ChevronRight className="rtl:rotate-180" />
            </IconButton>
          </div>
        </div>
      </div>

      {/* Right-side view/edit order drawer */}
      <AdminOrderDrawer
        orderId={drawerOrderId}
        initialMode={drawerMode}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onOrderUpdated={() => {
          qc.invalidateQueries({
            predicate: (query) => query.queryKey[0] === "admin",
          });
        }}
      />

      {/* Single order delete confirmation */}
      <Dialog
        open={!!orderToDelete}
        onOpenChange={(open) => !open && setOrderToDelete(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete order</DialogTitle>
            <DialogDescription>
              Delete order <strong>{orderToDelete?.orderNumber}</strong>? It will be
              archived and hidden from active processing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <PlButton onClick={() => setOrderToDelete(null)}>Cancel</PlButton>
            <PlButton
              variant="primary"
              disabled={singleDeleteMutation.isPending}
              onClick={() =>
                orderToDelete && singleDeleteMutation.mutate(orderToDelete._id)
              }
            >
              {singleDeleteMutation.isPending ? "Deleting…" : "Delete order"}
            </PlButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk delete confirmation */}
      <Dialog open={showBulkDeleteModal} onOpenChange={setShowBulkDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {selectedRowIds.length} orders</DialogTitle>
            <DialogDescription>
              Delete <strong>{selectedRowIds.length} selected orders</strong>? They will
              be archived and removed from active processing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <PlButton onClick={() => setShowBulkDeleteModal(false)}>Cancel</PlButton>
            <PlButton
              variant="primary"
              disabled={bulkDeleteMutation.isPending}
              onClick={() => bulkDeleteMutation.mutate(selectedRowIds)}
            >
              {bulkDeleteMutation.isPending
                ? "Deleting…"
                : `Delete ${selectedRowIds.length} orders`}
            </PlButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
