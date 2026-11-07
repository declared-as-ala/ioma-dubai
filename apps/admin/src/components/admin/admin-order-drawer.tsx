"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAdminFormat } from "./admin-ui";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/shop/product-image";
import { Badge, Button as PlButton, IconButton, SegmentedControl } from "./polaris";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EMIRATES } from "@ioma/config";
import {
  ShoppingBag,
  Package,
  Truck,
  User,
  MapPin,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Edit3,
  Trash2,
  Plus,
  ExternalLink,
  Printer,
  Building2,
  CreditCard,
  Phone,
  Mail,
  RefreshCw,
  Search,
  Copy,
  Check,
  X,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Link } from "@/i18n/navigation";

interface AdminOrderDrawerProps {
  orderId: string | null;
  initialMode?: "view" | "edit" | "create";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated?: () => void;
}

const CARRIERS = [
  "Emirates Post",
  "DHL Express",
  "Aramex",
  "Fetchr",
  "SMSA Express",
  "FedEx UAE",
  "IOMA Courier",
  "Other",
];

export function AdminOrderDrawer({
  orderId,
  initialMode = "view",
  open,
  onOpenChange,
  onOrderUpdated,
}: AdminOrderDrawerProps) {
  const t = useTranslations("AdminExperience");
  const format = useAdminFormat();
  const qc = useQueryClient();

  const [mode, setMode] = useState<"view" | "edit" | "create">(initialMode);
  const [orderChannel, setOrderChannel] = useState<"b2c" | "b2b">("b2c");
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);

  // Edit form state
  const [fulfillmentStatus, setFulfillmentStatus] = useState<string>("pending");
  const [paymentStatus, setPaymentStatus] = useState<string>("pending");
  const [shippingProvider, setShippingProvider] = useState<string>("");
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [trackingUrl, setTrackingUrl] = useState<string>("");
  const [shippingNote, setShippingNote] = useState<string>("");
  const [shipmentDate, setShipmentDate] = useState<string>("");
  const [adminNote, setAdminNote] = useState<string>("");

  // Customer / Address edit state
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [addrEmirate, setAddrEmirate] = useState("Dubai");
  const [addrCity, setAddrCity] = useState("Dubai");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");

  // Items edit state
  const [items, setItems] = useState<any[]>([]);

  // Add product modal state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<any | null>(null);
  const [addProductQty, setAddProductQty] = useState(1);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Save feedback state
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Clipboard copy indicators
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState(false);

  // Fetch full order details
  const detailQuery = useQuery<{
    record: Record<string, any>;
    relations: Record<string, any>;
  }>({
    queryKey: ["admin", "resource", "orders", orderId],
    queryFn: () => apiFetch<any>(`/admin/resources/orders/${orderId}`),
    enabled: !!orderId && open,
  });

  const record = detailQuery.data?.record;
  const relations = detailQuery.data?.relations || {};
  const isLoading = detailQuery.isLoading;
  const isError = detailQuery.isError;
  const refetch = detailQuery.refetch;

  // Fetch catalog for product selector
  const { data: catalogData } = useQuery({
    queryKey: ["admin", "products-selector", productSearchTerm],
    queryFn: () =>
      apiFetch<any>(
        `/admin/resources/products?limit=25&q=${encodeURIComponent(productSearchTerm)}`,
      ),
    enabled: showAddProductModal,
  });

  // Sync mode with initialMode on open
  useEffect(() => {
    if (open) {
      setIsDirty(false);
      setShowUnsavedDialog(false);
      setPendingClose(false);
      setShowAddProductModal(false);
      setShowDeleteModal(false);
      setSaveError(null);
      setSaveSuccess(false);

      if (!orderId || initialMode === "create") {
        setMode("create");
        setOrderChannel("b2c");
        setFulfillmentStatus("pending");
        setPaymentStatus("pending");
        setShippingProvider("");
        setTrackingNumber("");
        setTrackingUrl("");
        setShippingNote("");
        setShipmentDate("");
        setAdminNote("");
        setCustomerName("");
        setCustomerEmail("");
        setAddrPhone("");
        setSecondaryPhone("");
        setAddrEmirate("Dubai");
        setAddrCity("Dubai");
        setAddrLine1("");
        setAddrLine2("");
        setDeliveryInstructions("");
        setItems([]);
      } else {
        setMode(initialMode);
      }
    }
  }, [open, initialMode, orderId]);

  // Sync record data into form
  useEffect(() => {
    if (record && mode !== "create") {
      setFulfillmentStatus(record.fulfillmentStatus || "pending");
      setPaymentStatus(record.paymentStatus || "pending");
      setShippingProvider(record.shippingProvider || "");
      setTrackingNumber(record.trackingNumber || "");
      setTrackingUrl(record.trackingUrl || "");
      setShippingNote(record.shippingNote || "");

      let formattedDate = "";
      if (record.shipmentDate) {
        try {
          const d = new Date(record.shipmentDate);
          if (!isNaN(d.getTime())) {
            formattedDate = d.toISOString().slice(0, 16);
          }
        } catch {
          formattedDate = "";
        }
      }
      setShipmentDate(formattedDate);
      setAdminNote("");

      const addr = record.shippingAddress || {};
      setCustomerName(addr.fullName || record.customerName || "");
      setCustomerEmail(record.customerEmail || "");
      setAddrPhone(addr.phone || "");
      setSecondaryPhone(addr.secondaryPhone || "");
      setAddrEmirate(addr.emirate || "Dubai");
      setAddrCity(addr.city || "Dubai");
      setAddrLine1(addr.addressLine1 || "");
      setAddrLine2(addr.addressLine2 || "");
      setDeliveryInstructions(addr.instructions || record.shippingNote || "");

      setItems(record.items || []);
      setIsDirty(false);
    }
  }, [record, mode]);

  // Mutation for creating new order
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiFetch(`/admin/orders`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      setIsDirty(false);
      setSaveError(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
      qc.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "admin",
      });
      onOrderUpdated?.();
      onOpenChange(false);
    },
    onError: (err: any) => {
      console.error("Failed to create order:", err);
      setSaveError(err?.message || "Failed to create order.");
    },
  });

  // Mutation for saving order changes
  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiFetch(`/admin/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      setIsDirty(false);
      setSaveError(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
      qc.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "admin",
      });
      refetch();
      onOrderUpdated?.();
      setMode("view");
    },
    onError: (err: any) => {
      console.error("Failed to save order:", err);
      setSaveError(err?.message || "Failed to save order modifications.");
    },
  });

  // Mutation for deleting order
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/admin/orders/${orderId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      setShowDeleteModal(false);
      onOpenChange(false);
      qc.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "admin",
      });
      onOrderUpdated?.();
    },
  });

  // Calculate live totals for drawer items
  const subtotalMinor = items.reduce(
    (sum, item) => sum + (item.unitPriceMinorSnapshot || 0) * (item.qty || 1),
    0,
  );
  const taxMinor = Math.round(subtotalMinor * 0.05);
  const shippingMinor =
    record?.shippingMinor ?? (subtotalMinor >= 30000 || subtotalMinor === 0 ? 0 : 2000);
  const totalMinor = subtotalMinor + taxMinor + shippingMinor;

  const isEditableStatus =
    mode === "create" ||
    ["pending", "processing"].includes(record?.fulfillmentStatus || "pending");
  const isFormEditable = mode === "edit" || mode === "create";

  const handleSave = () => {
    setSaveError(null);
    let isoShipmentDate: string | null = null;
    if (shipmentDate) {
      try {
        const d = new Date(shipmentDate);
        if (!isNaN(d.getTime())) {
          isoShipmentDate = d.toISOString();
        }
      } catch {
        isoShipmentDate = null;
      }
    }

    if (mode === "create") {
      if (items.length === 0) {
        setSaveError("Please add at least one product to create the order.");
        return;
      }
      if (!customerName.trim()) {
        setSaveError("Please enter the customer name.");
        return;
      }
      if (!addrPhone.trim()) {
        setSaveError("Please enter the customer phone number.");
        return;
      }
      if (!addrLine1.trim()) {
        setSaveError("Please enter the delivery address.");
        return;
      }

      const createPayload: any = {
        type: orderChannel,
        customerEmail: customerEmail.trim() || "client@ioma-paris.ae",
        fulfillmentStatus,
        paymentStatus,
        paymentMethod: "cash_on_delivery",
        shippingProvider: shippingProvider.trim() || null,
        trackingNumber: trackingNumber.trim() || null,
        trackingUrl:
          trackingUrl && /^https?:\/\//i.test(trackingUrl.trim())
            ? trackingUrl.trim()
            : null,
        shippingNote: deliveryInstructions.trim() || shippingNote.trim() || null,
        shipmentDate: isoShipmentDate,
        shippingAddress: {
          fullName: customerName.trim(),
          phone: addrPhone.trim(),
          emirate: addrEmirate.trim() || "Dubai",
          city: addrCity.trim() || "Dubai",
          addressLine1: addrLine1.trim(),
          addressLine2: addrLine2.trim() || null,
          secondaryPhone: secondaryPhone.trim() || null,
          instructions: deliveryInstructions.trim() || null,
        },
        items: items.map((it) => {
          const pName = it.productNameSnapshot;
          const enName =
            typeof pName === "object"
              ? pName?.en || it.sku || "Product"
              : String(pName || it.sku || "Product");
          const frName = typeof pName === "object" ? pName?.fr || enName : enName;
          const arName = typeof pName === "object" ? pName?.ar || enName : enName;
          const validVariantId =
            it.variantId && /^[a-f\d]{24}$/i.test(String(it.variantId))
              ? String(it.variantId)
              : undefined;

          return {
            variantId: validVariantId,
            sku: it.sku || "SKU-ITEM",
            productNameSnapshot: { en: enName, fr: frName, ar: arName },
            qty: Math.max(1, Math.round(Number(it.qty) || 1)),
            unitPriceMinorSnapshot: Math.max(
              0,
              Math.round(Number(it.unitPriceMinorSnapshot ?? it.priceMinor ?? 0)),
            ),
          };
        }),
      };

      if (adminNote.trim()) {
        createPayload.adminNote = adminNote.trim();
      }

      createMutation.mutate(createPayload);
      return;
    }

    const payload: any = {
      fulfillmentStatus,
      paymentStatus,
      paymentMethod: "cash_on_delivery",
      shippingProvider: shippingProvider.trim() || null,
      trackingNumber: trackingNumber.trim() || null,
      trackingUrl:
        trackingUrl && /^https?:\/\//i.test(trackingUrl.trim())
          ? trackingUrl.trim()
          : null,
      shippingNote: deliveryInstructions.trim() || shippingNote.trim() || null,
      shipmentDate: isoShipmentDate,
      shippingAddress: {
        fullName:
          customerName.trim() ||
          record?.shippingAddress?.fullName ||
          record?.customerName ||
          "Valued Client",
        phone: addrPhone.trim() || record?.shippingAddress?.phone || "+971500000000",
        emirate: addrEmirate.trim() || record?.shippingAddress?.emirate || "Dubai",
        city: addrCity.trim() || record?.shippingAddress?.city || "Dubai",
        addressLine1:
          addrLine1.trim() || record?.shippingAddress?.addressLine1 || "Dubai",
        addressLine2: addrLine2.trim() || null,
        secondaryPhone: secondaryPhone.trim() || null,
        instructions: deliveryInstructions.trim() || null,
      },
    };

    if (adminNote.trim()) {
      payload.adminNote = adminNote.trim();
    }

    if (isEditableStatus && items.length > 0) {
      payload.items = items.map((it) => {
        const pName = it.productNameSnapshot;
        const enName =
          typeof pName === "object"
            ? pName?.en || it.sku || "Product"
            : String(pName || it.sku || "Product");
        const frName = typeof pName === "object" ? pName?.fr || enName : enName;
        const arName = typeof pName === "object" ? pName?.ar || enName : enName;
        const validVariantId =
          it.variantId && /^[a-f\d]{24}$/i.test(String(it.variantId))
            ? String(it.variantId)
            : undefined;

        return {
          variantId: validVariantId,
          sku: it.sku || "SKU-ITEM",
          productNameSnapshot: { en: enName, fr: frName, ar: arName },
          qty: Math.max(1, Math.round(Number(it.qty) || 1)),
          unitPriceMinorSnapshot: Math.max(
            0,
            Math.round(Number(it.unitPriceMinorSnapshot ?? it.priceMinor ?? 0)),
          ),
        };
      });
    }

    updateMutation.mutate(payload);
  };

  const handleRequestClose = () => {
    if (isDirty) {
      setPendingClose(true);
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleDiscardChanges = () => {
    setIsDirty(false);
    setShowUnsavedDialog(false);
    if (record) {
      setFulfillmentStatus(record.fulfillmentStatus || "pending");
      setPaymentStatus(record.paymentStatus || "pending");
      setShippingProvider(record.shippingProvider || "");
      setTrackingNumber(record.trackingNumber || "");
      setTrackingUrl(record.trackingUrl || "");
      setShippingNote(record.shippingNote || "");
      setShipmentDate(
        record.shipmentDate
          ? new Date(record.shipmentDate).toISOString().slice(0, 16)
          : "",
      );
      setAdminNote("");
      setItems(record.items || []);
    }
    if (pendingClose) {
      onOpenChange(false);
      setPendingClose(false);
    } else {
      setMode("view");
    }
  };

  const handleAddItem = (product: any, variant: any, quantity: number) => {
    const isB2B = mode === "create" ? orderChannel === "b2b" : record?.type === "b2b";
    const selectedVariant = variant || product.variants?.[0];
    const priceMinor = isB2B
      ? (selectedVariant?.b2bPriceMinor ??
        product.b2bPriceMinor ??
        selectedVariant?.b2cPriceMinor ??
        product.retailPriceMinor ??
        product.priceMinor ??
        0)
      : (selectedVariant?.b2cPriceMinor ??
        product.b2cPriceMinor ??
        product.retailPriceMinor ??
        product.priceMinor ??
        0);

    const newItem = {
      variantId: selectedVariant?._id || product._id,
      sku: selectedVariant?.sku || product.sku || "SKU-MANUAL",
      productNameSnapshot: product.name,
      qty: quantity,
      unitPriceMinorSnapshot: priceMinor,
      totalMinor: priceMinor * quantity,
      image: product.media?.cardUrl || product.media?.url || product.images?.[0] || null,
      primaryImage: product.primaryImage || null,
      size: selectedVariant?.size || product.size || null,
    };

    setItems((prev) => [...prev, newItem]);
    setIsDirty(true);
    setShowAddProductModal(false);
    setSelectedProductToAdd(null);
    setAddProductQty(1);
  };

  const handleUpdateItemQty = (index: number, newQty: number) => {
    if (newQty < 1) return;
    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        qty: newQty,
        totalMinor: (next[index].unitPriceMinorSnapshot || 0) * newQty,
      };
      return next;
    });
    setIsDirty(true);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const handleCopyTracking = () => {
    if (!record?.trackingNumber) return;
    navigator.clipboard.writeText(record.trackingNumber);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const handleCopyOrderNumber = () => {
    if (!record?.orderNumber) return;
    navigator.clipboard.writeText(record.orderNumber);
    setCopiedOrderNumber(true);
    setTimeout(() => setCopiedOrderNumber(false), 2000);
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
          label: "Payment Pending",
        };
    }
  };

  const fulfillTone = (st?: string) =>
    st === "delivered"
      ? "success"
      : st === "cancelled"
        ? "critical"
        : st === "processing"
          ? "warning"
          : "neutral";
  const payTone = (st?: string) =>
    st === "paid"
      ? "success"
      : st === "failed"
        ? "critical"
        : st === "pending" || !st
          ? "warning"
          : "neutral";
  const fulfillInfo = getFulfillmentBadge(record?.fulfillmentStatus || "pending");
  const payInfo = getPaymentBadge(record?.paymentStatus || "pending");

  return (
    <>
      <Sheet open={open} onOpenChange={(val) => !val && handleRequestClose()}>
        <SheetContent
          side="right"
          showCloseButton={false}
          style={{ width: "min(1100px, 94vw)", maxWidth: "100vw" }}
          className="admin-shell flex h-full max-w-[100vw] flex-col gap-0 overflow-hidden border-0 bg-[var(--pl-bg)] p-0 shadow-2xl sm:max-w-none"
        >
          {/* 1. STICKY TOP HEADER */}
          <SheetHeader className="sticky top-0 z-30 flex shrink-0 flex-col justify-between gap-3 border-b border-[var(--pl-border)] bg-white px-4 py-3 sm:flex-row sm:items-center sm:px-6">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {mode === "create" ? (
                  <SegmentedControl
                    ariaLabel="Order channel"
                    value={orderChannel}
                    onChange={setOrderChannel}
                    options={[
                      { value: "b2c", label: "B2C retail" },
                      { value: "b2b", label: "B2B pro" },
                    ]}
                  />
                ) : (
                  <Badge>
                    {record?.type === "b2b" ? "B2B professional" : "B2C retail"}
                  </Badge>
                )}

                <SheetTitle className="text-[16px] font-semibold leading-6 tracking-tight">
                  {mode === "create"
                    ? "New order (draft)"
                    : record?.orderNumber || "Order details"}
                </SheetTitle>
                {record?.orderNumber && mode !== "create" && (
                  <IconButton
                    label={copiedOrderNumber ? "Copied" : "Copy order number"}
                    onClick={handleCopyOrderNumber}
                  >
                    {copiedOrderNumber ? <Check /> : <Copy />}
                  </IconButton>
                )}

                {mode === "create" ? (
                  <>
                    <Badge>Draft</Badge>
                    <Badge tone="warning">Cash on delivery</Badge>
                  </>
                ) : (
                  <>
                    <Badge tone={fulfillTone(record?.fulfillmentStatus)}>
                      {fulfillInfo.label}
                    </Badge>
                    <Badge tone={payTone(record?.paymentStatus)}>{payInfo.label}</Badge>
                  </>
                )}
              </div>

              <p className="pl-help !mt-0 flex flex-wrap items-center gap-x-2">
                <span>
                  {mode === "create"
                    ? "New order creation"
                    : `Placed on ${record ? format.date(record.createdAt, true) : "—"}`}
                </span>
                {(customerName || record?.shippingAddress?.fullName) && (
                  <>
                    <span aria-hidden>·</span>
                    <span style={{ color: "var(--pl-text)" }} className="font-medium">
                      {customerName || record?.shippingAddress?.fullName}
                    </span>
                  </>
                )}
                {(customerEmail || record?.customerEmail) && (
                  <>
                    <span aria-hidden>·</span>
                    <span>{customerEmail || record?.customerEmail}</span>
                  </>
                )}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 self-end sm:self-center">
              {mode !== "create" && (
                <PlButton
                  small
                  variant="destructive"
                  onClick={() => setShowDeleteModal(true)}
                  title="Delete order"
                >
                  <Trash2 />
                  <span className="hidden sm:inline">Delete</span>
                </PlButton>
              )}

              {mode === "view" ? (
                <>
                  <PlButton small onClick={() => window.print()}>
                    <Printer />
                    <span className="hidden sm:inline">Print</span>
                  </PlButton>
                  <PlButton small variant="primary" onClick={() => setMode("edit")}>
                    <Edit3 />
                    Edit order
                  </PlButton>
                </>
              ) : mode === "create" ? (
                <>
                  <PlButton small onClick={handleRequestClose}>
                    Cancel
                  </PlButton>
                  <PlButton
                    small
                    variant="primary"
                    onClick={handleSave}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <RefreshCw className="animate-spin" />
                    ) : (
                      <CheckCircle2 />
                    )}
                    Create order
                  </PlButton>
                </>
              ) : (
                <>
                  <PlButton
                    small
                    onClick={() => {
                      if (isDirty) setShowUnsavedDialog(true);
                      else setMode("view");
                    }}
                  >
                    Cancel
                  </PlButton>
                  <PlButton
                    small
                    variant="primary"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <RefreshCw className="animate-spin" />
                    ) : (
                      <CheckCircle2 />
                    )}
                    Save changes
                  </PlButton>
                </>
              )}

              <IconButton label="Close" onClick={handleRequestClose}>
                <X />
              </IconButton>
            </div>
          </SheetHeader>

          {/* 2. MAIN SCROLLABLE CONTENT */}
          <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-5">
            {isLoading && mode !== "create" && (
              <div className="space-y-4 py-8">
                <div className="h-20 bg-white border border-neutral-200 animate-pulse rounded-lg" />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-8 h-96 bg-white border border-neutral-200 animate-pulse rounded-lg" />
                  <div className="lg:col-span-4 h-96 bg-white border border-neutral-200 animate-pulse rounded-lg" />
                </div>
              </div>
            )}

            {isError && mode !== "create" && (
              <div className="p-8 bg-rose-50 border border-rose-200 rounded-lg text-center space-y-3">
                <AlertTriangle className="size-8 text-rose-600 mx-auto" />
                <h3 className="text-base font-bold text-rose-900">
                  Failed to load order
                </h3>
                <p className="text-xs text-rose-700">
                  Could not retrieve order details from the database.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refetch()}
                  className="text-xs mt-2"
                >
                  Retry
                </Button>
              </div>
            )}

            {(record || mode === "create") && (
              <>
                {/* A. 4-TILE SUMMARY KPI STRIP */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {/* Grand Total */}
                  <div className="pl-card space-y-1 min-w-0">
                    <span className="pl-stat-label flex items-center gap-1.5">
                      <CreditCard className="size-3.5 text-[#8a8a8a]" />
                      Grand Total
                    </span>
                    <p className="pl-kpi-value truncate">
                      {format.money(
                        isFormEditable ? totalMinor : (record?.totalMinor ?? totalMinor),
                      )}
                    </p>
                    <p className="text-[11px] text-neutral-500 truncate">
                      5% VAT & delivery included
                    </p>
                  </div>

                  {/* Items Count */}
                  <div className="pl-card space-y-1 min-w-0">
                    <span className="pl-stat-label flex items-center gap-1.5">
                      <ShoppingBag className="size-3.5 text-[#8a8a8a]" />
                      Items & Units
                    </span>
                    <p className="pl-kpi-value truncate">
                      {items.reduce((sum, it) => sum + (it.qty || 1), 0)} Units
                    </p>
                    <p className="text-[11px] text-neutral-500 truncate">
                      {items.length} distinct item{items.length > 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Payment State */}
                  <div className="pl-card space-y-1 min-w-0">
                    <span className="pl-stat-label flex items-center gap-1.5">
                      <ShieldCheck className="size-3.5 text-[#8a8a8a]" />
                      Payment State
                    </span>
                    <div className="pt-0.5">
                      <span
                        className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-md capitalize border ${payInfo.bg}`}
                      >
                        {isFormEditable ? paymentStatus : record?.paymentStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 truncate font-medium">
                      Cash on Delivery (COD)
                    </p>
                  </div>

                  {/* Fulfillment State */}
                  <div className="pl-card space-y-1 min-w-0">
                    <span className="pl-stat-label flex items-center gap-1.5">
                      <Truck className="size-3.5 text-[#8a8a8a]" />
                      Fulfilment State
                    </span>
                    <div className="pt-0.5">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md capitalize border ${fulfillInfo.bg}`}
                      >
                        <fulfillInfo.icon className="size-3" />
                        {isFormEditable ? fulfillmentStatus : record?.fulfillmentStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 truncate">
                      {(isFormEditable ? shippingProvider : record?.shippingProvider) ||
                        "Courier pending"}
                    </p>
                  </div>
                </div>

                {/* B. 2-COLUMN MAIN CONTENT (68% Left Manifest, 32% Right Workflow) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* LEFT COLUMN: Products Manifest, Customer Info, Address, Notes */}
                  <div className="lg:col-span-8 space-y-5 min-w-0">
                    {/* 1. ORDER ITEMS MANIFEST */}
                    <div className="pl-card pl-card--flush">
                      <div className="px-4 py-3 border-b border-[var(--pl-border-subtle)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="size-4 text-[#616161]" />
                          <h3 className="pl-card-title !mb-0">
                            Order Items ({items.length})
                          </h3>
                        </div>

                        {isFormEditable && isEditableStatus && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setShowAddProductModal(true)}
                            className="h-7 px-2.5 text-xs gap-1.5 border-blue-600 text-blue-700 hover:bg-blue-50 font-semibold"
                          >
                            <Plus className="size-3" />
                            Add Product
                          </Button>
                        )}
                      </div>

                      {/* Items List */}
                      <div className="p-4 sm:p-5 divide-y divide-neutral-100">
                        {items.length === 0 ? (
                          <div className="py-10 flex flex-col items-center justify-center text-center space-y-3 bg-neutral-50/60 rounded-lg border border-dashed border-neutral-300">
                            <div className="size-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                              <ShoppingBag className="size-6" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-neutral-900">
                                No items in this order yet
                              </p>
                              <p className="text-xs text-neutral-500 max-w-xs">
                                Browse the catalog to select and add products to this
                                order.
                              </p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => setShowAddProductModal(true)}
                              className="h-8 px-4 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                            >
                              <Plus className="size-3.5" />
                              Browse & Add Products
                            </Button>
                          </div>
                        ) : (
                          items.map((item, idx) => (
                            <div
                              key={item.sku + idx}
                              className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                              {/* Product Info */}
                              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                <div className="relative size-16 shrink-0 bg-neutral-100 border border-neutral-200 rounded-md overflow-hidden p-1 flex items-center justify-center">
                                  {item.primaryImage || item.image ? (
                                    <ProductImage
                                      media={item.primaryImage}
                                      src={item.image}
                                      alt={
                                        format.label(item.productNameSnapshot) || item.sku
                                      }
                                      fill
                                      variant="thumbnail"
                                      className="object-contain"
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center justify-center text-neutral-400 p-1 text-center select-none">
                                      <Package className="size-6 text-neutral-400 stroke-1" />
                                      <span className="text-[8px] font-mono text-neutral-400 font-bold uppercase tracking-wider mt-0.5">
                                        IOMA
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 space-y-1">
                                  <p className="font-semibold text-neutral-900 text-sm truncate">
                                    {format.label(item.productNameSnapshot) !== "—"
                                      ? format.label(item.productNameSnapshot)
                                      : item.productNameSnapshot?.en ||
                                        item.productNameSnapshot?.fr ||
                                        item.productNameSnapshot?.name ||
                                        item.sku}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono flex-wrap">
                                    <span>SKU: {item.sku}</span>
                                    {item.size && (
                                      <>
                                        <span>·</span>
                                        <span className="bg-neutral-100 px-1.5 py-0.5 rounded text-[10px] font-sans text-neutral-700 font-medium">
                                          {item.size}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  <p className="text-xs text-neutral-600 font-mono font-medium">
                                    {format.money(
                                      item.unitPriceMinorSnapshot ?? item.priceMinor ?? 0,
                                    )}{" "}
                                    / unit
                                  </p>
                                </div>
                              </div>

                              {/* Quantity & Subtotal */}
                              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                                {isFormEditable && isEditableStatus ? (
                                  <div className="flex items-center border border-neutral-300 rounded-md bg-white shadow-2xs">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateItemQty(idx, item.qty - 1)
                                      }
                                      disabled={item.qty <= 1}
                                      className="size-8 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 text-sm font-semibold transition-colors"
                                    >
                                      -
                                    </button>
                                    <span className="w-9 text-center font-bold text-neutral-900 font-mono text-xs">
                                      {item.qty}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateItemQty(idx, item.qty + 1)
                                      }
                                      className="size-8 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 text-sm font-semibold transition-colors"
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs font-semibold text-neutral-700 bg-neutral-100/90 px-2.5 py-1 rounded-md">
                                    Qty: {item.qty}
                                  </span>
                                )}

                                <div className="text-end min-w-[90px]">
                                  <span className="font-mono font-bold text-neutral-900 text-sm sm:text-base">
                                    {format.money(item.unitPriceMinorSnapshot * item.qty)}
                                  </span>
                                </div>

                                {isFormEditable &&
                                  isEditableStatus &&
                                  (mode === "create" || items.length > 1) && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveItem(idx)}
                                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                                      title="Remove item"
                                    >
                                      <Trash2 className="size-4" />
                                    </button>
                                  )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Order Financial Breakdown */}
                      <div className="bg-neutral-50/70 border-t border-neutral-200/90 p-5 space-y-2.5 text-xs">
                        <div className="flex justify-between text-neutral-600">
                          <span>
                            Subtotal ({items.reduce((sum, it) => sum + (it.qty || 1), 0)}{" "}
                            items)
                          </span>
                          <span className="font-mono font-medium text-neutral-800">
                            {format.money(subtotalMinor)}
                          </span>
                        </div>
                        <div className="flex justify-between text-neutral-600">
                          <span className="flex items-center gap-1.5">
                            Shipping Fee
                            {shippingMinor === 0 && (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                                FREE UAE DELIVERY
                              </span>
                            )}
                          </span>
                          <span className="font-mono font-medium text-neutral-800">
                            {shippingMinor === 0
                              ? "AED 0.00"
                              : format.money(shippingMinor)}
                          </span>
                        </div>
                        <div className="flex justify-between text-neutral-600">
                          <span>UAE VAT (5%)</span>
                          <span className="font-mono font-medium text-neutral-800">
                            {format.money(taxMinor)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold text-neutral-900 pt-3 border-t border-neutral-200">
                          <span>TOTAL</span>
                          <span className="font-mono text-lg text-blue-700">
                            {format.money(totalMinor)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. CUSTOMER & RECIPIENT INFORMATION */}
                    <div className="pl-card space-y-4">
                      <div className="pl-card-head !mb-1">
                        <h3 className="pl-card-title !mb-0 flex items-center gap-2">
                          <User className="size-4 text-[#616161]" />
                          Customer Information
                        </h3>
                      </div>

                      {isFormEditable ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1">
                            <label className="font-semibold text-neutral-700">
                              Customer / Recipient Name *
                            </label>
                            <input
                              type="text"
                              value={customerName}
                              onChange={(e) => {
                                setCustomerName(e.target.value);
                                setIsDirty(true);
                              }}
                              placeholder="e.g. Fatima Al Mansoori"
                              className="pl-input"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-semibold text-neutral-700">
                              Email Address *
                            </label>
                            <input
                              type="email"
                              value={customerEmail}
                              disabled={mode === "edit"}
                              onChange={(e) => {
                                setCustomerEmail(e.target.value);
                                setIsDirty(true);
                              }}
                              placeholder="client@example.com"
                              className={`w-full h-9 px-3 text-xs border rounded-md font-mono ${
                                mode === "create"
                                  ? "border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                                  : "border-neutral-200 bg-neutral-50 text-neutral-500"
                              }`}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-semibold text-neutral-700">
                              Primary Phone *
                            </label>
                            <input
                              type="text"
                              value={addrPhone}
                              onChange={(e) => {
                                setAddrPhone(e.target.value);
                                setIsDirty(true);
                              }}
                              placeholder="+971 50 123 4567"
                              className="pl-input"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-semibold text-neutral-700">
                              Secondary Phone (Optional)
                            </label>
                            <input
                              type="text"
                              value={secondaryPhone}
                              onChange={(e) => {
                                setSecondaryPhone(e.target.value);
                                setIsDirty(true);
                              }}
                              placeholder="Secondary contact..."
                              className="pl-input"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-neutral-400">
                              Full Name
                            </span>
                            <p className="font-semibold text-neutral-900 mt-0.5">
                              {customerName || record?.customerEmail || "Guest"}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase text-neutral-400">
                              Email
                            </span>
                            <p className="text-neutral-800 font-mono mt-0.5 truncate">
                              {customerEmail || "—"}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase text-neutral-400">
                              Phone
                            </span>
                            <p className="text-neutral-800 font-mono mt-0.5">
                              {addrPhone || "—"}
                            </p>
                          </div>
                          {record?.type === "b2b" && (
                            <div>
                              <span className="text-[10px] font-bold uppercase text-neutral-400">
                                Company
                              </span>
                              <p className="font-semibold text-blue-800 flex items-center gap-1 mt-0.5">
                                <Building2 className="size-3" />
                                {record?.companyName || "Professional Partner"}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 3. DELIVERY ADDRESS */}
                    <div className="pl-card space-y-4">
                      <div className="pl-card-head !mb-1">
                        <h3 className="pl-card-title !mb-0 flex items-center gap-2">
                          <MapPin className="size-4 text-rose-600" />
                          Delivery Address (UAE)
                        </h3>
                      </div>

                      {isFormEditable ? (
                        <div className="space-y-3 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="font-semibold text-neutral-700">
                                Emirate
                              </label>
                              <select
                                value={addrEmirate}
                                onChange={(e) => {
                                  setAddrEmirate(e.target.value);
                                  setAddrCity(e.target.value);
                                  setIsDirty(true);
                                }}
                                className="pl-input"
                              >
                                {EMIRATES.map((em) => (
                                  <option key={em.code} value={em.name.en}>
                                    {em.name.en}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="font-semibold text-neutral-700">
                                City / Area
                              </label>
                              <input
                                type="text"
                                value={addrCity}
                                onChange={(e) => {
                                  setAddrCity(e.target.value);
                                  setIsDirty(true);
                                }}
                                className="w-full h-9 px-3 text-xs border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="font-semibold text-neutral-700">
                              Street / Villa / Building Address
                            </label>
                            <input
                              type="text"
                              value={addrLine1}
                              onChange={(e) => {
                                setAddrLine1(e.target.value);
                                setIsDirty(true);
                              }}
                              placeholder="Street name, villa or building name..."
                              className="w-full h-9 px-3 text-xs border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-semibold text-neutral-700">
                              Apartment / Unit / Floor (Optional)
                            </label>
                            <input
                              type="text"
                              value={addrLine2}
                              onChange={(e) => {
                                setAddrLine2(e.target.value);
                                setIsDirty(true);
                              }}
                              placeholder="Apartment or unit number..."
                              className="w-full h-9 px-3 text-xs border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-semibold text-neutral-700">
                              Delivery Instructions / Note
                            </label>
                            <input
                              type="text"
                              value={deliveryInstructions}
                              onChange={(e) => {
                                setDeliveryInstructions(e.target.value);
                                setIsDirty(true);
                              }}
                              placeholder="Special gate code or delivery instructions..."
                              className="w-full h-9 px-3 text-xs border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 text-xs text-neutral-800">
                          <p className="font-bold text-neutral-900 text-sm">
                            {record?.shippingAddress?.fullName || customerName || "—"}
                          </p>
                          <p className="text-neutral-600">
                            {record?.shippingAddress?.addressLine1 || addrLine1 || "—"}
                          </p>
                          {(record?.shippingAddress?.addressLine2 || addrLine2) && (
                            <p className="text-neutral-600">
                              {record?.shippingAddress?.addressLine2 || addrLine2}
                            </p>
                          )}
                          <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded text-xs">
                              {[
                                record?.shippingAddress?.city || addrCity,
                                record?.shippingAddress?.emirate || addrEmirate,
                                "United Arab Emirates",
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </div>
                          {(record?.shippingAddress?.instructions ||
                            record?.shippingNote) && (
                            <p className="text-neutral-500 italic pt-1">
                              Note:{" "}
                              {record?.shippingAddress?.instructions ||
                                record?.shippingNote}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 4. PRIVATE ADMIN NOTES */}
                    <div className="bg-amber-50/40 border border-amber-200/90 rounded-lg shadow-2xs p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-2">
                          <FileText className="size-4 text-amber-600" />
                          Private Admin Note
                        </h3>
                        <span className="text-[10px] text-amber-800 font-semibold uppercase bg-amber-100 px-2 py-0.5 rounded">
                          Visible to administrators only
                        </span>
                      </div>

                      {(record?.adminNotes || []).length > 0 && (
                        <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                          {record?.adminNotes?.map((note: any, i: number) => (
                            <div
                              key={i}
                              className="p-3 bg-white border border-amber-200/80 rounded-md text-xs space-y-1 shadow-2xs"
                            >
                              <p className="text-neutral-800 whitespace-pre-wrap">
                                {note.text}
                              </p>
                              <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-neutral-100">
                                <span className="font-medium text-neutral-600">
                                  By {note.authorEmail || "Admin"}
                                </span>
                                <span className="font-mono">
                                  {format.date(note.createdAt, true)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-amber-900">
                          Add Operational Note
                        </label>
                        <textarea
                          rows={2}
                          value={adminNote}
                          onChange={(e) => {
                            setAdminNote(e.target.value);
                            setIsDirty(true);
                          }}
                          placeholder="Add an internal note about customer verification, special packaging or courier notes..."
                          className="pl-input min-h-24"
                        />
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Order Workflow, Customer Summary, Payment Details, Timeline */}
                  <div className="lg:col-span-4 space-y-5 min-w-0">
                    {/* 1. ORDER WORKFLOW */}
                    <div className="pl-card space-y-4">
                      <div className="pl-card-head !mb-1">
                        <h3 className="pl-card-title !mb-0 flex items-center gap-2">
                          <Package className="size-4 text-[#616161]" />
                          Order Workflow
                        </h3>
                        <span className="text-[11px] font-mono text-neutral-400">
                          {mode === "create"
                            ? orderChannel.toUpperCase()
                            : record?.type?.toUpperCase() || "B2C"}
                        </span>
                      </div>

                      <div className="space-y-4 text-xs">
                        {/* Fulfillment Status */}
                        <div className="space-y-1.5">
                          <label className="font-semibold text-neutral-700">
                            Fulfilment Status
                          </label>
                          {isFormEditable ? (
                            <select
                              value={fulfillmentStatus}
                              onChange={(e) => {
                                setFulfillmentStatus(e.target.value);
                                setIsDirty(true);
                              }}
                              className="pl-input"
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          ) : (
                            <div className="flex items-center gap-2 p-2.5 bg-neutral-50 border border-neutral-200/70 rounded-md">
                              <fulfillInfo.icon className="size-4 text-neutral-600" />
                              <span className="text-xs font-semibold text-neutral-900 capitalize">
                                {record?.fulfillmentStatus}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Payment Status */}
                        <div className="space-y-1.5">
                          <label className="font-semibold text-neutral-700">
                            Payment Status
                          </label>
                          {isFormEditable ? (
                            <select
                              value={paymentStatus}
                              onChange={(e) => {
                                setPaymentStatus(e.target.value);
                                setIsDirty(true);
                              }}
                              className="pl-input"
                            >
                              <option value="pending">Pending</option>
                              <option value="authorized">Authorized</option>
                              <option value="paid">Paid</option>
                              <option value="failed">Failed</option>
                              <option value="refunded">Refunded</option>
                            </select>
                          ) : (
                            <div className="flex items-center gap-2 p-2.5 bg-neutral-50 border border-neutral-200/70 rounded-md">
                              <CreditCard className="size-4 text-neutral-600" />
                              <span className="text-xs font-semibold text-neutral-900 capitalize">
                                {record?.paymentStatus}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Shipping Provider */}
                        <div className="space-y-1.5">
                          <label className="font-semibold text-neutral-700">
                            Shipping Provider
                          </label>
                          {isFormEditable ? (
                            <select
                              value={shippingProvider}
                              onChange={(e) => {
                                setShippingProvider(e.target.value);
                                setIsDirty(true);
                              }}
                              className="pl-input"
                            >
                              <option value="">— Select Provider —</option>
                              {CARRIERS.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="font-semibold text-neutral-900 p-2.5 bg-neutral-50 border border-neutral-200/70 rounded-md">
                              {record?.shippingProvider || "Not Assigned"}
                            </p>
                          )}
                        </div>

                        {/* Tracking Number */}
                        <div className="space-y-1.5">
                          <label className="font-semibold text-neutral-700">
                            Tracking Number
                          </label>
                          {isFormEditable ? (
                            <input
                              type="text"
                              value={trackingNumber}
                              onChange={(e) => {
                                setTrackingNumber(e.target.value);
                                setIsDirty(true);
                              }}
                              placeholder="e.g. AWB-9821734912"
                              className="pl-input"
                            />
                          ) : (
                            <div className="flex items-center justify-between p-2.5 bg-neutral-50 border border-neutral-200/70 rounded-md font-mono text-xs">
                              {record?.trackingNumber ? (
                                <>
                                  <span className="font-bold text-neutral-900 truncate">
                                    {record.trackingNumber}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleCopyTracking}
                                    className="p-1 hover:bg-neutral-200 rounded text-neutral-500 ml-1 shrink-0"
                                    title="Copy Tracking"
                                  >
                                    {copiedTracking ? (
                                      <Check className="size-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="size-3.5" />
                                    )}
                                  </button>
                                </>
                              ) : (
                                <span className="text-neutral-400">
                                  No tracking number
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 2. CUSTOMER SUMMARY CARD */}
                    {mode !== "create" && record && (
                      <div className="pl-card space-y-4">
                        <div className="pl-card-head !mb-1">
                          <h3 className="pl-card-title !mb-0 flex items-center gap-2">
                            <User className="size-4 text-[#616161]" />
                            Customer
                          </h3>
                          {record.userId && (
                            <Link
                              href={`/admin/customers?q=${encodeURIComponent(record.customerEmail || "")}`}
                              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                            >
                              View Customer <ChevronRight className="size-3" />
                            </Link>
                          )}
                        </div>

                        <div className="flex items-start gap-3.5">
                          <div className="size-11 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-700 text-sm shrink-0 shadow-2xs">
                            {(
                              record.shippingAddress?.fullName ||
                              record.customerEmail ||
                              "G"
                            )
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="font-bold text-neutral-900 text-sm truncate">
                              {record.shippingAddress?.fullName ||
                                record.customerEmail ||
                                "Guest User"}
                            </p>
                            <div className="space-y-1 text-xs text-neutral-600">
                              {record.customerEmail && (
                                <a
                                  href={`mailto:${record.customerEmail}`}
                                  className="flex items-center gap-1.5 hover:text-blue-600 truncate transition-colors"
                                >
                                  <Mail className="size-3.5 text-neutral-400 shrink-0" />
                                  <span className="truncate">{record.customerEmail}</span>
                                </a>
                              )}
                              {record.shippingAddress?.phone && (
                                <a
                                  href={`tel:${record.shippingAddress.phone}`}
                                  className="flex items-center gap-1.5 hover:text-blue-600 transition-colors font-mono"
                                >
                                  <Phone className="size-3.5 text-neutral-400 shrink-0" />
                                  <span>{record.shippingAddress.phone}</span>
                                </a>
                              )}
                              <p className="flex items-center gap-1.5 text-neutral-500 truncate">
                                <MapPin className="size-3.5 text-neutral-400 shrink-0" />
                                <span className="truncate">
                                  {[
                                    record.shippingAddress?.city,
                                    record.shippingAddress?.emirate,
                                  ]
                                    .filter(Boolean)
                                    .join(", ") || "Dubai, UAE"}
                                </span>
                              </p>
                            </div>
                            {record.type === "b2b" && (
                              <div className="pt-1.5">
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded">
                                  <Building2 className="size-3" />
                                  {record.companyName || "Professional Partner"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. PAYMENT DETAILS */}
                    <div className="pl-card space-y-3">
                      <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
                        <h3 className="pl-card-title !mb-0 flex items-center gap-2">
                          <CreditCard className="size-4 text-emerald-600" />
                          Payment Details (COD)
                        </h3>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center text-neutral-600">
                          <span>Method</span>
                          <span className="font-semibold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded text-[11px]">
                            Cash on Delivery (COD)
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-neutral-600">
                          <span>Status</span>
                          <span
                            className={`font-semibold capitalize ${payInfo.bg} px-2 py-0.5 rounded text-[11px]`}
                          >
                            {(isFormEditable ? paymentStatus : record?.paymentStatus) ===
                            "paid"
                              ? "Cash Collected (Paid)"
                              : "Cash Due on Delivery"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-neutral-600 pt-1.5 border-t border-neutral-100">
                          <span>Total to Collect</span>
                          <span className="font-mono font-bold text-neutral-900 text-sm">
                            {format.money(
                              isFormEditable
                                ? totalMinor
                                : (record?.totalMinor ?? totalMinor),
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 4. ORDER TIMELINE */}
                    {mode !== "create" && record && (
                      <div className="pl-card space-y-4">
                        <div className="pl-card-head !mb-1">
                          <h3 className="pl-card-title !mb-0 flex items-center gap-2">
                            <Clock className="size-4 text-[#616161]" />
                            Order Timeline
                          </h3>
                        </div>

                        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200 text-xs">
                          <div className="relative">
                            <span className="absolute -left-6 top-1 size-3.5 rounded-full bg-emerald-500 ring-4 ring-white shadow-2xs" />
                            <div className="space-y-0.5">
                              <p className="font-bold text-neutral-900">Order Created</p>
                              <p className="text-[11px] text-neutral-400 font-mono">
                                {format.date(record.createdAt, true)}
                              </p>
                            </div>
                          </div>

                          {record.paymentStatus === "paid" && (
                            <div className="relative">
                              <span className="absolute -left-6 top-1 size-3.5 rounded-full bg-blue-500 ring-4 ring-white shadow-2xs" />
                              <div className="space-y-0.5">
                                <p className="font-bold text-neutral-900">
                                  Payment Captured
                                </p>
                                <p className="text-[11px] text-neutral-400 font-mono">
                                  {format.date(
                                    record.updatedAt || record.createdAt,
                                    true,
                                  )}
                                </p>
                              </div>
                            </div>
                          )}

                          {(record.statusHistory || []).map((sh: any, idx: number) => (
                            <div key={idx} className="relative">
                              <span className="absolute -left-6 top-1 size-3.5 rounded-full bg-blue-500 ring-4 ring-white shadow-2xs" />
                              <div className="space-y-0.5">
                                <p className="font-bold text-neutral-900 capitalize">
                                  Status: {sh.status}
                                </p>
                                <p className="text-[11px] text-neutral-400 font-mono">
                                  {format.date(sh.at, true)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Save Status Banners */}
          {saveError && (
            <div className="pl-card mx-4 sm:mx-6 mt-2 !p-3 text-xs text-[#8e1f0b] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="size-4 text-rose-600 shrink-0" />
                <span className="truncate">{saveError}</span>
              </div>
              <button
                type="button"
                onClick={() => setSaveError(null)}
                className="text-rose-500 hover:text-rose-700 p-0.5"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {saveSuccess && (
            <div className="pl-card mx-4 sm:mx-6 mt-2 !p-3 text-xs text-[#014b40] flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>Order modifications saved successfully!</span>
            </div>
          )}

          {/* 3. STICKY BOTTOM ACTION FOOTER IN EDIT / CREATE MODE */}
          {(mode === "edit" || mode === "create") && (
            <div className="sticky bottom-0 z-30 bg-white border-t border-[var(--pl-border)] px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2">
                {mode === "create" ? (
                  <span className="pl-badge">
                    <Plus className="size-3" />
                    New Order Form
                  </span>
                ) : isDirty ? (
                  <span className="pl-badge pl-badge--warning">
                    <span className="size-1.5 rounded-full bg-[#9a6700]" />
                    Unsaved changes
                  </span>
                ) : (
                  <span className="text-xs text-neutral-500 font-medium">
                    Edit Mode Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (mode === "create") {
                      handleRequestClose();
                    } else if (isDirty) {
                      setShowUnsavedDialog(true);
                    } else {
                      setMode("view");
                    }
                  }}
                  className="h-9 px-4 text-xs font-medium border-neutral-300 hover:bg-neutral-50"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={
                    mode === "create"
                      ? createMutation.isPending
                      : updateMutation.isPending
                  }
                  className="h-9 px-5 text-xs gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-colors"
                >
                  {(
                    mode === "create"
                      ? createMutation.isPending
                      : updateMutation.isPending
                  ) ? (
                    <RefreshCw className="size-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-3.5" />
                  )}
                  {mode === "create" ? "Create Order" : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* 4. ADD PRODUCT MODAL */}
      <Dialog open={showAddProductModal} onOpenChange={setShowAddProductModal}>
        <DialogContent className="max-w-lg w-[calc(100vw-2rem)] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Add Product to Order
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Select an available product from catalog to add to this order snapshot.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 size-4 text-neutral-400" />
              <input
                type="text"
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                placeholder="Search products by name, range or SKU..."
                className="pl-input !ps-9"
              />
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-neutral-100 border border-neutral-200 rounded-md">
              {(catalogData?.items || []).map((p: any) => {
                const defaultVar = p.variants?.[0];
                const displayPrice =
                  record?.type === "b2b"
                    ? (defaultVar?.b2bPriceMinor ??
                      p.b2bPriceMinor ??
                      defaultVar?.b2cPriceMinor ??
                      p.b2cPriceMinor ??
                      p.retailPriceMinor ??
                      p.priceMinor ??
                      0)
                    : (defaultVar?.b2cPriceMinor ??
                      p.b2cPriceMinor ??
                      p.retailPriceMinor ??
                      p.priceMinor ??
                      0);
                const displaySku = defaultVar?.sku || p.sku || "—";
                const displaySize = defaultVar?.size || p.size || null;

                return (
                  <div
                    key={p._id}
                    onClick={() => setSelectedProductToAdd(p)}
                    className={`p-3 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                      selectedProductToAdd?._id === p._id
                        ? "bg-blue-50 border-s-4 border-blue-600"
                        : "hover:bg-neutral-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="size-10 rounded border border-neutral-200 bg-neutral-50 relative overflow-hidden shrink-0 flex items-center justify-center">
                        {p.primaryImage || p.images?.[0] ? (
                          <ProductImage
                            media={p.primaryImage}
                            src={p.images?.[0]}
                            alt={format.label(p.name)}
                            fill
                            variant="thumbnail"
                            className="object-contain p-0.5"
                          />
                        ) : (
                          <Package className="size-5 text-neutral-400 stroke-1" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-neutral-900 truncate">
                          {format.label(p.name)}
                        </p>
                        <p className="text-[11px] text-neutral-400 font-mono truncate">
                          SKU: {displaySku} {displaySize ? `· ${displaySize}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-end shrink-0 pl-3">
                      <p className="font-mono font-bold text-neutral-900">
                        {format.money(displayPrice)}
                      </p>
                      {defaultVar?.quantityOnHand !== undefined && (
                        <p className="text-[10px] text-neutral-400 font-medium">
                          Stock: {defaultVar.quantityOnHand}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {(catalogData?.items || []).length === 0 && (
                <p className="p-6 text-xs text-center text-neutral-400">
                  No products found
                </p>
              )}
            </div>

            {selectedProductToAdd && (
              <div className="p-3.5 bg-neutral-50 rounded-md border border-neutral-200 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-neutral-800">Selected Quantity:</span>
                  <div className="flex items-center border border-neutral-300 rounded-md bg-white shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setAddProductQty((q) => Math.max(1, q - 1))}
                      className="size-8 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 font-bold"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-bold text-neutral-900 font-mono text-xs">
                      {addProductQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAddProductQty((q) => q + 1)}
                      className="size-8 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddProductModal(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!selectedProductToAdd}
              onClick={() => handleAddItem(selectedProductToAdd, null, addProductQty)}
              className="text-xs bg-blue-600 text-white hover:bg-blue-700 font-semibold"
            >
              Add to Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. UNSAVED CHANGES ALERT MODAL */}
      <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <DialogContent className="max-w-md w-[calc(100vw-2rem)] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-neutral-900">
              <AlertTriangle className="size-5 text-amber-600" />
              You have unsaved changes
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-600">
              Leaving or closing now will discard your modifications to this order. Are
              you sure you want to discard?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowUnsavedDialog(false)}
              className="text-xs"
            >
              Continue Editing
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDiscardChanges}
              className="text-xs"
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. DELETE ORDER CONFIRMATION MODAL */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md w-[calc(100vw-2rem)] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-700">
              <Trash2 className="size-5" />
              Delete Order
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-600">
              Are you sure you want to permanently delete order{" "}
              <strong className="font-mono text-neutral-900">
                {record?.orderNumber || "this order"}
              </strong>
              ? This action will archive the order and remove it from active processing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteModal(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              {deleteMutation.isPending ? (
                <RefreshCw className="size-3 animate-spin mr-1" />
              ) : null}
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
