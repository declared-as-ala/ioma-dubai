"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Power,
} from "lucide-react";
import { adminResource } from "@ioma/config";
import { Link } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api";
import { useAdminAccess, useAdminQuery } from "@/hooks/use-admin";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Select,
  Tag,
  Textarea,
  Toggle,
} from "./polaris";
import { AdminQueryState, useAdminFormat } from "./admin-ui";
import { PartnerPhotoUploader } from "./partner-photo-uploader";
import type { PlaceInfo } from "./partner-map-picker";

// Leaflet touches `window`, so the map only loads in the browser.
const PartnerMapPicker = dynamic(
  () => import("./partner-map-picker").then((m) => m.PartnerMapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[340px] place-items-center rounded-lg border border-[var(--pl-border)] text-[13px]">
        Loading map…
      </div>
    ),
  },
);

const TYPES = [
  "spa",
  "clinic",
  "beauty_institute",
  "hotel",
  "retail",
  "diagnostic_center",
  "distributor",
];
const EMIRATES = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah",
];

type Values = {
  name: string;
  slug: string;
  type: string;
  status: "active" | "inactive" | "archived";
  descEn: string;
  descFr: string;
  descAr: string;
  emirate: string;
  city: string;
  address: string;
  lat: string;
  lng: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  openingHours: string;
  mediaIds: string[];
  serviceIds: string[];
  diagnosisAvailable: boolean;
};

const slugify = (v: string) =>
  v
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

function initial(record?: Record<string, any>): Values {
  return {
    name: record?.name ?? "",
    slug: record?.slug ?? "",
    type: record?.type ?? "spa",
    status: record?.status ?? "active",
    descEn: record?.description?.en ?? "",
    descFr: record?.description?.fr ?? "",
    descAr: record?.description?.ar ?? "",
    emirate: record?.emirate ?? "Dubai",
    city: record?.city ?? "",
    address: record?.address ?? "",
    lat: record?.coordinates?.lat != null ? String(record.coordinates.lat) : "",
    lng: record?.coordinates?.lng != null ? String(record.coordinates.lng) : "",
    phone: record?.phone ?? "",
    whatsapp: record?.whatsapp ?? "",
    email: record?.email ?? "",
    website: record?.website ?? "",
    openingHours:
      typeof record?.openingHours === "string"
        ? record.openingHours
        : (record?.openingHours?.en ?? ""),
    mediaIds: record?.mediaIds ?? [],
    serviceIds: (record?.serviceIds ?? []).map(String),
    diagnosisAvailable: !!record?.diagnosisAvailable,
  };
}

function useServices() {
  return useAdminQuery<Record<string, any>[]>("references/services");
}
const serviceName = (s: Record<string, any>) =>
  s.name?.en || s.name || s.slug || String(s._id);

