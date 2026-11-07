"use client";

// Shopify/Polaris-style product workspace: main column of cards (Title,
// Description, Media, Price, Inventory, Shipping, Variants, IOMA content,
// Search engine listing, Source) + right sidebar (Status, Publishing, Product
// organization, Skin intelligence). All styling comes from the shared
// components in ./polaris (tokens in polaris.css); data contract, validation
// and persistence are unchanged.

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminResource } from "@ioma/config";
import { useRouter } from "@/i18n/navigation";
import { useAdminAccess, useAdminQuery } from "@/hooks/use-admin";
import { apiFetch } from "@/lib/api";
import { useStorefrontUrl } from "@/lib/storefront";
import { AdminQueryState, useAdminFormat } from "./admin-ui";
import { WorkspaceField, productFields } from "./product-workspace-fields";
import {
  ProductMediaManager,
  type Detail,
  type Local,
  type Variant,
} from "./admin-products";
import type { ProductMediaImage } from "@/components/shop/product-image";
import {
  Badge,
  Button,
  ButtonLink,
  ExternalButtonLink,
  Card,
  CardFooterButton,
  Checkbox,
  DataTable,
  Field,
  IconButton,
  Input,
  SectionTitle,
  SegmentedControl,
  Select,
  Textarea,
} from "./polaris";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ExternalLink,
  Eye,
  Plus,
  Trash2,
  X,
} from "lucide-react";

type Lang = "en" | "fr" | "ar";
interface SourceInfo {
  externalId: string;
  handle: string;
  url: string;
  sourceUpdatedAt?: string | null;
  lastImportedAt?: string;
  lastSyncedAt?: string;
  status?: "in_sync" | "source_changed" | "conflict" | "missing_from_source";
  untranslated?: string[];
  raw?: unknown;
}

const blank: Local = { en: "", fr: "", ar: "" };
const productResource = adminResource("products")!;
const fieldOf = (key: string) => productResource.fields.find((f) => f.key === key)!;

const STATUS: { value: string; label: string; tone: "success" | "neutral" }[] = [
  { value: "published", label: "Active", tone: "success" },
  { value: "draft", label: "Draft", tone: "neutral" },
  { value: "archived", label: "Archived", tone: "neutral" },
];
const LANGS = [
  { value: "en" as Lang, label: "EN" },
  { value: "ar" as Lang, label: "AR" },
];

const aed = (minor: number | null | undefined) =>
  minor == null || Number.isNaN(minor) ? "" : (minor / 100).toFixed(2);
const toMinor = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};
const newVariant = (): Variant => ({
  _id: "",
  sku: "",
  size: "",
  b2cPriceMinor: 0,
  b2bPriceMinor: null,
  quantityOnHand: 0,
  quantityReserved: 0,
  lowStockThreshold: 5,
  moq: null,
  backorderAllowed: false,
});

export function AdminProductEditor({ id }: { id?: string }) {
  const query = useAdminQuery<Detail>(`resources/products/${id}`, !!id);
  const access = useAdminAccess();
  const manage = !!access.data?.permissions.includes("commerce.manage");
  if (id)
    return (
      <AdminQueryState query={query}>
        {query.data && <Editor key={id} detail={query.data} manage={manage} />}
      </AdminQueryState>
    );
  return <Editor manage={manage} />;
}

export function AdminProductDetail({ id }: { id: string }) {
  return <AdminProductEditor id={id} />;
}

