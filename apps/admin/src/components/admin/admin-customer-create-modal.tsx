"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EMIRATES } from "@ioma/config";
import { User, Mail, Phone, MapPin, Globe, Loader2, Plus } from "lucide-react";

interface CreateCustomerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newCustomerId: string) => void;
}

export function AdminCustomerCreateModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateCustomerProps) {
  const t = useTranslations("AdminExperience");
  const qc = useQueryClient();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredLocale, setPreferredLocale] = useState<"en" | "fr" | "ar">("en");

  // Optional initial address
  const [addAddress, setAddAddress] = useState(false);
  const [addressLabel, setAddressLabel] = useState("Home");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("Dubai");
  const [emirate, setEmirate] = useState("Dubai");

  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, any> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        preferredLocale,
      };
      if (phone.trim()) payload.phone = phone.trim();
      if (addAddress && line1.trim()) {
        payload.address = {
          label: addressLabel.trim() || "Home",
          line1: line1.trim(),
          line2: line2.trim() || null,
          city: city.trim() || "Dubai",
          emirate: emirate.trim() || "Dubai",
          phone: phone.trim() || undefined,
        };
      }
      return apiFetch<{ id: string; email: string; firstName: string; lastName: string }>(
        "/admin/customers",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      resetForm();
      onOpenChange(false);
      onSuccess?.(data.id);
    },
    onError: (err: any) => {
      setError(err?.message || "Failed to create customer.");
    },
  });

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setPreferredLocale("en");
    setAddAddress(false);
    setLine1("");
    setLine2("");
    setCity("Dubai");
    setEmirate("Dubai");
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("First name, last name, and email are required.");
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetForm();
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0 border border-neutral-200">
        <div className="p-6 border-b border-neutral-200 bg-neutral-50/50">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight text-neutral-900 flex items-center gap-2">
              <User className="size-5 text-blue-600" />
              Create New Customer
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500 mt-1">
              Add a new client account. An invitation and password-set workflow will be
              triggered.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700">First Name *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Sarah"
                className="w-full min-h-10 px-3 py-2 text-sm border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700">Last Name *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Al Maktoum"
                className="w-full min-h-10 px-3 py-2 text-sm border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700 flex items-center gap-1.5">
                <Mail className="size-3.5 text-neutral-400" />
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@example.ae"
                className="w-full min-h-10 px-3 py-2 text-sm border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700 flex items-center gap-1.5">
                <Phone className="size-3.5 text-neutral-400" />
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+971 50 123 4567"
                className="w-full min-h-10 px-3 py-2 text-sm border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700 flex items-center gap-1.5">
              <Globe className="size-3.5 text-neutral-400" />
              Preferred Language
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["en", "ar"] as const).map((lang) => (
                <button
                  type="button"
                  key={lang}
                  onClick={() => setPreferredLocale(lang)}
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

          <div className="border-t border-neutral-200 pt-4">
            <button
              type="button"
              onClick={() => setAddAddress(!addAddress)}
              className="text-xs font-medium text-blue-700 flex items-center gap-1.5 hover:underline"
            >
              <Plus
                className={`size-3.5 transition-transform ${addAddress ? "rotate-45" : ""}`}
              />
              {addAddress
                ? "Remove Initial Delivery Address"
                : "Add Initial Delivery Address"}
            </button>

            {addAddress && (
              <div className="mt-3 p-4 bg-neutral-50 border border-neutral-200 rounded-sm space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-neutral-600">
                      Address Label
                    </label>
                    <input
                      type="text"
                      value={addressLabel}
                      onChange={(e) => setAddressLabel(e.target.value)}
                      placeholder="Home / Villa"
                      className="w-full min-h-9 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-sm bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-neutral-600">
                      Emirate
                    </label>
                    <select
                      value={emirate}
                      onChange={(e) => {
                        setEmirate(e.target.value);
                        setCity(e.target.value);
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
                  <label className="text-[11px] font-medium text-neutral-600">
                    Street / Building / Villa *
                  </label>
                  <input
                    type="text"
                    required={addAddress}
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    placeholder="e.g. Al Wasl Road, Villa 12B"
                    className="w-full min-h-9 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-sm bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-neutral-600">
                      Apartment / Unit (Optional)
                    </label>
                    <input
                      type="text"
                      value={line2}
                      onChange={(e) => setLine2(e.target.value)}
                      placeholder="Unit 402"
                      className="w-full min-h-9 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-sm bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-neutral-600">
                      City / District
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Jumeirah 1"
                      className="w-full min-h-9 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-sm bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="min-h-10 px-4 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="min-h-10 px-5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Creating Customer…
                </>
              ) : (
                "Create Customer"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
