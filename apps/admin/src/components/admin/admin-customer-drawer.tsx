"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAdminAccess, useAdminQuery } from "@/hooks/use-admin";
import { useAdminFormat } from "./admin-ui";
import { ProductImage } from "@/components/shop/product-image";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EMIRATES, MAIN_CONCERN_SLUGS } from "@ioma/config";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  Sparkles,
  Shield,
  Activity,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Edit3,
  Trash2,
  Plus,
  Lock,
  Unlock,
  KeyRound,
  ExternalLink,
  Building2,
  MoreVertical,
  X,
  Loader2,
  Check,
  Heart,
  Globe,
  Tag,
  ShieldCheck,
  Briefcase,
} from "lucide-react";

interface AdminCustomerDrawerProps {
  customerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: "view" | "edit";
  initialTab?: string;
  onOrderClick?: (orderId: string) => void;
}

export function AdminCustomerDrawer({
  customerId,
  open,
  onOpenChange,
  initialMode = "view",
  initialTab = "overview",
  onOrderClick,
}: AdminCustomerDrawerProps) {
  const t = useTranslations("AdminExperience");
  const qc = useQueryClient();
  const format = useAdminFormat();
  const access = useAdminAccess();
  const canManage = access.data?.permissions.includes("customers.manage") ?? false;

  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Edit form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredLocale, setPreferredLocale] = useState<"en" | "fr" | "ar">("en");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);

  // Private note state
  const [noteText, setNoteText] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Address modal state
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrLabel, setAddrLabel] = useState("Home");
  const [addrType, setAddrType] = useState<"shipping" | "billing">("shipping");
  const [addrFullName, setAddrFullName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrCity, setAddrCity] = useState("Dubai");
  const [addrEmirate, setAddrEmirate] = useState("Dubai");
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  // Status modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<"active" | "locked" | "deleted">(
    "active",
  );
  const [statusReason, setStatusReason] = useState("");

  // Feedback notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const detailQuery = useAdminQuery<{
    record: Record<string, any>;
    relations: Record<string, any>;
  }>(customerId ? `resources/customers/${customerId}` : "", !!customerId && open);

  const record = detailQuery.data?.record;
  const relations = detailQuery.data?.relations || {};
  const profile = relations.profile?.[0] || {};
  const stats = record?.stats || {};

  // Reset form when record loads or changes
  useEffect(() => {
    if (record) {
      setFirstName(record.firstName || "");
      setLastName(record.lastName || "");
      setPhone(profile.phone || record.phone || "");
      setPreferredLocale((profile.preferredLocale || record.locale || "en") as any);
      setDateOfBirth(profile.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : "");
      setSelectedConcerns(profile.skinConcerns || []);
      setNewsletterOptIn(!!profile.newsletterOptIn);
      setIsDirty(false);
    }
  }, [record, profile]);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setActiveTab(initialTab);
    }
  }, [open, initialMode, initialTab]);

  // Update Customer Mutation
  const updateMutation = useMutation({
    mutationFn: () => {
      if (!customerId) throw new Error("No customer ID");
      return apiFetch(`/admin/customers/${customerId}`, {
        method: "PATCH",
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || null,
          preferredLocale,
          dateOfBirth: dateOfBirth ? `${dateOfBirth}T00:00:00.000Z` : null,
          skinConcerns: selectedConcerns,
          newsletterOptIn,
        }),
      });
    },
    onSuccess: () => {
      qc.setQueryData(
        ["admin", customerId ? `resources/customers/${customerId}` : ""],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            record: {
              ...old.record,
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              phone: phone.trim() || null,
              locale: preferredLocale,
            },
            relations: {
              ...old.relations,
              profile: [
                {
                  ...(old.relations?.profile?.[0] || {}),
                  phone: phone.trim() || null,
                  preferredLocale,
                  dateOfBirth: dateOfBirth ? `${dateOfBirth}T00:00:00.000Z` : null,
                  skinConcerns: selectedConcerns,
                  newsletterOptIn,
                },
              ],
            },
          };
        },
      );
      qc.invalidateQueries({ queryKey: ["admin"] });
      detailQuery.refetch();
      setIsDirty(false);
      setMode("view");
      showToast("Customer profile updated successfully.");
    },
  });

  // Update Status Mutation
  const statusMutation = useMutation({
    mutationFn: () => {
      if (!customerId) throw new Error("No customer ID");
      return apiFetch(`/admin/customers/${customerId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: targetStatus,
          reason: statusReason.trim() || undefined,
        }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      setStatusModalOpen(false);
      setStatusReason("");
      showToast(`Customer account marked as ${targetStatus}.`);
    },
  });

  // Add Note Mutation
  const noteMutation = useMutation({
    mutationFn: () => {
      if (!customerId) throw new Error("No customer ID");
      return apiFetch(`/admin/customers/${customerId}/notes`, {
        method: "POST",
        body: JSON.stringify({ text: noteText.trim() }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      setNoteText("");
      setIsAddingNote(false);
      showToast("Private note added.");
    },
  });

  // Password Reset Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: () => {
      if (!customerId) throw new Error("No customer ID");
      return apiFetch(`/admin/customers/${customerId}/reset-password`, {
        method: "POST",
      });
    },
    onSuccess: (data: any) => {
      showToast(data.message || "Password reset instructions sent.");
    },
  });

  // Address Mutations
  const addressMutation = useMutation({
    mutationFn: () => {
      if (!customerId) throw new Error("No customer ID");
      const body = {
        label: addrLabel.trim(),
        type: addrType,
        fullName: addrFullName.trim(),
        phone: addrPhone.trim(),
        line1: addrLine1.trim(),
        line2: addrLine2.trim() || null,
        city: addrCity.trim(),
        emirate: addrEmirate.trim(),
        isDefault: addrIsDefault,
      };
      if (editingAddressId) {
        return apiFetch(`/admin/customers/${customerId}/addresses/${editingAddressId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      }
      return apiFetch(`/admin/customers/${customerId}/addresses`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      setAddressModalOpen(false);
      setEditingAddressId(null);
      showToast(editingAddressId ? "Address updated." : "Address added.");
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (addressId: string) => {
      if (!customerId) throw new Error("No customer ID");
      return apiFetch(`/admin/customers/${customerId}/addresses/${addressId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      showToast("Address deleted.");
    },
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: (addressId: string) => {
      if (!customerId) throw new Error("No customer ID");
      return apiFetch(`/admin/customers/${customerId}/addresses/${addressId}/default`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      showToast("Default address updated.");
    },
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleClose = () => {
    if (isDirty) {
      setShowUnsavedModal(true);
      return;
    }
    onOpenChange(false);
  };

  const openAddAddress = () => {
    setEditingAddressId(null);
    setAddrLabel("Home");
    setAddrType("shipping");
    setAddrFullName(`${record?.firstName || ""} ${record?.lastName || ""}`.trim());
    setAddrPhone(profile.phone || record?.phone || "");
    setAddrLine1("");
    setAddrLine2("");
    setAddrCity("Dubai");
    setAddrEmirate("Dubai");
    setAddrIsDefault(false);
    setAddressModalOpen(true);
  };

  const openEditAddress = (addr: any) => {
    setEditingAddressId(addr._id);
    setAddrLabel(addr.label || "Address");
    setAddrType(addr.type || "shipping");
    setAddrFullName(addr.fullName || "");
    setAddrPhone(addr.phone || "");
    setAddrLine1(addr.line1 || "");
    setAddrLine2(addr.line2 || "");
    setAddrCity(addr.city || "Dubai");
    setAddrEmirate(addr.emirate || "Dubai");
    setAddrIsDefault(!!addr.isDefault);
    setAddressModalOpen(true);
  };

  const isPro =
    record?.roles?.includes("professional_approved") ||
    record?.roles?.includes("professional_pending") ||
    !!relations.application;

  const initials =
    `${record?.firstName?.[0] || ""}${record?.lastName?.[0] || ""}`.toUpperCase() || "CU";

  const tabs = [
    { key: "overview", label: "Overview", icon: User },
    {
      key: "orders",
      label: `Orders (${stats.totalOrders || (relations.orders || []).length})`,
      icon: ShoppingBag,
    },
    {
      key: "addresses",
      label: `Addresses (${(relations.addresses || []).length})`,
      icon: MapPin,
    },
    {
      key: "appointments",
      label: `Appointments (${(relations.appointments || []).length})`,
      icon: Calendar,
    },
    {
      key: "wishlist",
      label: `Wishlist (${(relations.wishlistItems || []).length})`,
      icon: Heart,
    },
    ...(isPro ? [{ key: "professional", label: "Professional", icon: Briefcase }] : []),
    { key: "security", label: "Security", icon: Shield },
    { key: "activity", label: "Activity", icon: Activity },
  ];

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(val) => {
          if (!val) handleClose();
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:max-w-2xl lg:max-w-3xl p-0 flex flex-col h-full bg-white border-s border-neutral-200 shadow-2xl z-50 overflow-hidden"
        >
          {/* Toast Notice */}
          {toastMessage && (
            <div className="absolute top-3 inset-x-4 z-50 p-3 bg-neutral-900 text-white text-xs rounded shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                {toastMessage}
              </span>
              <button
                onClick={() => setToastMessage(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {/* Sticky Header */}
          <div className="border-b border-neutral-200 bg-white sticky top-0 z-30">
            <div className="p-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="size-12 rounded-full bg-slate-900 text-white font-heading font-semibold text-sm flex items-center justify-center shrink-0 shadow-sm border border-neutral-200">
                  {initials}
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-semibold text-neutral-900 truncate">
                      {record?.firstName} {record?.lastName}
                    </h2>
                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full ${
                        record?.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : record?.status === "locked"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          record?.status === "active" ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                      />
                      {record?.status === "active"
                        ? "Active"
                        : record?.status === "locked"
                          ? "Suspended"
                          : "Deleted"}
                    </span>

                    {/* Role Badge */}
                    {record?.roles?.includes("professional_approved") ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                        <Briefcase className="size-3" />
                        Approved Pro
                      </span>
                    ) : record?.roles?.includes("professional_pending") ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                        <Clock className="size-3" />
                        Pro Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200 rounded-full">
                        Customer
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-neutral-500 flex-wrap">
                    <span className="flex items-center gap-1 truncate">
                      <Mail className="size-3 text-neutral-400" />
                      {record?.email}
                    </span>
                    {(profile.phone || record?.phone) && (
                      <span className="flex items-center gap-1">
                        <Phone className="size-3 text-neutral-400" />
                        {profile.phone || record?.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {mode === "view" ? (
                  <>
                    {canManage && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMode("edit")}
                        className="h-8 px-3 text-xs gap-1.5 border-neutral-300 font-medium"
                      >
                        <Edit3 className="size-3.5 text-neutral-600" />
                        Edit
                      </Button>
                    )}
                    <button
                      onClick={handleClose}
                      className="size-8 flex items-center justify-center rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                    >
                      <X className="size-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (isDirty) {
                          setShowUnsavedModal(true);
                        } else {
                          setMode("view");
                        }
                      }}
                      className="h-8 px-3 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={updateMutation.isPending}
                      onClick={() => updateMutation.mutate()}
                      className="h-8 px-4 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    >
                      {updateMutation.isPending ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin mr-1.5" />
                          Saving…
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 sm:grid-cols-6 border-t border-neutral-200 bg-neutral-50/70 text-center divide-x divide-neutral-200 text-xs">
              <div className="p-2.5">
                <span className="block text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
                  Orders
                </span>
                <span className="font-semibold text-neutral-800">
                  {stats.totalOrders || 0}
                </span>
              </div>
              <div className="p-2.5">
                <span className="block text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
                  Spend
                </span>
                <span className="font-semibold text-neutral-900">
                  {format.money(stats.lifetimeSpendMinor || 0)}
                </span>
              </div>
              <div className="p-2.5">
                <span className="block text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
                  AOV
                </span>
                <span className="font-semibold text-neutral-800">
                  {format.money(stats.aovMinor || 0)}
                </span>
              </div>
              <div className="p-2.5">
                <span className="block text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
                  Treatments
                </span>
                <span className="font-semibold text-neutral-800">
                  {stats.appointmentsCount || 0}
                </span>
              </div>
              <div className="p-2.5">
                <span className="block text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
                  Language
                </span>
                <span className="font-semibold text-neutral-800 uppercase">
                  {profile.preferredLocale || record?.locale || "EN"}
                </span>
              </div>
            </div>

            {/* Drawer Navigation Tabs */}
            <nav className="flex overflow-x-auto border-t border-neutral-200 bg-white no-scrollbar">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                      isActive
                        ? "border-blue-600 text-blue-700 bg-blue-50/50 font-semibold"
                        : "border-transparent text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                    }`}
                  >
                    <Icon
                      className={`size-3.5 ${isActive ? "text-blue-600" : "text-neutral-400"}`}
                    />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {detailQuery.isLoading ? (
              <div className="space-y-4 py-8">
                <div className="h-6 w-1/3 bg-neutral-200 animate-pulse rounded" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-20 bg-neutral-100 animate-pulse rounded" />
                  <div className="h-20 bg-neutral-100 animate-pulse rounded" />
                </div>
                <div className="h-40 bg-neutral-100 animate-pulse rounded" />
              </div>
            ) : detailQuery.isError ? (
              <div className="p-6 text-center text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                Could not load customer details.
                <Button
                  size="sm"
                  onClick={() => detailQuery.refetch()}
                  className="mt-3 block mx-auto"
                >
                  Retry
                </Button>
              </div>
            ) : (
              <>
                {/* 1. OVERVIEW TAB */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {mode === "view" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-neutral-200 rounded-sm bg-neutral-50/30 space-y-3">
                          <h3 className="text-xs font-semibold uppercase text-neutral-500 tracking-wider flex items-center gap-1.5">
                            <User className="size-3.5 text-blue-600" />
                            Personal Information
                          </h3>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-neutral-200/60">
                              <span className="text-neutral-500">Full Name</span>
                              <span className="font-medium text-neutral-900">
                                {record?.firstName} {record?.lastName}
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-neutral-200/60">
                              <span className="text-neutral-500">Email Address</span>
                              <span className="font-medium text-neutral-900">
                                {record?.email}
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-neutral-200/60">
                              <span className="text-neutral-500">Phone</span>
                              <span className="font-medium text-neutral-900">
                                {profile.phone || record?.phone || "—"}
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-neutral-200/60">
                              <span className="text-neutral-500">Date of Birth</span>
                              <span className="font-medium text-neutral-900">
                                {profile.dateOfBirth
                                  ? format.date(profile.dateOfBirth)
                                  : "—"}
                              </span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-neutral-500">
                                Language Preference
                              </span>
                              <span className="font-medium text-neutral-900 uppercase">
                                {profile.preferredLocale || record?.locale || "en"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 border border-neutral-200 rounded-sm bg-neutral-50/30 space-y-3">
                          <h3 className="text-xs font-semibold uppercase text-neutral-500 tracking-wider flex items-center gap-1.5">
                            <Shield className="size-3.5 text-blue-600" />
                            Account Status & Preferences
                          </h3>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-neutral-200/60">
                              <span className="text-neutral-500">Account Created</span>
                              <span className="font-medium text-neutral-900">
                                {format.date(record?.createdAt, true)}
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-neutral-200/60">
                              <span className="text-neutral-500">Last Login</span>
                              <span className="font-medium text-neutral-900">
                                {record?.lastLoginAt
                                  ? format.date(record?.lastLoginAt, true)
                                  : "Never"}
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-neutral-200/60">
                              <span className="text-neutral-500">Email Verified</span>
                              <span className="font-medium text-neutral-900">
                                {record?.emailVerifiedAt
                                  ? format.date(record?.emailVerifiedAt)
                                  : "No"}
                              </span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-neutral-500">
                                Newsletter Subscription
                              </span>
                              <span className="font-medium text-neutral-900">
                                {profile.newsletterOptIn ? "Subscribed" : "Unsubscribed"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Skin Concerns Snapshot */}
                        <div className="md:col-span-2 p-4 border border-neutral-200 rounded-sm bg-white space-y-2.5">
                          <h3 className="text-xs font-semibold uppercase text-neutral-500 tracking-wider flex items-center gap-1.5">
                            <Sparkles className="size-3.5 text-blue-600" />
                            Declared Skin Concerns
                          </h3>
                          {profile.skinConcerns?.length ? (
                            <div className="flex flex-wrap gap-1.5">
                              {profile.skinConcerns.map((c: string) => (
                                <span
                                  key={c}
                                  className="px-2.5 py-1 text-xs font-medium bg-neutral-100 text-neutral-700 rounded border border-neutral-200"
                                >
                                  {format.label(c)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-neutral-400">
                              No skin concerns declared.
                            </p>
                          )}
                        </div>

                        {/* Private Admin Notes */}
                        <div className="md:col-span-2 p-4 border border-neutral-200 rounded-sm bg-amber-50/30 space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-semibold uppercase text-neutral-700 tracking-wider flex items-center gap-1.5">
                              <FileText className="size-3.5 text-amber-600" />
                              Private Admin Notes (Internal Only)
                            </h3>
                            <span className="text-[11px] text-neutral-500">
                              Never exposed to client
                            </span>
                          </div>

                          <div className="space-y-2">
                            {(record?.adminNotes || []).length > 0 ? (
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {record?.adminNotes?.map((note: any) => (
                                  <div
                                    key={note.id || note.createdAt}
                                    className="p-2.5 bg-white border border-neutral-200 rounded text-xs space-y-1"
                                  >
                                    <p className="text-neutral-800 whitespace-pre-wrap">
                                      {note.text}
                                    </p>
                                    <div className="flex items-center justify-between text-[10px] text-neutral-400">
                                      <span>By {note.authorEmail || "Admin"}</span>
                                      <span>{format.date(note.createdAt, true)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-neutral-400">
                                No admin notes yet.
                              </p>
                            )}

                            {isAddingNote ? (
                              <div className="space-y-2 pt-2 border-t border-neutral-200">
                                <textarea
                                  value={noteText}
                                  onChange={(e) => setNoteText(e.target.value)}
                                  rows={2}
                                  placeholder="Enter private note..."
                                  className="w-full p-2 text-xs border border-neutral-300 rounded bg-white focus:ring-1 focus:ring-blue-600"
                                />
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setIsAddingNote(false)}
                                    className="h-7 text-xs"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    disabled={noteMutation.isPending || !noteText.trim()}
                                    onClick={() => noteMutation.mutate()}
                                    className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                                  >
                                    Save Note
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsAddingNote(true)}
                                className="h-7 text-xs gap-1 border-neutral-300"
                              >
                                <Plus className="size-3" />
                                Add Note
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* EDIT MODE */
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-neutral-700">
                              First Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={firstName}
                              onChange={(e) => {
                                setFirstName(e.target.value);
                                setIsDirty(true);
                              }}
                              className="w-full min-h-10 px-3 py-2 text-sm border border-neutral-300 rounded-sm bg-white focus:ring-1 focus:ring-blue-600"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-neutral-700">
                              Last Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={lastName}
                              onChange={(e) => {
                                setLastName(e.target.value);
                                setIsDirty(true);
                              }}
                              className="w-full min-h-10 px-3 py-2 text-sm border border-neutral-300 rounded-sm bg-white focus:ring-1 focus:ring-blue-600"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-neutral-700">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => {
                                setPhone(e.target.value);
                                setIsDirty(true);
                              }}
                              placeholder="+971 50 123 4567"
                              className="w-full min-h-10 px-3 py-2 text-sm border border-neutral-300 rounded-sm bg-white focus:ring-1 focus:ring-blue-600"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-neutral-700">
                              Date of Birth
                            </label>
                            <input
                              type="date"
                              value={dateOfBirth}
                              onChange={(e) => {
                                setDateOfBirth(e.target.value);
                                setIsDirty(true);
                              }}
                              className="w-full min-h-10 px-3 py-2 text-sm border border-neutral-300 rounded-sm bg-white focus:ring-1 focus:ring-blue-600"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-neutral-700">
                            Preferred Language
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {(["en", "ar"] as const).map((lang) => (
                              <button
                                type="button"
                                key={lang}
                                onClick={() => {
                                  setPreferredLocale(lang);
                                  setIsDirty(true);
                                }}
                                className={`min-h-9 px-3 py-1.5 text-xs font-medium border rounded-sm transition-colors ${
                                  preferredLocale === lang
                                    ? "bg-blue-50 border-blue-600 text-blue-700"
                                    : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                                }`}
                              >
                                {lang === "en" ? "English (EN)" : "العربية (AR)"}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-neutral-700">
                            Skin Concerns
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {MAIN_CONCERN_SLUGS.map((concern: string) => {
                              const selected = selectedConcerns.includes(concern);
                              return (
                                <button
                                  type="button"
                                  key={concern}
                                  onClick={() => {
                                    setIsDirty(true);
                                    setSelectedConcerns((prev) =>
                                      selected
                                        ? prev.filter((c) => c !== concern)
                                        : [...prev, concern],
                                    );
                                  }}
                                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                                    selected
                                      ? "bg-blue-600 text-white border-blue-600"
                                      : "bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400"
                                  }`}
                                >
                                  {format.label(concern)}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="pt-2">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-700">
                            <input
                              type="checkbox"
                              checked={newsletterOptIn}
                              onChange={(e) => {
                                setNewsletterOptIn(e.target.checked);
                                setIsDirty(true);
                              }}
                              className="size-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                            />
                            Client opted in to IOMA newsletters and luxury promotional
                            communications
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. ORDERS TAB */}
                {activeTab === "orders" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                      <h3 className="text-xs font-semibold uppercase text-neutral-500 tracking-wider">
                        Order History ({relations.orders?.length || 0})
                      </h3>
                      <span className="text-xs font-medium text-neutral-900">
                        Total Lifetime Spend:{" "}
                        {format.money(stats.lifetimeSpendMinor || 0)}
                      </span>
                    </div>

                    {relations.orders?.length ? (
                      <div className="space-y-2.5">
                        {relations.orders.map((ord: any) => (
                          <div
                            key={ord._id}
                            className="p-3.5 border border-neutral-200 rounded-sm hover:border-neutral-300 bg-white transition-colors flex items-center justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-blue-700">
                                  {ord.orderNumber}
                                </span>
                                <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase bg-neutral-100 text-neutral-600 rounded">
                                  {ord.type || "B2C"}
                                </span>
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                                    ord.paymentStatus === "paid"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                  }`}
                                >
                                  {ord.paymentStatus}
                                </span>
                                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                  {ord.fulfillmentStatus}
                                </span>
                              </div>
                              <div className="text-xs text-neutral-500 flex items-center gap-3">
                                <span>{format.date(ord.createdAt, true)}</span>
                                <span>{ord.items?.length || 0} items</span>
                              </div>
                            </div>

                            <div className="text-right space-y-1">
                              <span className="block text-sm font-bold text-neutral-900">
                                {format.money(ord.totalMinor)}
                              </span>
                              {onOrderClick && (
                                <button
                                  type="button"
                                  onClick={() => onOrderClick(ord._id)}
                                  className="text-[11px] font-medium text-blue-600 hover:underline flex items-center gap-0.5 ml-auto"
                                >
                                  View Order <ExternalLink className="size-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-400 py-6 text-center">
                        This customer has not placed an order yet.
                      </p>
                    )}
                  </div>
                )}

                {/* 3. ADDRESSES TAB */}
                {activeTab === "addresses" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                      <h3 className="text-xs font-semibold uppercase text-neutral-500 tracking-wider">
                        Saved Addresses ({(relations.addresses || []).length})
                      </h3>
                      {canManage && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={openAddAddress}
                          className="h-7 px-2.5 text-xs gap-1 border-neutral-300"
                        >
                          <Plus className="size-3" />
                          Add Address
                        </Button>
                      )}
                    </div>

                    {relations.addresses?.length ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {relations.addresses.map((addr: any) => (
                          <div
                            key={addr._id}
                            className={`p-3.5 border rounded-sm space-y-2 relative ${
                              addr.isDefault
                                ? "border-blue-500 bg-blue-50/20"
                                : "border-neutral-200 bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-xs text-neutral-900">
                                  {addr.label || "Address"}
                                </span>
                                <span className="px-1.5 py-0.2 text-[10px] uppercase font-medium bg-neutral-100 text-neutral-600 rounded">
                                  {addr.type}
                                </span>
                                {addr.isDefault && (
                                  <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded">
                                    Default
                                  </span>
                                )}
                              </div>
                              {canManage && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => openEditAddress(addr)}
                                    className="p-1 text-neutral-400 hover:text-neutral-700 rounded"
                                    title="Edit address"
                                  >
                                    <Edit3 className="size-3.5" />
                                  </button>
                                  <button
                                    onClick={() => deleteAddressMutation.mutate(addr._id)}
                                    className="p-1 text-neutral-400 hover:text-red-600 rounded"
                                    title="Delete address"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="text-xs text-neutral-600 space-y-0.5">
                              <p className="font-medium text-neutral-900">
                                {addr.fullName}
                              </p>
                              <p>{addr.line1}</p>
                              {addr.line2 && <p>{addr.line2}</p>}
                              <p>
                                {addr.city}, {addr.emirate}
                              </p>
                              <p className="text-neutral-500 pt-0.5">{addr.phone}</p>
                            </div>

                            {!addr.isDefault && canManage && (
                              <button
                                onClick={() => setDefaultAddressMutation.mutate(addr._id)}
                                className="text-[11px] text-blue-600 hover:underline pt-1 font-medium block"
                              >
                                Set as Default
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-400 py-6 text-center">
                        No saved addresses for this customer.
                      </p>
                    )}
                  </div>
                )}

                {/* 5. APPOINTMENTS TAB */}
                {activeTab === "appointments" && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold uppercase text-neutral-500 tracking-wider pb-2 border-b border-neutral-200">
                      Booked Clinic Treatments ({(relations.appointments || []).length})
                    </h3>

                    {relations.appointments?.length ? (
                      <div className="space-y-2.5">
                        {relations.appointments.map((apt: any) => (
                          <div
                            key={apt._id}
                            className="p-3.5 border border-neutral-200 rounded-sm bg-white flex items-center justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-neutral-900">
                                  {apt.serviceName || "Treatment"}
                                </span>
                                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                  {apt.status}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-500 flex items-center gap-1">
                                <Building2 className="size-3 text-neutral-400" />
                                {apt.partnerName || "Partner Clinic"} (
                                {apt.partnerCity || "Dubai"})
                              </p>
                            </div>

                            <div className="text-right text-xs">
                              <span className="font-medium text-neutral-900 block">
                                {format.date(apt.startsAt, true)}
                              </span>
                              <span className="text-neutral-400 text-[11px]">
                                {apt.serviceDurationMinutes || 60} mins
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-400 py-6 text-center">
                        No clinic appointments found.
                      </p>
                    )}
                  </div>
                )}

                {/* 6. WISHLIST & ROUTINES TAB */}
                {activeTab === "wishlist" && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold uppercase text-neutral-500 tracking-wider pb-2 border-b border-neutral-200">
                      Wishlist Products ({(relations.wishlistItems || []).length})
                    </h3>

                    {relations.wishlistItems?.length ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {relations.wishlistItems.map((item: any) => (
                          <div
                            key={item.productId}
                            className="p-3 border border-neutral-200 rounded-sm bg-white flex items-center gap-3"
                          >
                            <div className="size-12 rounded bg-neutral-50 border border-neutral-200 shrink-0 overflow-hidden relative">
                              <ProductImage
                                src={item.image}
                                alt={format.label(item.name)}
                                fill
                                className="object-contain"
                              />
                            </div>
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <h4 className="text-xs font-semibold text-neutral-900 truncate">
                                {format.label(item.name)}
                              </h4>
                              <p className="text-[11px] font-bold text-neutral-800">
                                {format.money(item.priceMinor)}
                              </p>
                              <span
                                className={`inline-block text-[10px] font-medium ${item.stock > 0 ? "text-emerald-600" : "text-amber-600"}`}
                              >
                                {item.stock > 0 ? "In Stock" : "Low / Out of stock"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-400 py-6 text-center">
                        No saved items in customer wishlist.
                      </p>
                    )}
                  </div>
                )}

                {/* 7. PROFESSIONAL TAB */}
                {activeTab === "professional" && isPro && (
                  <div className="space-y-4">
                    <div className="p-4 border border-indigo-200 rounded-sm bg-indigo-50/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold uppercase text-indigo-900 tracking-wider flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-indigo-600" />
                          Professional B2B Account Details
                        </h3>
                        <span className="px-2 py-0.5 text-[11px] font-bold uppercase bg-indigo-100 text-indigo-800 rounded">
                          {relations.application?.status ||
                            (record?.roles?.includes("professional_approved")
                              ? "Approved"
                              : "Pending")}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-neutral-500 block text-[11px]">
                            Company Name
                          </span>
                          <span className="font-semibold text-neutral-900">
                            {relations.application?.companyName || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block text-[11px]">
                            Business Type
                          </span>
                          <span className="font-semibold text-neutral-900 uppercase">
                            {relations.application?.businessType || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block text-[11px]">
                            Trade Licence Number
                          </span>
                          <span className="font-mono text-neutral-900">
                            {relations.application?.tradeLicenceNumber || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block text-[11px]">
                            VAT / TRN
                          </span>
                          <span className="font-mono text-neutral-900">
                            {relations.application?.vatNumber || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block text-[11px]">
                            Submitted Date
                          </span>
                          <span className="text-neutral-900">
                            {relations.application?.submittedAt
                              ? format.date(relations.application.submittedAt)
                              : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block text-[11px]">
                            Locations
                          </span>
                          <span className="text-neutral-900">
                            {relations.application?.locationsCount || 1} Location(s)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. SECURITY TAB */}
                {activeTab === "security" && (
                  <div className="space-y-4">
                    <div className="p-4 border border-neutral-200 rounded-sm bg-neutral-50/50 space-y-3">
                      <h3 className="text-xs font-semibold uppercase text-neutral-500 tracking-wider flex items-center gap-1.5">
                        <Shield className="size-3.5 text-blue-600" />
                        Account Security Controls
                      </h3>

                      <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded">
                          <div>
                            <span className="font-semibold text-neutral-900 block">
                              Account Status
                            </span>
                            <span className="text-neutral-500 text-[11px]">
                              Current state:{" "}
                              {record?.status === "active"
                                ? "Active (Can log in)"
                                : "Suspended / Inactive"}
                            </span>
                          </div>
                          {canManage && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setTargetStatus(
                                  record?.status === "active" ? "locked" : "active",
                                );
                                setStatusModalOpen(true);
                              }}
                              className="h-8 text-xs font-medium"
                            >
                              {record?.status === "active" ? (
                                <>
                                  <Lock className="size-3.5 mr-1.5 text-amber-600" />
                                  Suspend Account
                                </>
                              ) : (
                                <>
                                  <Unlock className="size-3.5 mr-1.5 text-emerald-600" />
                                  Reactivate Account
                                </>
                              )}
                            </Button>
                          )}
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded">
                          <div>
                            <span className="font-semibold text-neutral-900 block">
                              Password Reset
                            </span>
                            <span className="text-neutral-500 text-[11px]">
                              Send password recovery email instructions to {record?.email}
                            </span>
                          </div>
                          {canManage && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={resetPasswordMutation.isPending}
                              onClick={() => resetPasswordMutation.mutate()}
                              className="h-8 text-xs font-medium"
                            >
                              <KeyRound className="size-3.5 mr-1.5 text-blue-600" />
                              Send Reset Email
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 9. ACTIVITY TAB */}
                {activeTab === "activity" && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold uppercase text-neutral-500 tracking-wider pb-2 border-b border-neutral-200">
                      Customer Activity Timeline ({(relations.activity || []).length})
                    </h3>

                    {relations.activity?.length ? (
                      <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
                        {relations.activity.map((act: any) => (
                          <div key={act._id} className="relative space-y-1">
                            <span className="absolute -left-4 top-1 size-2 rounded-full bg-blue-600 ring-4 ring-white" />
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-neutral-900">
                                {act.action}
                              </span>
                              <span className="text-[11px] text-neutral-400">
                                {format.date(act.createdAt, true)}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-500">
                              Actor: {act.actorEmail || "System"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-400 py-6 text-center">
                        No recorded activity events for this customer.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Unsaved Changes Warning Modal */}
      <Dialog open={showUnsavedModal} onOpenChange={setShowUnsavedModal}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-neutral-900 flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              Unsaved Changes
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500 mt-1">
              You have modified customer details that have not been saved yet. Discarding
              will lose these edits.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUnsavedModal(false)}
              className="text-xs"
            >
              Continue Editing
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setShowUnsavedModal(false);
                setIsDirty(false);
                setMode("view");
                onOpenChange(false);
              }}
              className="text-xs bg-red-600 hover:bg-red-700 text-white"
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Address Add/Edit Modal */}
      <Dialog open={addressModalOpen} onOpenChange={setAddressModalOpen}>
        <DialogContent className="sm:max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-neutral-900">
              {editingAddressId ? "Edit Customer Address" : "Add Customer Address"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              addressMutation.mutate();
            }}
            className="space-y-4 mt-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-700">Label *</label>
                <input
                  type="text"
                  required
                  value={addrLabel}
                  onChange={(e) => setAddrLabel(e.target.value)}
                  placeholder="Home, Villa, Office"
                  className="w-full min-h-9 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-sm bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-700">
                  Address Type
                </label>
                <select
                  value={addrType}
                  onChange={(e) => setAddrType(e.target.value as any)}
                  className="w-full min-h-9 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-sm bg-white"
                >
                  <option value="shipping">Shipping</option>
                  <option value="billing">Billing</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-700">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  required
                  value={addrFullName}
                  onChange={(e) => setAddrFullName(e.target.value)}
                  className="w-full min-h-9 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-sm bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-700">Phone *</label>
                <input
                  type="tel"
                  required
                  value={addrPhone}
                  onChange={(e) => setAddrPhone(e.target.value)}
                  className="w-full min-h-9 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-sm bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700">
                Street / Building / Villa *
              </label>
              <input
                type="text"
                required
                value={addrLine1}
                onChange={(e) => setAddrLine1(e.target.value)}
                className="w-full min-h-9 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-sm bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-700">
                  Apartment / Unit
                </label>
                <input
                  type="text"
                  value={addrLine2}
                  onChange={(e) => setAddrLine2(e.target.value)}
                  placeholder="Unit 102"
                  className="w-full min-h-9 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-sm bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-700">Emirate *</label>
                <select
                  value={addrEmirate}
                  onChange={(e) => {
                    setAddrEmirate(e.target.value);
                    setAddrCity(e.target.value);
                  }}
                  className="w-full min-h-9 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-sm bg-white"
                >
                  {EMIRATES.map((em) => (
                    <option key={em.code} value={em.name.en}>
                      {em.name.en}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700">
                City / District *
              </label>
              <input
                type="text"
                required
                value={addrCity}
                onChange={(e) => setAddrCity(e.target.value)}
                className="w-full min-h-9 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-sm bg-white"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-700">
                <input
                  type="checkbox"
                  checked={addrIsDefault}
                  onChange={(e) => setAddrIsDefault(e.target.checked)}
                  className="size-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                />
                Set as default {addrType} address
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddressModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={addressMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {addressMutation.isPending ? "Saving…" : "Save Address"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Account Status Confirmation Modal */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-neutral-900">
              {targetStatus === "locked"
                ? "Suspend Customer Account"
                : "Reactivate Customer Account"}
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500 mt-1">
              {targetStatus === "locked"
                ? "Suspending this account will block customer logins and future purchases."
                : "Reactivating this account will restore standard login and shopping access."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-3">
            <label className="text-xs font-medium text-neutral-700">
              Reason / Internal Note
            </label>
            <textarea
              rows={2}
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="Provide reason for this audit event..."
              className="w-full p-2.5 text-xs border border-neutral-300 rounded bg-white"
            />
          </div>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate()}
              className={
                targetStatus === "locked"
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }
            >
              {statusMutation.isPending ? "Updating…" : "Confirm Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