function Editor({ detail, manage }: { detail?: Detail; manage: boolean }) {
  const w = useTranslations("ProductWorkspace");
  const { label, date } = useAdminFormat();
  const router = useRouter();
  const qc = useQueryClient();
  const storefront = useStorefrontUrl();
  const record = detail?.record;

  const [productId, setProductId] = useState(record?._id);
  const savingId = useRef(productId);
  const [lang, setLang] = useState<Lang>("en");
  const [contentLang, setContentLang] = useState<Lang>("en");
  const [dirty, setDirty] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{ kind: "error" | "ok"; text: string } | null>(
    null,
  );
  const [menu, setMenu] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [variants, setVariants] = useState<Variant[]>(detail?.relations.variants ?? []);
  const [media, setMedia] = useState<ProductMediaImage[]>(record?.media ?? []);
  const [revision, setRevision] = useState(record?.mediaRevision ?? 0);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    for (const f of productResource.fields) {
      if (f.key.startsWith("seo.")) {
        initial[f.key] =
          (record?.seo as Record<string, unknown>)?.[f.key.split(".")[1]!] ?? blank;
      } else if (f.type === "localized") initial[f.key] = record?.[f.key] ?? blank;
      else if (f.type === "references" || f.type === "lines")
        initial[f.key] = record?.[f.key] ?? [];
      else if (f.key === "status") initial[f.key] = record?.status ?? "draft";
      else if (f.key === "visibility") initial[f.key] = record?.visibility ?? "b2c";
      else if (f.key === "routineStep") initial[f.key] = record?.routineStep ?? "both";
      else if (f.key === "uaeAvailability")
        initial[f.key] = record?.uaeAvailability ?? "PENDING";
      else if (f.key === "vendor") initial[f.key] = record?.vendor ?? "IOMA Paris";
      else if (f.key === "activeIngredientsList")
        initial[f.key] = record?.activeIngredientsList ?? [];
      else initial[f.key] = record?.[f.key] ?? "";
    }
    return initial;
  });

  const set = (key: string, value: unknown) => {
    setValues((o) => ({ ...o, [key]: value }));
    setDirty(true);
  };
  const setLocal = (key: string, l: Lang, text: string) => {
    setValues((o) => ({ ...o, [key]: { ...blank, ...(o[key] as Local), [l]: text } }));
    setDirty(true);
  };
  const loc = (key: string, l: Lang) => ((values[key] as Local) ?? blank)[l] ?? "";
  const dir = (l: Lang) => (l === "ar" ? "rtl" : "ltr");

  const updateVariant = (index: number, patch: Partial<Variant>) => {
    setVariants((vs) => vs.map((v, i) => (i === index ? { ...v, ...patch } : v)));
    setDirty(true);
  };

  const status = String(values.status);
  const statusDef = STATUS.find((s) => s.value === status) ?? STATUS[1]!;
  const title =
    loc("name", "en") ||
    loc("name", "fr") ||
    label(values.name as Local) ||
    "Untitled product";
  const slug = String(values.slug ?? "");
  const single = variants.length === 1 ? variants[0]! : null;

  const warnings = [
    !variants.some((v) => v.b2cPriceMinor > 0) && "UAE price missing",
    media.length === 0 && "Primary image missing",
    !loc("name", "ar").trim() && "Arabic translation missing",
  ].filter(Boolean) as string[];

  const save = useMutation({
    mutationFn: async () => {
      const sanitized = { ...values };
      for (const k of [
        "name",
        "accroche",
        "shortBenefit",
        "description",
        "details",
        "texture",
        "results",
        "howToUse",
        "fullIngredientsText",
        "benefits",
        "activeIngredients",
        "seo.title",
        "seo.description",
      ]) {
        const l = sanitized[k] as Record<string, string> | undefined;
        if (l && typeof l === "object")
          sanitized[k] = {
            en: l.en || l.fr || "",
            fr: l.fr || l.en || "",
            ar: l.ar ?? "",
          };
      }
      const invalid = productFields(sanitized, status);
      setFieldErrors(
        Object.fromEntries(
          Object.entries(invalid).map(([k, v]) => [
            k,
            ["required", "slug", "number", "price"].includes(v)
              ? w(`validation_${v}`)
              : w("translationRequired", { languages: v }),
          ]),
        ),
      );
      if (Object.keys(invalid).length) {
        const first = Object.keys(invalid)[0]!;
        throw new Error(
          status === "published"
            ? `Can't set this product to Active: ${first} is incomplete (${invalid[first]}). Save it as Draft or complete the field.`
            : `Validation incomplete: ${first} (${invalid[first]})`,
        );
      }
      const allowed = new Set(productResource.fields.map((f) => f.key));
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(sanitized)) if (allowed.has(k)) payload[k] = v;
      payload.status = status;

      let target = savingId.current;
      if (!target) {
        const created = await apiFetch<{ id: string }>("/admin/resources/products", {
          method: "POST",
          body: JSON.stringify({ ...payload, status: "draft" }),
        });
        target = created.id;
        savingId.current = target;
        setProductId(target);
        if (status !== "draft")
          await apiFetch(`/admin/resources/products/${target}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          });
      } else {
        await apiFetch(`/admin/resources/products/${target}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }
      for (const v of variants) {
        const body = JSON.stringify({
          sku: v.sku,
          size: v.size,
          b2cPriceMinor: v.b2cPriceMinor,
          b2bPriceMinor: v.b2bPriceMinor ?? null,
          moq: v.moq ?? null,
          lowStockThreshold: v.lowStockThreshold ?? 5,
          quantityOnHand: v.quantityOnHand ?? 0,
          backorderAllowed: !!v.backorderAllowed,
        });
        if (v._id)
          await apiFetch(`/admin/resources/inventory/${v._id}`, {
            method: "PATCH",
            body,
          });
        else
          await apiFetch(`/admin/resources/inventory`, {
            method: "POST",
            body: JSON.stringify({ ...JSON.parse(body), productId: target }),
          });
      }
      if (media.length > 0)
        await apiFetch(`/admin/products/${target}/media`, {
          method: "PUT",
          body: JSON.stringify({
            revision,
            media: media.map((m) => ({
              assetId: m.id,
              alt: m.alt ?? { en: title, fr: title, ar: title },
            })),
          }),
        });
      return target;
    },
    onSuccess: async (target) => {
      setDirty(false);
      setBanner({ kind: "ok", text: "Product saved." });
      await qc.invalidateQueries();
      if (!detail) router.replace(`/admin/products/${target}`);
    },
    onError: (e) =>
      setBanner({ kind: "error", text: e instanceof Error ? e.message : "Save failed." }),
  });

  const action = useMutation({
    mutationFn: (type: "archive" | "duplicate") =>
      type === "archive"
        ? apiFetch(`/admin/resources/products/${productId}`, {
            method: "PATCH",
            body: JSON.stringify({ status: "archived" }),
          })
        : apiFetch<{ id: string }>(`/admin/products/${productId}/duplicate`, {
            method: "POST",
          }),
    onSuccess: async (result) => {
      setConfirmArchive(false);
      await qc.invalidateQueries();
      if (result && typeof result === "object" && "id" in result)
        router.push(`/admin/products/${result.id}`);
      else set("status", "archived");
    },
  });

  const discard = () => window.location.reload();
  const readOnly = !manage;

  const visibility = String(values.visibility);
  const onlineStore = visibility === "b2c" || visibility === "both";
  const b2b = visibility === "b2b_cabin" || visibility === "both";
  const setChannels = (store: boolean, pro: boolean) =>
    set("visibility", store && pro ? "both" : pro ? "b2b_cabin" : "b2c");

  const contentRows: { key: string; label: string; rows?: number }[] = [
    { key: "accroche", label: "Accroche", rows: 2 },
    { key: "shortBenefit", label: "Description courte (Claim)", rows: 2 },
    { key: "details", label: "Détails" },
    { key: "texture", label: "Texture", rows: 2 },
    { key: "results", label: "Résultats" },
    { key: "howToUse", label: "Conseils d'utilisation" },
    { key: "fullIngredientsText", label: "Ingrédients (INCI)" },
  ];
  const actives =
    (values.activeIngredientsList as {
      name: string;
      percentage?: string;
      description?: Record<string, string>;
    }[]) ?? [];
  const setActives = (next: typeof actives) => set("activeIngredientsList", next);
  const addVariant = () => {
    setVariants((vs) => [...vs, newVariant()]);
    setDirty(true);
  };

  return (
    <div className="mx-auto max-w-[1000px] pb-24">
      {/* Page header */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <ButtonLink variant="plain" small href="/admin/products" className="!w-7 !px-0">
          <ArrowLeft className="pl-mirror" aria-label="Back to Products" />
        </ButtonLink>
        <h1 className="pl-page-title truncate">{title}</h1>
        <Badge tone={statusDef.tone}>{statusDef.label}</Badge>
        <div className="ms-auto flex flex-wrap items-center gap-2">
          {slug && (
            <ExternalButtonLink small href={storefront(`/shop/${slug}`)}>
              <Eye /> View as customer
            </ExternalButtonLink>
          )}
          {slug && (
            <ExternalButtonLink small href={storefront(`/shop/${slug}?preview=1`)}>
              Preview
            </ExternalButtonLink>
          )}
          <div className="relative">
            <Button
              small
              aria-expanded={menu}
              aria-haspopup="menu"
              onClick={() => setMenu((m) => !m)}
            >
              More actions <ChevronDown />
            </Button>
            {menu && (
              <div
                role="menu"
                className="pl-card absolute end-0 top-full z-30 mt-1 w-48 !p-1"
              >
                {slug && (
                  <ExternalButtonLink
                    variant="plain"
                    small
                    href={storefront(`/shop/${slug}`)}
                    className="!w-full !justify-start"
                  >
                    <ExternalLink /> View on website
                  </ExternalButtonLink>
                )}
                {productId && manage && (
                  <Button
                    variant="plain"
                    small
                    className="!w-full !justify-start"
                    onClick={() => {
                      setMenu(false);
                      action.mutate("duplicate");
                    }}
                  >
                    Duplicate
                  </Button>
                )}
                {productId && manage && status !== "archived" && (
                  <Button
                    variant="destructive"
                    small
                    className="!w-full !justify-start"
                    onClick={() => {
                      setMenu(false);
                      setConfirmArchive(true);
                    }}
                  >
                    Archive
                  </Button>
                )}
              </div>
            )}
          </div>
          <Button
            variant="primary"
            small
            disabled={readOnly || save.isPending || !dirty}
            onClick={() => save.mutate()}
          >
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {banner && (
        <div
          role={banner.kind === "error" ? "alert" : "status"}
          className="pl-card mb-4 flex items-start justify-between gap-3 !p-3"
          style={{
            boxShadow: `0 0 0 1px ${banner.kind === "error" ? "var(--pl-critical)" : "var(--pl-success)"}`,
          }}
        >
          <span
            className="flex gap-2"
            style={{
              color: banner.kind === "error" ? "var(--pl-critical)" : "var(--pl-success)",
            }}
          >
            {banner.kind === "error" && (
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            )}
            {banner.text}
          </span>
          <IconButton label="Dismiss" onClick={() => setBanner(null)}>
            <X />
          </IconButton>
        </div>
      )}
      {confirmArchive && (
        <Card className="mb-4 flex flex-wrap items-center justify-between gap-2 !p-3">
          <div
            role="alertdialog"
            aria-label="Archive product"
            className="flex w-full flex-wrap items-center justify-between gap-2"
          >
            <span>Archive this product? It will no longer be shown in the store.</span>
            <span className="flex gap-2">
              <Button small onClick={() => setConfirmArchive(false)}>
                Cancel
              </Button>
              <Button
                small
                variant="primary"
                disabled={action.isPending}
                onClick={() => action.mutate("archive")}
              >
                Archive
              </Button>
            </span>
          </div>
        </Card>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* MAIN COLUMN */}
        <div className="min-w-0 space-y-4">
          <Card
            action={
              <SegmentedControl
                ariaLabel="Content language"
                options={LANGS}
                value={lang}
                onChange={setLang}
              />
            }
          >
            <Field
              label="Title"
              htmlFor="p-title"
              error={fieldErrors.name}
              help="Content is managed in English and Arabic."
            >
              <Input
                id="p-title"
                dir={lang === "ar" ? "rtl" : "ltr"}
                disabled={readOnly}
                value={loc("name", lang)}
                onChange={(e) => setLocal("name", lang, e.target.value)}
                invalid={!!fieldErrors.name}
              />
            </Field>
            <Field
              className="mt-3"
              label="Description"
              htmlFor="p-desc"
              error={fieldErrors.description}
            >
              <Textarea
                id="p-desc"
                className="pl-input--tall"
                dir={lang === "ar" ? "rtl" : "ltr"}
                disabled={readOnly}
                value={loc("description", lang)}
                onChange={(e) => setLocal("description", lang, e.target.value)}
                invalid={!!fieldErrors.description}
              />
            </Field>
          </Card>

          <Card title="Media">
            <ProductMediaManager
              productId={productId}
              images={media}
              name={title}
              editing={!readOnly}
              revision={revision}
              onChangeMedia={(m, r) => {
                setMedia(m);
                if (r !== undefined) setRevision(r);
                setDirty(true);
              }}
            />
          </Card>

          <div>
            <SectionTitle>Price</SectionTitle>
            <Card>
              {single ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="UAE retail price (AED)"
                    htmlFor="p-price"
                    help="Entered in AED. EUR prices are never used."
                  >
                    <Input
                      id="p-price"
                      inputMode="decimal"
                      disabled={readOnly}
                      defaultValue={aed(single.b2cPriceMinor)}
                      onBlur={(e) => {
                        updateVariant(0, { b2cPriceMinor: toMinor(e.target.value) });
                        if (toMinor(e.target.value) > 0)
                          set("uaeAvailability", "AVAILABLE");
                      }}
                    />
                  </Field>
                  <Field label="Professional price (AED)" htmlFor="p-b2b">
                    <Input
                      id="p-b2b"
                      inputMode="decimal"
                      disabled={readOnly}
                      defaultValue={aed(single.b2bPriceMinor)}
                      onBlur={(e) =>
                        updateVariant(0, {
                          b2bPriceMinor: e.target.value ? toMinor(e.target.value) : null,
                        })
                      }
                    />
                  </Field>
                  <Field label="MOQ (professional)" htmlFor="p-moq">
                    <Input
                      id="p-moq"
                      inputMode="numeric"
                      disabled={readOnly}
                      defaultValue={single.moq ?? ""}
                      onBlur={(e) =>
                        updateVariant(0, {
                          moq: e.target.value ? parseInt(e.target.value, 10) : null,
                        })
                      }
                    />
                  </Field>
                </div>
              ) : (
                <p className="pl-help !mt-0">
                  {variants.length
                    ? "This product has several variants — set prices per variant below."
                    : "Add a variant to set a UAE retail price."}
                </p>
              )}
            </Card>
          </div>

          <Card title="Inventory">
            {variants.length === 0 ? (
              <p className="pl-help !mt-0">
                No inventory yet. Add a variant to track stock.
              </p>
            ) : (
              <>
                <DataTable
                  minWidth={520}
                  columns={[
                    { key: "sku", label: "SKU / variant" },
                    { key: "committed", label: "Committed", numeric: true },
                    { key: "available", label: "Available", numeric: true },
                    { key: "onhand", label: "On hand", numeric: true, width: "110px" },
                    { key: "low", label: "Low stock at", numeric: true, width: "110px" },
                  ]}
                >
                  {variants.map((v, i) => (
                    <tr key={v._id || `new-${i}`}>
                      <td>
                        {v.sku || "—"}{" "}
                        {v.size && <span className="pl-help">· {v.size}</span>}
                      </td>
                      <td className="pl-num">{v.quantityReserved ?? 0}</td>
                      <td className="pl-num">
                        {Math.max(0, (v.quantityOnHand ?? 0) - (v.quantityReserved ?? 0))}
                      </td>
                      <td>
                        <Input
                          aria-label={`On hand ${v.sku}`}
                          alignEnd
                          inputMode="numeric"
                          disabled={readOnly}
                          defaultValue={v.quantityOnHand ?? 0}
                          onBlur={(e) =>
                            updateVariant(i, {
                              quantityOnHand: Math.max(
                                0,
                                parseInt(e.target.value || "0", 10),
                              ),
                            })
                          }
                        />
                      </td>
                      <td>
                        <Input
                          aria-label={`Low stock threshold ${v.sku}`}
                          alignEnd
                          inputMode="numeric"
                          disabled={readOnly}
                          defaultValue={v.lowStockThreshold ?? 5}
                          onBlur={(e) =>
                            updateVariant(i, {
                              lowStockThreshold: Math.max(
                                0,
                                parseInt(e.target.value || "0", 10),
                              ),
                            })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </DataTable>
                {single && (
                  <div className="mt-3">
                    <Checkbox
                      label="Sell when out of stock"
                      disabled={readOnly}
                      checked={!!single.backorderAllowed}
                      onChange={(e) =>
                        updateVariant(0, { backorderAllowed: e.target.checked })
                      }
                    />
                  </div>
                )}
              </>
            )}
          </Card>

          <Card title="Shipping">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Capacity (contenance)" htmlFor="p-cap">
                <Input
                  id="p-cap"
                  disabled={readOnly}
                  value={String(values.contenance ?? "")}
                  onChange={(e) => set("contenance", e.target.value)}
                  placeholder="50 ml - 1.69 fl. oz."
                />
              </Field>
              <p className="pl-help self-end !mt-0 pb-1">
                Weight, dimensions, country of origin and HS code are not stored in the
                IOMA catalogue yet.
              </p>
            </div>
          </Card>

          <div>
            <SectionTitle>Variants</SectionTitle>
            <Card>
              {variants.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-[15px] font-semibold">No variants</p>
                  <p className="pl-help mb-3 !mt-0">Variants will appear here.</p>
                  {manage && (
                    <Button small onClick={addVariant}>
                      <Plus /> Add variant
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <DataTable
                    minWidth={640}
                    columns={[
                      { key: "variant", label: "Variant" },
                      { key: "sku", label: "SKU" },
                      { key: "b2c", label: "B2C price (AED)", numeric: true },
                      { key: "b2b", label: "B2B price (AED)", numeric: true },
                      { key: "stock", label: "Stock", numeric: true },
                      {
                        key: "x",
                        label: <span className="sr-only">Actions</span>,
                        width: "40px",
                      },
                    ]}
                  >
                    {variants.map((v, i) => (
                      <tr key={v._id || `new-${i}`}>
                        <td>
                          <Input
                            aria-label="Variant size"
                            disabled={readOnly}
                            defaultValue={v.size}
                            onBlur={(e) => updateVariant(i, { size: e.target.value })}
                          />
                        </td>
                        <td>
                          <Input
                            aria-label="SKU"
                            disabled={readOnly}
                            defaultValue={v.sku}
                            onBlur={(e) => updateVariant(i, { sku: e.target.value })}
                          />
                        </td>
                        <td>
                          <Input
                            aria-label="B2C price"
                            alignEnd
                            inputMode="decimal"
                            disabled={readOnly}
                            defaultValue={aed(v.b2cPriceMinor)}
                            onBlur={(e) =>
                              updateVariant(i, { b2cPriceMinor: toMinor(e.target.value) })
                            }
                          />
                        </td>
                        <td>
                          <Input
                            aria-label="B2B price"
                            alignEnd
                            inputMode="decimal"
                            disabled={readOnly}
                            defaultValue={aed(v.b2bPriceMinor)}
                            onBlur={(e) =>
                              updateVariant(i, {
                                b2bPriceMinor: e.target.value
                                  ? toMinor(e.target.value)
                                  : null,
                              })
                            }
                          />
                        </td>
                        <td>
                          <Input
                            aria-label="Stock on hand"
                            alignEnd
                            inputMode="numeric"
                            disabled={readOnly}
                            defaultValue={v.quantityOnHand ?? 0}
                            onBlur={(e) =>
                              updateVariant(i, {
                                quantityOnHand: Math.max(
                                  0,
                                  parseInt(e.target.value || "0", 10),
                                ),
                              })
                            }
                          />
                        </td>
                        <td>
                          {!v._id && (
                            <IconButton
                              label="Remove variant"
                              destructive
                              onClick={() => {
                                setVariants((vs) => vs.filter((_, j) => j !== i));
                                setDirty(true);
                              }}
                            >
                              <Trash2 />
                            </IconButton>
                          )}
                        </td>
                      </tr>
                    ))}
                  </DataTable>
                  {manage && (
                    <Button small className="mt-3" onClick={addVariant}>
                      <Plus /> Add variant
                    </Button>
                  )}
                </>
              )}
            </Card>
          </div>

          <div>
            <SectionTitle>IOMA product content</SectionTitle>
            <Card
              action={
                <SegmentedControl
                  ariaLabel="Content language"
                  options={LANGS}
                  value={contentLang}
                  onChange={setContentLang}
                />
              }
            >
              <div>
                {contentRows.map((row) => (
                  <div
                    key={row.key}
                    className="grid gap-1 border-t border-[var(--pl-border-subtle)] py-3 first:border-t-0 first:pt-0 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4"
                  >
                    <label className="pl-label !mb-0 pt-1.5" htmlFor={`c-${row.key}`}>
                      {row.label}
                    </label>
                    <Field error={fieldErrors[row.key]}>
                      <Textarea
                        id={`c-${row.key}`}
                        className="min-h-9"
                        rows={row.rows ?? 4}
                        dir={contentLang === "ar" ? "rtl" : "ltr"}
                        disabled={readOnly}
                        value={loc(row.key, contentLang)}
                        onChange={(e) => setLocal(row.key, contentLang, e.target.value)}
                        invalid={!!fieldErrors[row.key]}
                      />
                    </Field>
                  </div>
                ))}
                <div className="grid gap-1 border-t border-[var(--pl-border-subtle)] pt-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
                  <span className="pl-label !mb-0 pt-1.5">Actifs</span>
                  <div className="space-y-2">
                    {actives.length === 0 && (
                      <p className="pl-help !mt-0 pt-1.5">No active ingredients.</p>
                    )}
                    {actives.map((a, i) => (
                      <div
                        key={i}
                        className="grid gap-2 rounded-lg border border-[var(--pl-border)] p-2 sm:grid-cols-[1fr_90px_auto]"
                      >
                        <Input
                          aria-label="Active ingredient"
                          placeholder="Name"
                          disabled={readOnly}
                          value={a.name}
                          onChange={(e) =>
                            setActives(
                              actives.map((x, j) =>
                                j === i ? { ...x, name: e.target.value } : x,
                              ),
                            )
                          }
                        />
                        <Input
                          aria-label="Percentage"
                          placeholder="%"
                          disabled={readOnly}
                          value={a.percentage ?? ""}
                          onChange={(e) =>
                            setActives(
                              actives.map((x, j) =>
                                j === i ? { ...x, percentage: e.target.value } : x,
                              ),
                            )
                          }
                        />
                        {manage && (
                          <IconButton
                            label="Remove active"
                            destructive
                            onClick={() => setActives(actives.filter((_, j) => j !== i))}
                          >
                            <Trash2 />
                          </IconButton>
                        )}
                        <Textarea
                          aria-label={`Description ${contentLang}`}
                          className="min-h-9 sm:col-span-3"
                          rows={2}
                          dir={contentLang === "ar" ? "rtl" : "ltr"}
                          placeholder={`Description (${contentLang.toUpperCase()})`}
                          disabled={readOnly}
                          value={a.description?.[contentLang] ?? ""}
                          onChange={(e) =>
                            setActives(
                              actives.map((x, j) =>
                                j === i
                                  ? {
                                      ...x,
                                      description: {
                                        ...x.description,
                                        [contentLang]: e.target.value,
                                      },
                                    }
                                  : x,
                              ),
                            )
                          }
                        />
                      </div>
                    ))}
                    {manage && actives.length < 5 && (
                      <Button
                        small
                        onClick={() =>
                          setActives([
                            ...actives,
                            { name: "", percentage: "", description: {} },
                          ])
                        }
                      >
                        <Plus /> Add active
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div>
            <SectionTitle>Search engine listing</SectionTitle>
            <Card
              footer={
                <CardFooterButton
                  aria-expanded={seoOpen}
                  onClick={() => setSeoOpen((o) => !o)}
                >
                  {seoOpen ? "Hide SEO fields" : "Edit SEO"}
                  <ChevronDown className={seoOpen ? "rotate-180" : undefined} size={16} />
                </CardFooterButton>
              }
            >
              <div className="min-w-0">
                <p className="truncate">IOMA Paris</p>
                <p className="pl-help !mt-0 truncate">{`ioma-paris.com › shop › ${slug || "…"}`}</p>
                <p
                  className="truncate text-[20px] leading-7"
                  style={{ color: "var(--pl-accent)" }}
                >
                  {loc("seo.title", lang) || title}
                </p>
                <p className="pl-help !mt-0 line-clamp-2">
                  {loc("seo.description", lang) ||
                    loc("shortBenefit", lang) ||
                    loc("description", lang).slice(0, 160)}
                </p>
              </div>
              {seoOpen && (
                <div className="mt-4 space-y-3">
                  <Field
                    label={`SEO title (${lang.toUpperCase()})`}
                    htmlFor="s-title"
                    help={`${loc("seo.title", lang).length} of 70 characters used`}
                  >
                    <Input
                      id="s-title"
                      dir={lang === "ar" ? "rtl" : "ltr"}
                      disabled={readOnly}
                      value={loc("seo.title", lang)}
                      onChange={(e) => setLocal("seo.title", lang, e.target.value)}
                    />
                  </Field>
                  <Field
                    label={`Meta description (${lang.toUpperCase()})`}
                    htmlFor="s-desc"
                    help={`${loc("seo.description", lang).length} of 320 characters used`}
                  >
                    <Textarea
                      id="s-desc"
                      rows={3}
                      dir={lang === "ar" ? "rtl" : "ltr"}
                      disabled={readOnly}
                      value={loc("seo.description", lang)}
                      onChange={(e) => setLocal("seo.description", lang, e.target.value)}
                    />
                  </Field>
                  <Field label="URL handle" htmlFor="s-slug" error={fieldErrors.slug}>
                    <Input
                      id="s-slug"
                      disabled={readOnly}
                      value={slug}
                      onChange={(e) => set("slug", e.target.value)}
                      invalid={!!fieldErrors.slug}
                    />
                  </Field>
                </div>
              )}
            </Card>
          </div>

          <Card
            footer={
              <CardFooterButton
                aria-expanded={sourceOpen}
                onClick={() => setSourceOpen((o) => !o)}
              >
                Source / technical data
                <ChevronDown
                  className={sourceOpen ? "rotate-180" : undefined}
                  size={16}
                />
              </CardFooterButton>
            }
          >
            <p className="pl-help !mt-0">
              Where this product was imported from, and what a synchronisation may change.
            </p>
            {sourceOpen &&
              (() => {
                const src = (record as { source?: SourceInfo | null } | undefined)
                  ?.source;
                return (
                  <div className="mt-3 space-y-3">
                    <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[180px_minmax(0,1fr)]">
                      <dt className="pl-help !mt-0">Origin</dt>
                      <dd>
                        {src ? (
                          <Badge tone="success">Linked to IOMA Paris</Badge>
                        ) : (
                          <Badge>Created in Dubai</Badge>
                        )}
                      </dd>
                      {src && (
                        <>
                          <dt className="pl-help !mt-0">Source product ID</dt>
                          <dd className="break-all font-mono text-[12px]">
                            {src.externalId}
                          </dd>
                          <dt className="pl-help !mt-0">Source handle</dt>
                          <dd className="break-all">{src.handle}</dd>
                          <dt className="pl-help !mt-0">Source page</dt>
                          <dd>
                            <a
                              className="pl-link"
                              href={src.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {src.url}
                            </a>
                          </dd>
                          <dt className="pl-help !mt-0">Source last updated</dt>
                          <dd>{src.sourceUpdatedAt ? date(src.sourceUpdatedAt) : "—"}</dd>
                          <dt className="pl-help !mt-0">Last imported</dt>
                          <dd>{src.lastImportedAt ? date(src.lastImportedAt) : "—"}</dd>
                          <dt className="pl-help !mt-0">Last synchronised</dt>
                          <dd>{src.lastSyncedAt ? date(src.lastSyncedAt) : "—"}</dd>
                          <dt className="pl-help !mt-0">Sync status</dt>
                          <dd>
                            <Badge
                              tone={
                                src.status === "conflict"
                                  ? "critical"
                                  : src.status === "source_changed"
                                    ? "warning"
                                    : "success"
                              }
                            >
                              {(src.status ?? "in_sync").replace("_", " ")}
                            </Badge>
                          </dd>
                          {src.untranslated?.length ? (
                            <>
                              <dt className="pl-help !mt-0">Still in French</dt>
                              <dd>{src.untranslated.join(", ")}</dd>
                            </>
                          ) : null}
                        </>
                      )}
                      <dt className="pl-help !mt-0">Last updated</dt>
                      <dd>{record?.updatedAt ? date(record.updatedAt) : "—"}</dd>
                      <dt className="pl-help !mt-0">Record ID</dt>
                      <dd className="break-all font-mono text-[12px]">
                        {record?._id || "New draft"}
                      </dd>
                    </dl>
                    {src ? (
                      <p className="pl-help">
                        AED prices, professional prices, stock, publication, SEO and
                        classification are Dubai-owned: a synchronisation never overwrites
                        them. Review changes in the{" "}
                        <a className="pl-link" href="/admin/products/import">
                          import center
                        </a>
                        .
                      </p>
                    ) : (
                      <p className="pl-help">
                        This product has no link to the IOMA Paris catalogue, so a
                        synchronisation will not change it. Importing a source product
                        with the same handle links it without overwriting anything.
                      </p>
                    )}
                    {src?.raw ? (
                      <details>
                        <summary className="pl-link cursor-pointer">
                          Raw source JSON (as last imported)
                        </summary>
                        <pre className="mt-2 max-h-80 overflow-auto rounded bg-neutral-50 p-3 text-[11px]">
                          {JSON.stringify(src.raw, null, 2)}
                        </pre>
                      </details>
                    ) : null}
                  </div>
                );
              })()}
          </Card>
        </div>

        {/* SIDEBAR */}
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-16">
          <Card>
            <Field label="Status" htmlFor="p-status">
              <Select
                id="p-status"
                disabled={readOnly}
                value={status}
                onChange={(e) => set("status", e.target.value)}
              >
                {STATUS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
          </Card>

          <Card title="Publishing">
            <div className="space-y-2">
              <Checkbox
                label="Online Store (B2C)"
                disabled={readOnly}
                checked={onlineStore}
                onChange={(e) => setChannels(e.target.checked, b2b)}
              />
              <Checkbox
                label="B2B professional"
                disabled={readOnly}
                checked={b2b}
                onChange={(e) => setChannels(onlineStore, e.target.checked)}
              />
            </div>
            <p className="pl-help">
              {b2b && !onlineStore
                ? "B2B only: hidden from the public store."
                : b2b
                  ? "Visible to everyone; professional price only for approved professionals."
                  : "Public store only."}
            </p>
            {warnings.length > 0 && (
              <ul
                className="mt-3 flex flex-wrap gap-1.5"
                aria-label="Publishing warnings"
              >
                {warnings.map((m) => (
                  <li key={m}>
                    <Badge tone="warning" icon={<AlertTriangle />}>
                      {m}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Product organization">
            <div className="space-y-3">
              <Field label="Product type" htmlFor="p-type">
                <Input
                  id="p-type"
                  disabled={readOnly}
                  value={String(values.productType ?? "")}
                  onChange={(e) => set("productType", e.target.value)}
                />
              </Field>
              <Field label="Vendor" htmlFor="p-vendor">
                <Input
                  id="p-vendor"
                  disabled={readOnly}
                  value={String(values.vendor ?? "")}
                  onChange={(e) => set("vendor", e.target.value)}
                />
              </Field>
              <WorkspaceField
                field={fieldOf("rangeId")}
                value={values.rangeId}
                editing={!readOnly}
                disabled={readOnly}
                onChange={(v) => set("rangeId", v)}
                error={fieldErrors.rangeId}
              />
              <WorkspaceField
                field={fieldOf("categoryIds")}
                value={values.categoryIds}
                editing={!readOnly}
                disabled={readOnly}
                onChange={(v) => set("categoryIds", v)}
              />
              <Field label="Tags" htmlFor="p-tags" help="Comma separated">
                <Input
                  id="p-tags"
                  disabled={readOnly}
                  defaultValue={((values.tags as string[]) ?? []).join(", ")}
                  onBlur={(e) =>
                    set(
                      "tags",
                      e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    )
                  }
                />
              </Field>
            </div>
          </Card>

          <Card title="Skin intelligence">
            <div className="space-y-3">
              <WorkspaceField
                field={fieldOf("concernIds")}
                value={values.concernIds}
                editing={!readOnly}
                disabled={readOnly}
                onChange={(v) => set("concernIds", v)}
              />
              <WorkspaceField
                field={fieldOf("skinTypeIds")}
                value={values.skinTypeIds}
                editing={!readOnly}
                disabled={readOnly}
                onChange={(v) => set("skinTypeIds", v)}
              />
              <Field label="Routine time" htmlFor="p-routine">
                <Select
                  id="p-routine"
                  disabled={readOnly}
                  value={String(values.routineStep)}
                  onChange={(e) => set("routineStep", e.target.value)}
                >
                  <option value="morning">Morning</option>
                  <option value="evening">Evening</option>
                  <option value="both">Morning &amp; evening</option>
                </Select>
              </Field>
            </div>
          </Card>
        </aside>
      </div>

      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 bg-[#1a1a1a] px-4 py-2.5 text-white xl:ps-[236px]">
          <span>Unsaved changes</span>
          <span className="flex gap-2">
            <Button
              small
              variant="plain"
              className="!text-white hover:!bg-white/10"
              onClick={discard}
            >
              Discard
            </Button>
            <Button
              small
              disabled={save.isPending || readOnly}
              onClick={() => save.mutate()}
            >
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </span>
        </div>
      )}
    </div>
  );
}