/* ------------------------------------------------------------------ */
/* Create / edit drawer                                                */
/* ------------------------------------------------------------------ */
export function PartnerDrawer({
  open,
  onOpenChange,
  record,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: Record<string, any>;
  onSaved: (id: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="admin-shell w-full gap-0 p-0 sm:max-w-2xl">
        {open && (
          <PartnerForm
            key={record?._id ?? "new"}
            record={record}
            onCancel={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function PartnerForm({
  record,
  onCancel,
  onSaved,
}: {
  record?: Record<string, any>;
  onCancel: () => void;
  onSaved: (id: string) => void;
}) {
  const qc = useQueryClient();
  const services = useServices();
  const [v, setV] = useState<Values>(() => initial(record));
  const [slugTouched, setSlugTouched] = useState(!!record);
  const [tried, setTried] = useState(false);
  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setV((s) => ({ ...s, [key]: value }));

  const lat = Number(v.lat);
  const lng = Number(v.lng);
  const hasPin =
    v.lat !== "" && v.lng !== "" && Number.isFinite(lat) && Number.isFinite(lng);
  const errors = useMemo(() => {
    const e: Partial<Record<string, string>> = {};
    if (!v.name.trim()) e.name = "Enter the partner name.";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.slug))
      e.slug = "Use lowercase letters, numbers and hyphens.";
    if (!v.descEn.trim()) e.descEn = "Add an English description.";
    if (!v.descAr.trim()) e.descAr = "Add an Arabic description.";
    if (!v.city.trim()) e.city = "Enter the city.";
    if (!v.address.trim()) e.address = "Enter the address.";
    if (!hasPin || lat < -90 || lat > 90 || lng < -180 || lng > 180)
      e.map = "Pick the location on the map.";
    if (!v.phone.trim()) e.phone = "Enter a phone number.";
    if (v.email && !/^\S+@\S+\.\S+$/.test(v.email))
      e.email = "Enter a valid email address.";
    return e;
  }, [v, hasPin, lat, lng]);

  const save = useMutation({
    mutationFn: () =>
      apiFetch<{ id: string }>(
        `/admin/resources/partners${record ? `/${record._id}` : ""}`,
        {
          method: record ? "PATCH" : "POST",
          body: JSON.stringify({
            ...(record ? {} : { slug: v.slug }),
            name: v.name.trim(),
            description: {
              en: v.descEn.trim(),
              fr: v.descFr.trim() || undefined,
              ar: v.descAr.trim(),
            },
            type: v.type,
            emirate: v.emirate,
            city: v.city.trim(),
            address: v.address.trim(),
            "coordinates.lat": lat,
            "coordinates.lng": lng,
            phone: v.phone.trim(),
            whatsapp: v.whatsapp.trim() || null,
            email: v.email.trim() || null,
            website: v.website.trim() || null,
            openingHours: v.openingHours.trim() || null,
            mediaIds: v.mediaIds,
            serviceIds: v.serviceIds,
            diagnosisAvailable: v.diagnosisAvailable,
            status: v.status,
          }),
        },
      ),
    onSuccess: async (res) => {
      await qc.invalidateQueries();
      onSaved(res.id ?? String(record?._id));
    },
  });

  const submit = () => {
    setTried(true);
    if (Object.keys(errors).length) {
      document.getElementById("partner-form-top")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    save.mutate();
  };
  const err = (k: string) => (tried ? errors[k] : undefined);
  const applyPlace = (p: PlaceInfo) =>
    setV((s) => ({
      ...s,
      address: p.address || s.address,
      city: p.city || s.city,
      emirate: p.emirate || s.emirate,
    }));
  const emirateOptions =
    EMIRATES.includes(v.emirate) || !v.emirate ? EMIRATES : [v.emirate, ...EMIRATES];

  return (
    <form
      className="flex h-full min-h-0 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      noValidate
    >
      <SheetHeader className="border-b border-[var(--pl-border-subtle)] px-6 py-4 text-start">
        <SheetTitle className="text-[15px] font-semibold">
          {record ? `Edit ${record.name}` : "Add a partner"}
        </SheetTitle>
        <SheetDescription className="text-[13px]">
          {record
            ? "Update the partner profile shown on the website locator."
            : "A new location for the partner locator and appointment booking."}
        </SheetDescription>
      </SheetHeader>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[var(--pl-bg)] p-4 sm:p-6">
        <span id="partner-form-top" />
        {tried && Object.keys(errors).length > 0 && (
          <p
            role="alert"
            className="rounded-lg border p-3 text-[13px]"
            style={{ borderColor: "var(--pl-critical)", color: "var(--pl-critical)" }}
          >
            Fix {Object.keys(errors).length} field
            {Object.keys(errors).length === 1 ? "" : "s"} below to save.
          </p>
        )}

        <Card title="Photos">
          <PartnerPhotoUploader
            value={v.mediaIds}
            onChange={(urls) => set("mediaIds", urls)}
          />
        </Card>

        <Card title="Profile">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Name"
              htmlFor="p-name"
              error={err("name")}
              className="sm:col-span-2"
            >
              <Input
                id="p-name"
                value={v.name}
                onChange={(e) => {
                  set("name", e.target.value);
                  if (!slugTouched) set("slug", slugify(e.target.value));
                }}
                maxLength={120}
                autoFocus
              />
            </Field>
            <Field label="Type" htmlFor="p-type">
              <Select
                id="p-type"
                value={v.type}
                onChange={(e) => set("type", e.target.value)}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="URL slug"
              htmlFor="p-slug"
              error={err("slug")}
              help={
                record
                  ? "The slug cannot be changed after creation."
                  : "Used in the partner's web address."
              }
            >
              <Input
                id="p-slug"
                value={v.slug}
                disabled={!!record}
                dir="ltr"
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value.toLowerCase());
                }}
              />
            </Field>
            <Field
              label="Description (English)"
              htmlFor="p-den"
              error={err("descEn")}
              className="sm:col-span-2"
            >
              <Textarea
                id="p-den"
                rows={3}
                value={v.descEn}
                onChange={(e) => set("descEn", e.target.value)}
              />
            </Field>
            <Field
              label="Description (French)"
              htmlFor="p-dfr"
              help="Optional"
              className="sm:col-span-2"
            >
              <Textarea
                id="p-dfr"
                rows={3}
                value={v.descFr}
                onChange={(e) => set("descFr", e.target.value)}
              />
            </Field>
            <Field
              label="Description (Arabic)"
              htmlFor="p-dar"
              error={err("descAr")}
              className="sm:col-span-2"
            >
              <Textarea
                id="p-dar"
                rows={3}
                dir="rtl"
                value={v.descAr}
                onChange={(e) => set("descAr", e.target.value)}
              />
            </Field>
          </div>
        </Card>

        <Card title="Location">
          <div className="space-y-4">
            <PartnerMapPicker
              value={hasPin ? { lat, lng } : null}
              onChange={(p) =>
                setV((s) => ({ ...s, lat: String(p.lat), lng: String(p.lng) }))
              }
              onPlace={applyPlace}
            />
            {err("map") && (
              <p
                role="alert"
                className="text-[13px]"
                style={{ color: "var(--pl-critical)" }}
              >
                {err("map")}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Latitude" htmlFor="p-lat">
                <Input
                  id="p-lat"
                  inputMode="decimal"
                  dir="ltr"
                  value={v.lat}
                  onChange={(e) => set("lat", e.target.value)}
                />
              </Field>
              <Field label="Longitude" htmlFor="p-lng">
                <Input
                  id="p-lng"
                  inputMode="decimal"
                  dir="ltr"
                  value={v.lng}
                  onChange={(e) => set("lng", e.target.value)}
                />
              </Field>
              <Field label="Emirate" htmlFor="p-em">
                <Select
                  id="p-em"
                  value={v.emirate}
                  onChange={(e) => set("emirate", e.target.value)}
                >
                  {emirateOptions.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </Select>
              </Field>
              <Field label="City / area" htmlFor="p-city" error={err("city")}>
                <Input
                  id="p-city"
                  value={v.city}
                  onChange={(e) => set("city", e.target.value)}
                />
              </Field>
              <Field
                label="Address"
                htmlFor="p-addr"
                error={err("address")}
                className="sm:col-span-2"
              >
                <Textarea
                  id="p-addr"
                  rows={2}
                  value={v.address}
                  onChange={(e) => set("address", e.target.value)}
                />
              </Field>
            </div>
          </div>
        </Card>

        <Card title="Contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" htmlFor="p-phone" error={err("phone")}>
              <Input
                id="p-phone"
                type="tel"
                dir="ltr"
                value={v.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+971 4 000 0000"
              />
            </Field>
            <Field label="WhatsApp" htmlFor="p-wa" help="Optional">
              <Input
                id="p-wa"
                type="tel"
                dir="ltr"
                value={v.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
                placeholder="+971 50 000 0000"
              />
            </Field>
            <Field label="Email" htmlFor="p-email" error={err("email")} help="Optional">
              <Input
                id="p-email"
                type="email"
                dir="ltr"
                value={v.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="contact@partner.ae"
              />
            </Field>
            <Field label="Website" htmlFor="p-web" help="Optional">
              <Input
                id="p-web"
                type="url"
                dir="ltr"
                value={v.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field
              label="Opening hours"
              htmlFor="p-hours"
              help="E.g. Mon–Sun: 10:00 AM – 10:00 PM"
              className="sm:col-span-2"
            >
              <Input
                id="p-hours"
                value={v.openingHours}
                onChange={(e) => set("openingHours", e.target.value)}
                placeholder="Daily: 10:00 AM – 10:00 PM"
              />
            </Field>
          </div>
        </Card>

        <Card title="Services & status">
          <div className="space-y-4">
            <div>
              <p className="pl-label mb-2">Services offered</p>
              {services.data?.length ? (
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label="Services offered"
                >
                  {services.data.map((s) => {
                    const id = String(s._id);
                    const on = v.serviceIds.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          set(
                            "serviceIds",
                            on
                              ? v.serviceIds.filter((x) => x !== id)
                              : [...v.serviceIds, id],
                          )
                        }
                        className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] ${on ? "border-[var(--pl-text)] bg-[var(--pl-text)] text-white" : "border-[var(--pl-border)] bg-white"}`}
                      >
                        {on && <Check className="size-3.5" aria-hidden />}
                        {serviceName(s)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="pl-help !mt-0">
                  {services.isLoading
                    ? "Loading services…"
                    : "No services yet. Create them under Services & Treatments."}
                </p>
              )}
            </div>
            <Toggle
              label="Skin diagnosis available at this location"
              checked={v.diagnosisAvailable}
              onChange={(e) => set("diagnosisAvailable", e.target.checked)}
            />
            <Field label="Publication status" htmlFor="p-status">
              <Select
                id="p-status"
                value={v.status}
                onChange={(e) => set("status", e.target.value as any)}
              >
                <option value="active">
                  Active — published on the public partner locator
                </option>
                <option value="inactive">
                  Inactive — unpublished (hidden from public)
                </option>
                <option value="archived">
                  Archived — permanently closed / past partner
                </option>
              </Select>
            </Field>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--pl-border-subtle)] bg-white px-6 py-3">
        <p
          role="status"
          className="min-w-0 truncate text-[13px]"
          style={{ color: save.isError ? "var(--pl-critical)" : undefined }}
        >
          {save.isError
            ? save.error instanceof Error
              ? save.error.message
              : "Could not save. Check the fields and retry."
            : ""}
        </p>
        <div className="flex shrink-0 gap-2">
          <Button onClick={onCancel} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={save.isPending}>
            {save.isPending ? "Saving…" : record ? "Save changes" : "Add partner"}
          </Button>
        </div>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Detail page                                                         */
/* ------------------------------------------------------------------ */
const label = (v: string) => v.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

export function AdminPartnerDetail({ id }: { id: string }) {
  const t = useTranslations("AdminExperience");
  const f = useAdminFormat();
  const qc = useQueryClient();
  const access = useAdminAccess();
  const resource = adminResource("partners")!;
  const q = useAdminQuery<{ record: Record<string, any> }>(
    `resources/partners/${id}`,
    !!access.data?.permissions.includes("partners.view"),
  );
  const services = useServices();
  const [editing, setEditing] = useState(false);
  const [photo, setPhoto] = useState(0);

  const toggle = useMutation({
    mutationFn: (status: "active" | "inactive") =>
      apiFetch(`/admin/resources/partners/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries(),
  });

  if (!access.data?.permissions.includes(`${resource.domain}.view`))
    return <p role="alert">{t("denied")}</p>;
  const manage = access.data.permissions.includes(`${resource.domain}.manage`);

  return (
    <div className="mx-auto max-w-[1100px] space-y-4">
      <Link
        href="/admin/partners"
        className="pl-link inline-flex items-center gap-1 text-[13px]"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden /> {t("back")}
      </Link>
      <AdminQueryState query={q}>
        {q.data &&
          (() => {
            const r = q.data.record;
            const photos: string[] = r.mediaIds ?? [];
            const active = r.status === "active";
            const lat = r.coordinates?.lat;
            const lng = r.coordinates?.lng;
            const chosen = (services.data ?? []).filter((s) =>
              (r.serviceIds ?? []).map(String).includes(String(s._id)),
            );
            const mapsHref =
              lat != null ? `https://www.google.com/maps?q=${lat},${lng}` : null;
            return (
              <>
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="pl-page-title">{r.name}</h1>
                      <Badge tone={active ? "success" : "neutral"}>
                        {active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="pl-help !mt-1">
                      {label(r.type)} · {[r.city, r.emirate].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  {manage && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => toggle.mutate(active ? "inactive" : "active")}
                        disabled={toggle.isPending}
                      >
                        <Power /> {active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button variant="primary" onClick={() => setEditing(true)}>
                        <Pencil /> Edit
                      </Button>
                    </div>
                  )}
                </header>
                {toggle.isError && (
                  <p
                    role="alert"
                    className="text-[13px]"
                    style={{ color: "var(--pl-critical)" }}
                  >
                    Could not change the status. Try again.
                  </p>
                )}

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                  <div className="space-y-4">
                    <Card flush>
                      {photos.length ? (
                        <div>
                          <img
                            src={photos[Math.min(photo, photos.length - 1)]}
                            alt={`${r.name} photo`}
                            className="aspect-[16/9] w-full rounded-t-[inherit] object-cover"
                          />
                          {photos.length > 1 && (
                            <ul className="flex gap-2 overflow-x-auto p-3">
                              {photos.map((u, i) => (
                                <li key={u}>
                                  <button
                                    type="button"
                                    aria-label={`Show photo ${i + 1}`}
                                    aria-current={i === photo}
                                    onClick={() => setPhoto(i)}
                                    className={`block overflow-hidden rounded-md border-2 ${i === photo ? "border-[var(--pl-text)]" : "border-transparent"}`}
                                  >
                                    <img
                                      src={u.replace(/\/main$/, "/card")}
                                      alt=""
                                      className="size-16 object-cover"
                                    />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : (
                        <div className="grid aspect-[16/6] place-items-center text-center">
                          <div>
                            <p className="text-[13px] font-semibold">No photos yet</p>
                            {manage && (
                              <button
                                type="button"
                                className="pl-link text-[13px]"
                                onClick={() => setEditing(true)}
                              >
                                Add photos
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>

                    <Card title="About">
                      <div className="space-y-3 text-[13px] leading-relaxed">
                        <p>{r.description?.en || "—"}</p>
                        <p dir="rtl" className="text-[var(--pl-text-subdued)]">
                          {r.description?.ar || "—"}
                        </p>
                      </div>
                    </Card>

                    <Card
                      title="Location"
                      action={
                        mapsHref ? (
                          <a
                            className="pl-link inline-flex items-center gap-1 text-[13px]"
                            href={mapsHref}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open in Maps <ExternalLink className="size-3.5" aria-hidden />
                          </a>
                        ) : undefined
                      }
                    >
                      <div className="space-y-3">
                        <p className="flex items-start gap-2 text-[13px]">
                          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                          <span>{r.address || "—"}</span>
                        </p>
                        {lat != null && lng != null ? (
                          <PartnerMapPicker
                            value={{ lat, lng }}
                            onChange={() => {}}
                            disabled
                            height={280}
                          />
                        ) : (
                          <p className="pl-help">No coordinates saved.</p>
                        )}
                        <p className="pl-help !mt-0" dir="ltr">
                          {lat}, {lng}
                        </p>
                      </div>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <Card title="Contact">
                      <ul className="space-y-3 text-[13px]">
                        <li>
                          <a
                            className="pl-link inline-flex items-center gap-2"
                            href={`tel:${String(r.phone).replace(/\s+/g, "")}`}
                            dir="ltr"
                          >
                            <Phone className="size-4" aria-hidden /> {r.phone || "—"}
                          </a>
                        </li>
                        {r.whatsapp && (
                          <li>
                            <a
                              className="pl-link inline-flex items-center gap-2"
                              href={`https://wa.me/${String(r.whatsapp).replace(/[^\d]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              dir="ltr"
                            >
                              <MessageCircle className="size-4" aria-hidden />{" "}
                              {r.whatsapp}
                            </a>
                          </li>
                        )}
                        {r.email && (
                          <li>
                            <a
                              className="pl-link inline-flex items-center gap-2 break-all"
                              href={`mailto:${r.email}`}
                            >
                              <Mail className="size-4 shrink-0" aria-hidden /> {r.email}
                            </a>
                          </li>
                        )}
                      </ul>
                    </Card>

                    <Card title="Services">
                      {chosen.length ? (
                        <div className="flex flex-wrap gap-2">
                          {chosen.map((s) => (
                            <Tag key={String(s._id)}>{serviceName(s)}</Tag>
                          ))}
                        </div>
                      ) : (
                        <p className="pl-help !mt-0">No services linked.</p>
                      )}
                      <p className="mt-3 text-[13px]">
                        <Badge tone={r.diagnosisAvailable ? "success" : "neutral"}>
                          {r.diagnosisAvailable ? "Diagnosis available" : "No diagnosis"}
                        </Badge>
                      </p>
                    </Card>

                    <Card title="Record">
                      <dl className="space-y-2 text-[13px]">
                        <div className="flex justify-between gap-3">
                          <dt className="text-[var(--pl-text-subdued)]">Slug</dt>
                          <dd className="break-all" dir="ltr">
                            {r.slug}
                          </dd>
                        </div>
                        {r.createdAt && (
                          <div className="flex justify-between gap-3">
                            <dt className="text-[var(--pl-text-subdued)]">Created</dt>
                            <dd>{f.date(r.createdAt, true)}</dd>
                          </div>
                        )}
                        {r.updatedAt && (
                          <div className="flex justify-between gap-3">
                            <dt className="text-[var(--pl-text-subdued)]">Updated</dt>
                            <dd>{f.date(r.updatedAt, true)}</dd>
                          </div>
                        )}
                      </dl>
                    </Card>
                  </div>
                </div>

                <PartnerDrawer
                  open={editing}
                  onOpenChange={setEditing}
                  record={r}
                  onSaved={() => setEditing(false)}
                />
              </>
            );
          })()}
      </AdminQueryState>
    </div>
  );
}
