"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAdminAccess, useAdminQuery } from "@/hooks/use-admin";
import { Button, Card, Checkbox, Input, Textarea } from "./polaris";
import { AdminQueryState } from "./admin-ui";
import { MediaField } from "./admin-media-field";

type Loc = { en?: string; fr?: string; ar?: string };
interface Cta {
  label: Loc;
  href: string;
}
interface Announcement {
  id: string;
  title: Loc;
  body?: Loc;
  active: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}
interface Content {
  hero: {
    image?: string;
    headline?: Loc;
    body?: Loc;
    primaryCta?: Cta | null;
    secondaryCta?: Cta | null;
  };
  announcements: Announcement[];
  sections: { key: string; visible: boolean }[];
  featuredProductSlugs: string[];
  featuredVideoIds: string[];
  commerce: { deliveryInfo?: Loc; orderTerms?: Loc; minimumOrderNote?: Loc };
  contact: { phone?: string; email?: string; supportEmail?: string; hours?: Loc };
  updatedAt: string | null;
}

const SECTION_LABELS: Record<string, string> = {
  orders: "Recent orders",
  featuredProducts: "Featured products",
  training: "Training videos",
  documents: "Documents",
  benefits: "Partner benefits",
  contact: "IOMA contact",
};

function LocInputs({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value?: Loc;
  onChange: (v: Loc) => void;
  multiline?: boolean;
}) {
  const v = value ?? {};
  const Comp = multiline ? Textarea : Input;
  return (
    <fieldset className="grid gap-2 md:grid-cols-3">
      <legend className="pl-help !mt-0 mb-1">{label}</legend>
      {(
        [
          ["en", "English"],
          ["fr", "Français"],
          ["ar", "العربية"],
        ] as const
      ).map(([k, name]) => (
        <label key={k} className="grid gap-1 text-xs">
          <span>{name}</span>
          <Comp
            dir={k === "ar" ? "rtl" : "ltr"}
            value={v[k] ?? ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) =>
              onChange({ ...v, [k]: e.target.value })
            }
            {...(multiline ? { rows: 3 } : {})}
          />
        </label>
      ))}
    </fieldset>
  );
}

function CtaEditor({
  title,
  value,
  onChange,
}: {
  title: string;
  value?: Cta | null;
  onChange: (v: Cta | null) => void;
}) {
  const v = value ?? { label: {}, href: "" };
  return (
    <div className="space-y-2 rounded-lg border p-3">
      <p className="text-[13px] font-semibold">{title}</p>
      <LocInputs
        label="Button label"
        value={v.label}
        onChange={(label) => onChange({ ...v, label })}
      />
      <label className="grid gap-1 text-xs">
        <span>Link (e.g. /portal/shop)</span>
        <Input
          dir="ltr"
          value={v.href}
          onChange={(e) => onChange({ ...v, href: e.target.value })}
        />
      </label>
      {value && (
        <Button small onClick={() => onChange(null)}>
          Remove button
        </Button>
      )}
    </div>
  );
}

/** Admin control of everything shown on the IOMA PRO home: no hardcoded banners or promo text. */
export function AdminPortalContent() {
  const access = useAdminAccess();
  const qc = useQueryClient();
  const q = useAdminQuery<Content>(
    "portal-content",
    !!access.data?.permissions.includes("b2b.view"),
  );
  const products = useAdminQuery<Record<string, any>[]>("references/products");
  const videos = useAdminQuery<Record<string, any>[]>("references/pro-videos");
  const [draft, setDraft] = useState<Content | null>(null);
  const [productFilter, setProductFilter] = useState("");
  const [saved, setSaved] = useState(false);
  const manage = !!access.data?.permissions.includes("b2b.manage");

  useEffect(() => {
    if (q.data) setDraft(structuredClone(q.data));
  }, [q.data]);
  const dirty = useMemo(
    () => !!draft && !!q.data && JSON.stringify(draft) !== JSON.stringify(q.data),
    [draft, q.data],
  );
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = useMutation({
    mutationFn: () => {
      const { updatedAt: _u, ...body } = draft!;
      void _u;
      return apiFetch("/admin/portal-content", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    onSuccess: async () => {
      setSaved(true);
      await qc.invalidateQueries({ queryKey: ["admin", "portal-content"] });
    },
  });

  if (access.data && !access.data.permissions.includes("b2b.view"))
    return <p role="alert">You do not have access to this section.</p>;

  const set = (patch: Partial<Content>) => {
    setSaved(false);
    setDraft((d) => (d ? { ...d, ...patch } : d));
  };

  return (
    <div className="mx-auto max-w-[1000px] space-y-4 pb-24">
      <header>
        <h1 className="pl-page-title">Portal home</h1>
        <p className="pl-help !mt-1">
          Everything partners see on the IOMA PRO home page: banner, announcements, which
          sections appear and in what order, featured products and videos, delivery and
          contact information.
        </p>
      </header>
      <AdminQueryState query={q}>
        {draft && (
          <>
            <Card title="Banner">
              <div className="space-y-4 p-4">
                <MediaField
                  kind="image"
                  title="Banner image"
                  value={draft.hero.image}
                  disabled={!manage}
                  onChange={(image) => set({ hero: { ...draft.hero, image } })}
                />
                <LocInputs
                  label="Headline"
                  value={draft.hero.headline}
                  onChange={(headline) => set({ hero: { ...draft.hero, headline } })}
                />
                <LocInputs
                  label="Description"
                  multiline
                  value={draft.hero.body}
                  onChange={(body) => set({ hero: { ...draft.hero, body } })}
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <CtaEditor
                    title="Primary button"
                    value={draft.hero.primaryCta}
                    onChange={(primaryCta) =>
                      set({ hero: { ...draft.hero, primaryCta } })
                    }
                  />
                  <CtaEditor
                    title="Secondary button"
                    value={draft.hero.secondaryCta}
                    onChange={(secondaryCta) =>
                      set({ hero: { ...draft.hero, secondaryCta } })
                    }
                  />
                </div>
              </div>
            </Card>

            <Card
              title="Announcements"
              action={
                <Button
                  small
                  disabled={!manage}
                  onClick={() =>
                    set({
                      announcements: [
                        ...draft.announcements,
                        { id: crypto.randomUUID().slice(0, 8), title: {}, active: true },
                      ],
                    })
                  }
                >
                  <Plus /> Add
                </Button>
              }
            >
              <div className="space-y-4 p-4">
                {draft.announcements.length === 0 && (
                  <p className="text-[13px]">No announcements. Partners see none.</p>
                )}
                {draft.announcements.map((a, i) => {
                  const upd = (patch: Partial<Announcement>) =>
                    set({
                      announcements: draft.announcements.map((x, j) =>
                        j === i ? { ...x, ...patch } : x,
                      ),
                    });
                  return (
                    <div key={a.id} className="space-y-3 rounded-lg border p-3">
                      <LocInputs
                        label="Title"
                        value={a.title}
                        onChange={(title) => upd({ title })}
                      />
                      <LocInputs
                        label="Message"
                        multiline
                        value={a.body}
                        onChange={(body) => upd({ body })}
                      />
                      <div className="flex flex-wrap items-end gap-4">
                        <Checkbox
                          checked={a.active}
                          onChange={(e) => upd({ active: e.target.checked })}
                          label="Visible"
                        />
                        <label className="grid gap-1 text-xs">
                          <span>Starts</span>
                          <Input
                            type="date"
                            value={a.startsAt?.slice(0, 10) ?? ""}
                            onChange={(e) =>
                              upd({
                                startsAt: e.target.value
                                  ? `${e.target.value}T00:00:00+04:00`
                                  : null,
                              })
                            }
                          />
                        </label>
                        <label className="grid gap-1 text-xs">
                          <span>Ends</span>
                          <Input
                            type="date"
                            value={a.endsAt?.slice(0, 10) ?? ""}
                            onChange={(e) =>
                              upd({
                                endsAt: e.target.value
                                  ? `${e.target.value}T23:59:59+04:00`
                                  : null,
                              })
                            }
                          />
                        </label>
                        <Button
                          small
                          onClick={() =>
                            set({
                              announcements: draft.announcements.filter(
                                (_, j) => j !== i,
                              ),
                            })
                          }
                        >
                          <Trash2 /> Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card title="Sections on the home page">
              <ul className="divide-y">
                {draft.sections.map((s, i) => (
                  <li key={s.key} className="flex items-center justify-between gap-3 p-3">
                    <Checkbox
                      checked={s.visible}
                      disabled={!manage}
                      onChange={(e) =>
                        set({
                          sections: draft.sections.map((x, j) =>
                            j === i ? { ...x, visible: e.target.checked } : x,
                          ),
                        })
                      }
                      label={SECTION_LABELS[s.key] ?? s.key}
                    />
                    <span className="flex gap-1">
                      <Button
                        small
                        disabled={i === 0}
                        aria-label="Move up"
                        onClick={() => {
                          const next = [...draft.sections];
                          [next[i - 1], next[i]] = [next[i]!, next[i - 1]!];
                          set({ sections: next });
                        }}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        small
                        disabled={i === draft.sections.length - 1}
                        aria-label="Move down"
                        onClick={() => {
                          const next = [...draft.sections];
                          [next[i + 1], next[i]] = [next[i]!, next[i + 1]!];
                          set({ sections: next });
                        }}
                      >
                        <ArrowDown />
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Featured products (up to 12)">
              <div className="space-y-3 p-4">
                <Input
                  placeholder="Filter products"
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                />
                <ul className="grid max-h-64 gap-1 overflow-auto sm:grid-cols-2">
                  {(products.data ?? [])
                    .filter((p) =>
                      `${p.name?.en ?? p.name ?? ""} ${p.slug}`
                        .toLowerCase()
                        .includes(productFilter.toLowerCase()),
                    )
                    .slice(0, 80)
                    .map((p) => {
                      const slug = String(p.slug);
                      const on = draft.featuredProductSlugs.includes(slug);
                      return (
                        <li key={slug}>
                          <Checkbox
                            checked={on}
                            disabled={
                              !manage || (!on && draft.featuredProductSlugs.length >= 12)
                            }
                            onChange={(e) =>
                              set({
                                featuredProductSlugs: e.target.checked
                                  ? [...draft.featuredProductSlugs, slug]
                                  : draft.featuredProductSlugs.filter((s) => s !== slug),
                              })
                            }
                            label={
                              <span className="text-[13px]">
                                {p.name?.en ?? p.name ?? slug}
                              </span>
                            }
                          />
                        </li>
                      );
                    })}
                </ul>
                <p className="pl-help !mt-0">
                  Selected: {draft.featuredProductSlugs.length}. Only products visible to
                  professionals appear to partners.
                </p>
              </div>
            </Card>

            <Card title="Featured training videos (up to 6)">
              <ul className="grid gap-1 p-4 sm:grid-cols-2">
                {(videos.data ?? []).map((vid) => {
                  const id = String(vid._id);
                  const on = draft.featuredVideoIds.includes(id);
                  return (
                    <li key={id}>
                      <Checkbox
                        checked={on}
                        disabled={!manage || (!on && draft.featuredVideoIds.length >= 6)}
                        onChange={(e) =>
                          set({
                            featuredVideoIds: e.target.checked
                              ? [...draft.featuredVideoIds, id]
                              : draft.featuredVideoIds.filter((s) => s !== id),
                          })
                        }
                        label={<span className="text-[13px]">{vid.title?.en ?? id}</span>}
                      />
                    </li>
                  );
                })}
                {(videos.data ?? []).length === 0 && (
                  <li className="text-[13px]">No training videos yet.</li>
                )}
              </ul>
            </Card>

            <Card title="Delivery, terms and contact">
              <div className="space-y-4 p-4">
                <LocInputs
                  label="Delivery information"
                  multiline
                  value={draft.commerce.deliveryInfo}
                  onChange={(deliveryInfo) =>
                    set({ commerce: { ...draft.commerce, deliveryInfo } })
                  }
                />
                <LocInputs
                  label="Minimum order note"
                  multiline
                  value={draft.commerce.minimumOrderNote}
                  onChange={(minimumOrderNote) =>
                    set({ commerce: { ...draft.commerce, minimumOrderNote } })
                  }
                />
                <LocInputs
                  label="Order terms"
                  multiline
                  value={draft.commerce.orderTerms}
                  onChange={(orderTerms) =>
                    set({ commerce: { ...draft.commerce, orderTerms } })
                  }
                />
                <div className="grid gap-3 md:grid-cols-3">
                  {(
                    [
                      ["phone", "Phone"],
                      ["email", "Contact email"],
                      ["supportEmail", "Support email"],
                    ] as const
                  ).map(([k, name]) => (
                    <label key={k} className="grid gap-1 text-xs">
                      <span>{name}</span>
                      <Input
                        dir="ltr"
                        value={draft.contact[k] ?? ""}
                        onChange={(e) =>
                          set({ contact: { ...draft.contact, [k]: e.target.value } })
                        }
                      />
                    </label>
                  ))}
                </div>
                <LocInputs
                  label="Opening hours"
                  value={draft.contact.hours}
                  onChange={(hours) => set({ contact: { ...draft.contact, hours } })}
                />
              </div>
            </Card>

            <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-white/95 p-3 backdrop-blur">
              <div className="mx-auto flex max-w-[1000px] items-center justify-between gap-3">
                <span className="text-[13px]" aria-live="polite">
                  {save.isError
                    ? "Could not save. Check the fields and try again."
                    : saved
                      ? "Saved. Partners see the changes now."
                      : dirty
                        ? "You have unsaved changes."
                        : "No changes."}
                </span>
                <span className="flex gap-2">
                  <Button
                    disabled={!dirty}
                    onClick={() => q.data && setDraft(structuredClone(q.data))}
                  >
                    Discard
                  </Button>
                  <Button
                    variant="primary"
                    disabled={!manage || !dirty || save.isPending}
                    onClick={() => save.mutate()}
                  >
                    Save changes
                  </Button>
                </span>
              </div>
            </div>
          </>
        )}
      </AdminQueryState>
    </div>
  );
}
