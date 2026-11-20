"use client";

import { useState } from "react";
import { ArrowLeft, ExternalLink, Pencil, Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api";
import { useAdminAccess, useAdminQuery } from "@/hooks/use-admin";
import { ProductImage } from "@/components/shop/product-image";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  Checkbox,
  SegmentedControl,
  Select,
} from "./polaris";
import { AdminQueryState, AdminEmpty, useAdminFormat } from "./admin-ui";
import { PartnerDrawer } from "./admin-partner";
import { B2bBadge, VisibilityBadge, label, type HubRow } from "./admin-professionals";

type Row = Record<string, any>;
interface Detail {
  key: string;
  kind: "professional" | "partner";
  profile: Row | null;
  partner: Row | null;
  user: Row | null;
  application: Row | null;
  services: Row[];
  orders: { count: number; totalMinor: number; recent: Row[] };
  bookings: { total: number; byStatus: Record<string, number>; recent: Row[] };
  pricing: { priceListId: string | null; priceList: Row | null };
  trainingAndDocuments: {
    access: Row | null;
    published: { videos: number; documents: number; benefits: number };
  };
  history: Row[];
}

const TABS = [
  ["overview", "Overview"],
  ["business", "Business information"],
  ["location", "Location & gallery"],
  ["services", "Services & treatments"],
  ["bookings", "Bookings"],
  ["orders", "B2B orders"],
  ["pricing", "Professional pricing"],
  ["training", "Training & documents"],
  ["account", "Account & permissions"],
] as const;
type Tab = (typeof TABS)[number][0];

function Facts({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="pl-help !mt-0">{k}</dt>
          <dd className="break-words text-[14px]">{v || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AdminProfessionalDetail({ keyParam }: { keyParam: string }) {
  const key = decodeURIComponent(keyParam);
  const access = useAdminAccess();
  const fmt = useAdminFormat();
  const qc = useQueryClient();
  const q = useAdminQuery<Detail>(
    `hub/${encodeURIComponent(key)}`,
    !!access.data?.permissions.includes("b2b.view"),
  );
  const [tab, setTab] = useState<Tab>("overview");
  const [drawer, setDrawer] = useState(false);
  const manage = !!access.data?.permissions.includes("b2b.manage");

  const refresh = () => qc.invalidateQueries();
  const post = useMutation({
    mutationFn: (v: { path: string; body: Record<string, unknown>; method?: string }) =>
      apiFetch(v.path, { method: v.method ?? "POST", body: JSON.stringify(v.body) }),
    onSuccess: refresh,
  });

  if (access.data && !access.data.permissions.includes("b2b.view"))
    return <p role="alert">You do not have access to this section.</p>;

  return (
    <div className="mx-auto max-w-[1200px] space-y-4">
      <Link
        href="/admin/professional-accounts"
        className="pl-link inline-flex items-center gap-1 text-[13px]"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden /> Professionals
      </Link>
      <AdminQueryState query={q}>
        {q.data &&
          (() => {
            const d = q.data;
            const p = d.profile;
            const partner = d.partner;
            const name = p?.companyName ?? partner?.name ?? "Business";
            const b2b = (p?.status ?? "none") as HubRow["b2bStatus"];
            const vis = (partner?.status ?? "none") as HubRow["visibility"];
            const editPartner = () => setDrawer(true);
            const onSaved = async (partnerId: string) => {
              // A public profile created from a professional is linked straight away.
              if (p && !partner) {
                await apiFetch("/admin/hub/link", {
                  method: "POST",
                  body: JSON.stringify({ profileId: String(p._id), partnerId }),
                });
              }
              setDrawer(false);
              await refresh();
            };
            return (
              <>
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="pl-page-title">{name}</h1>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <B2bBadge status={b2b} />
                      <VisibilityBadge status={vis} />
                      {(p?.businessType || partner?.type) && (
                        <Badge>{label(p?.businessType || partner?.type)}</Badge>
                      )}
                    </div>
                  </div>
                  {manage && (
                    <div className="flex flex-wrap gap-2">
                      {partner ? (
                        <Button variant="primary" onClick={editPartner}>
                          <Pencil /> Edit public profile
                        </Button>
                      ) : (
                        p && (
                          <Button variant="primary" onClick={editPartner}>
                            <Plus /> Create public profile
                          </Button>
                        )
                      )}
                    </div>
                  )}
                </header>

                <div className="overflow-x-auto">
                  <SegmentedControl
                    ariaLabel="Sections"
                    value={tab}
                    onChange={(v) => setTab(v)}
                    options={TABS.map(([value, text]) => ({ value, label: text }))}
                  />
                </div>

                {post.isError && (
                  <p
                    role="alert"
                    className="text-[13px]"
                    style={{ color: "var(--pl-critical)" }}
                  >
                    The action could not be completed. Please try again.
                  </p>
                )}

                {tab === "overview" && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card title="At a glance">
                      <Facts
                        rows={[
                          ["B2B account", <B2bBadge key="b" status={b2b} />],
                          ["Public listing", <VisibilityBadge key="v" status={vis} />],
                          [
                            "B2B orders",
                            `${d.orders.count} · ${fmt.money(d.orders.totalMinor)}`,
                          ],
                          ["Bookings", String(d.bookings.total)],
                          ["Services offered", String(d.services.length)],
                          ["Contact", d.user?.email ?? partner?.email],
                        ]}
                      />
                    </Card>
                    <Card title="Public visibility">
                      <div className="space-y-3 p-4 text-[13px]">
                        <p>
                          Public visibility is controlled here, independently of the B2B
                          approval. A hidden profile is not shown on the website or the
                          map, and cannot be booked.
                        </p>
                        {partner ? (
                          manage && (
                            <Button
                              disabled={post.isPending}
                              onClick={() =>
                                post.mutate({
                                  path: "/admin/hub/visibility",
                                  body: {
                                    partnerId: String(partner._id),
                                    status: vis === "active" ? "inactive" : "active",
                                  },
                                })
                              }
                            >
                              {vis === "active"
                                ? "Hide from the website"
                                : "Show on the website"}
                            </Button>
                          )
                        ) : (
                          <p>This business has no public profile yet.</p>
                        )}
                        {partner && (
                          <ExternalLinkLine href={`/en/partners/${partner.slug}`} />
                        )}
                      </div>
                    </Card>
                    {p && (
                      <PublicProfileLink
                        profileId={String(p._id)}
                        hasPartner={!!partner}
                        manage={manage}
                        onDone={refresh}
                      />
                    )}
                  </div>
                )}

                {tab === "business" && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card title="Company">
                      <Facts
                        rows={[
                          ["Company / institute", name],
                          [
                            "Business type",
                            label(p?.businessType || partner?.type || ""),
                          ],
                          ["Trade licence", d.application?.tradeLicenceNumber],
                          ["VAT / TRN", d.application?.vatNumber],
                          ["Locations", d.application?.locationsCount],
                          ["Expected volume", d.application?.expectedOrderVolume],
                          ["Website", partner?.website ?? d.application?.website],
                          ["Social media", d.application?.socialMedia],
                        ]}
                      />
                    </Card>
                    <Card title="Contact">
                      <Facts
                        rows={[
                          ["Contact person", d.application?.contactPerson],
                          ["Account email", d.user?.email],
                          ["Business email", partner?.email ?? d.application?.email],
                          ["Phone", partner?.phone ?? d.application?.phone],
                          ["WhatsApp", partner?.whatsapp],
                          ["Opening hours", hoursText(partner?.openingHours)],
                        ]}
                      />
                    </Card>
                    {partner && (
                      <Card title="Description (public)" className="lg:col-span-2">
                        <Facts
                          rows={[
                            ["English", partner.description?.en],
                            ["French", partner.description?.fr],
                            [
                              "Arabic",
                              <span key="ar" dir="rtl">
                                {partner.description?.ar}
                              </span>,
                            ],
                          ]}
                        />
                      </Card>
                    )}
                  </div>
                )}

                {tab === "location" && (
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <Card
                      title="Photos"
                      action={
                        manage && partner ? (
                          <Button small onClick={editPartner}>
                            Manage photos
                          </Button>
                        ) : undefined
                      }
                    >
                      <div className="p-4">
                        {(partner?.mediaIds ?? []).length ? (
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {(partner!.mediaIds as string[]).map((src, i) => (
                              <div
                                key={src + i}
                                className="relative aspect-[4/3] overflow-hidden rounded-lg bg-neutral-100"
                              >
                                <ProductImage
                                  src={src}
                                  alt=""
                                  fill
                                  sizes="240px"
                                  className="object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <AdminEmpty />
                        )}
                      </div>
                    </Card>
                    <Card title="Location">
                      <Facts
                        rows={[
                          ["Address", partner?.address ?? d.application?.address],
                          ["City", partner?.city ?? d.application?.city],
                          ["Emirate", partner?.emirate ?? d.application?.emirate],
                          [
                            "Map pin",
                            partner?.coordinates ? (
                              <a
                                key="m"
                                className="pl-link inline-flex items-center gap-1"
                                target="_blank"
                                rel="noreferrer"
                                href={`https://www.google.com/maps?q=${partner.coordinates.lat},${partner.coordinates.lng}`}
                              >
                                {partner.coordinates.lat}, {partner.coordinates.lng}{" "}
                                <ExternalLink className="size-3" />
                              </a>
                            ) : null,
                          ],
                        ]}
                      />
                    </Card>
                  </div>
                )}

                {tab === "services" && (
                  <ServicesTab
                    partner={partner}
                    services={d.services}
                    manage={manage}
                    onSaved={refresh}
                  />
                )}

                {tab === "bookings" && (
                  <Card title="Bookings">
                    {!partner ? (
                      <p className="p-4 text-[13px]">
                        Bookings appear once this business has a public profile.
                      </p>
                    ) : (
                      <div className="space-y-4 p-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge>{d.bookings.total} total</Badge>
                          {Object.entries(d.bookings.byStatus).map(([s, n]) => (
                            <Badge key={s}>
                              {label(s)}: {n}
                            </Badge>
                          ))}
                        </div>
                        {d.bookings.recent.length ? (
                          <table className="pl-table">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {d.bookings.recent.map((b) => (
                                <tr key={String(b._id)}>
                                  <td>{fmt.date(b.startsAt, true)}</td>
                                  <td>{label(b.status)}</td>
                                  <td>{b.notes || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <AdminEmpty />
                        )}
                      </div>
                    )}
                  </Card>
                )}

                {tab === "orders" && (
                  <Card
                    title="B2B orders"
                    action={
                      <ButtonLink small href="/admin/orders?type=b2b">
                        All B2B orders
                      </ButtonLink>
                    }
                  >
                    <div className="space-y-4 p-4">
                      <p className="text-[13px]">
                        {d.orders.count} order{d.orders.count === 1 ? "" : "s"} · total{" "}
                        {fmt.money(d.orders.totalMinor)}
                      </p>
                      {d.orders.recent.length ? (
                        <table className="pl-table">
                          <thead>
                            <tr>
                              <th>Order</th>
                              <th>Date</th>
                              <th>Status</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {d.orders.recent.map((o) => (
                              <tr key={String(o._id)}>
                                <td>
                                  <Link
                                    className="pl-link"
                                    href={`/admin/orders/${o._id}`}
                                  >
                                    {o.orderNumber}
                                  </Link>
                                </td>
                                <td>{fmt.date(o.createdAt)}</td>
                                <td>{label(o.fulfillmentStatus)}</td>
                                <td>{fmt.money(o.totalMinor)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <AdminEmpty />
                      )}
                    </div>
                  </Card>
                )}

                {tab === "pricing" && (
                  <Card title="Professional pricing">
                    <div className="space-y-3 p-4 text-[13px]">
                      {!p ? (
                        <p>
                          Professional pricing applies once this business has a B2B
                          account.
                        </p>
                      ) : d.pricing.priceList ? (
                        <p>
                          Price list: <strong>{d.pricing.priceList.name}</strong> (
                          {d.pricing.priceList.items} products). Its prices replace the
                          default professional prices for this account.
                        </p>
                      ) : (
                        <p>
                          This account uses the{" "}
                          <strong>default professional prices</strong> set on each
                          product.
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <ButtonLink small href="/admin/products?visibility=both">
                          Professional pricing
                        </ButtonLink>
                        <ButtonLink small href="/admin/products?visibility=b2b_cabin">
                          Cabin products
                        </ButtonLink>
                      </div>
                    </div>
                  </Card>
                )}

                {tab === "training" && (
                  <Card title="Training, documents & benefits">
                    <Facts
                      rows={[
                        [
                          "Access level",
                          d.trainingAndDocuments.access
                            ? label(String(d.trainingAndDocuments.access.level))
                            : null,
                        ],
                        [
                          "Published training videos",
                          String(d.trainingAndDocuments.published.videos),
                        ],
                        [
                          "Published documents",
                          String(d.trainingAndDocuments.published.documents),
                        ],
                        [
                          "Published benefits",
                          String(d.trainingAndDocuments.published.benefits),
                        ],
                        [
                          "First order",
                          fmt.date(d.trainingAndDocuments.access?.firstOrderAt),
                        ],
                      ]}
                    />
                    <div className="flex flex-wrap gap-2 p-4 pt-0">
                      <ButtonLink small href="/admin/pro-videos">
                        Training videos
                      </ButtonLink>
                      <ButtonLink small href="/admin/pro-documents">
                        Documents
                      </ButtonLink>
                      <ButtonLink small href="/admin/pro-benefits">
                        Benefits
                      </ButtonLink>
                    </div>
                  </Card>
                )}

                {tab === "account" && (
                  <AccountTab
                    detail={d}
                    manage={manage}
                    post={post}
                    onChanged={refresh}
                  />
                )}

                <PartnerDrawer
                  open={drawer}
                  onOpenChange={setDrawer}
                  record={partner ?? undefined}
                  onSaved={onSaved}
                />
              </>
            );
          })()}
      </AdminQueryState>
    </div>
  );
}

const hoursText = (h: unknown) =>
  typeof h === "string" ? h : ((h as Row | null)?.en as string | undefined);

function ExternalLinkLine({ href }: { href: string }) {
  return (
    <a
      className="pl-link inline-flex items-center gap-1"
      href={`${process.env.NEXT_PUBLIC_WEB_URL ?? ""}${href}`}
      target="_blank"
      rel="noreferrer"
    >
      View on the website <ExternalLink className="size-3" />
    </a>
  );
}

/** Link an existing public partner profile to a professional that has none. */
function PublicProfileLink({
  profileId,
  hasPartner,
  manage,
  onDone,
}: {
  profileId: string;
  hasPartner: boolean;
  manage: boolean;
  onDone: () => void;
}) {
  const unlinked = useAdminQuery<Row[]>("hub/unlinked-partners", manage);
  const [pick, setPick] = useState("");
  const link = useMutation({
    mutationFn: () =>
      apiFetch("/admin/hub/link", {
        method: "POST",
        body: JSON.stringify({ profileId, partnerId: pick }),
      }),
    onSuccess: onDone,
  });
  const unlink = useMutation({
    mutationFn: () =>
      apiFetch("/admin/hub/unlink", {
        method: "POST",
        body: JSON.stringify({ profileId }),
      }),
    onSuccess: onDone,
  });
  if (!manage) return null;
  return (
    <Card title="Public profile link">
      <div className="space-y-3 p-4 text-[13px]">
        {hasPartner ? (
          <>
            <p>
              The public profile is linked to this professional. Unlinking keeps the
              public profile and its bookings; it just becomes a standalone listing.
            </p>
            <Button disabled={unlink.isPending} onClick={() => unlink.mutate()}>
              Unlink public profile
            </Button>
          </>
        ) : (
          <>
            <p>
              Already have a public profile for this business? Link it instead of creating
              a duplicate.
            </p>
            <Select
              value={pick}
              onChange={(e) => setPick(e.target.value)}
              aria-label="Public profile"
            >
              <option value="">Choose an existing public profile…</option>
              {(unlinked.data ?? []).map((u) => (
                <option key={String(u._id)} value={String(u._id)}>
                  {u.name} — {u.city}
                </option>
              ))}
            </Select>
            <Button disabled={!pick || link.isPending} onClick={() => link.mutate()}>
              Link this public profile
            </Button>
            {(link.isError || unlink.isError) && (
              <p role="alert" style={{ color: "var(--pl-critical)" }}>
                Could not link. It may already belong to another professional.
              </p>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

function ServicesTab({
  partner,
  services,
  manage,
  onSaved,
}: {
  partner: Row | null;
  services: Row[];
  manage: boolean;
  onSaved: () => void;
}) {
  const all = useAdminQuery<Row[]>("references/services");
  const [selected, setSelected] = useState<string[] | null>(null);
  const current = selected ?? services.map((s) => String(s._id));
  const save = useMutation({
    mutationFn: () =>
      apiFetch(`/admin/resources/partners/${partner!._id}`, {
        method: "PATCH",
        body: JSON.stringify({ serviceIds: current }),
      }),
    onSuccess: () => {
      setSelected(null);
      onSaved();
    },
  });
  const name = (s: Row) => s.name?.en || s.slug || String(s._id);
  return (
    <Card
      title="Services & treatments"
      action={
        <span className="flex gap-2">
          <ButtonLink small href="/admin/services">
            Manage services
          </ButtonLink>
          <ButtonLink small href="/admin/treatments">
            Manage treatments
          </ButtonLink>
        </span>
      }
    >
      {!partner ? (
        <p className="p-4 text-[13px]">
          Create the public profile first to assign services.
        </p>
      ) : (
        <div className="space-y-3 p-4">
          <p className="pl-help !mt-0">
            Customers can book the services ticked below on this business&apos;s public
            page.
          </p>
          <AdminQueryState query={all}>
            <ul className="grid gap-2 sm:grid-cols-2">
              {(all.data ?? []).map((s) => {
                const id = String(s._id);
                return (
                  <li key={id}>
                    <Checkbox
                      checked={current.includes(id)}
                      disabled={!manage}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...current, id]
                            : current.filter((x) => x !== id),
                        )
                      }
                      label={
                        <span className="text-[14px]">
                          {name(s)}
                          {s.durationMinutes ? (
                            <span className="pl-help !mt-0">
                              {" "}
                              · {s.durationMinutes} min
                            </span>
                          ) : null}
                        </span>
                      }
                    />
                  </li>
                );
              })}
            </ul>
          </AdminQueryState>
          {manage && selected && (
            <div className="flex gap-2">
              <Button
                variant="primary"
                disabled={save.isPending}
                onClick={() => save.mutate()}
              >
                Save services
              </Button>
              <Button onClick={() => setSelected(null)}>Cancel</Button>
            </div>
          )}
          {save.isError && (
            <p role="alert" style={{ color: "var(--pl-critical)" }}>
              Could not save the services.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function AccountTab({
  detail,
  manage,
  post,
  onChanged,
}: {
  detail: Detail;
  manage: boolean;
  post: { mutate: (v: any) => void; isPending: boolean };
  onChanged: () => void;
}) {
  const fmt = useAdminFormat();
  const p = detail.profile;
  const u = detail.user;
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState(false);
  void onChanged;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Account">
        {!p || !u ? (
          <p className="p-4 text-[13px]">
            This public profile has no professional account yet. The business owner can
            apply for B2B access from the website; applications are reviewed under Partner
            Applications.
          </p>
        ) : (
          <Facts
            rows={[
              ["Name", `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()],
              ["Email", u.email],
              ["Email verified", u.emailVerifiedAt ? fmt.date(u.emailVerifiedAt) : "No"],
              ["Roles", (u.roles ?? []).map(label).join(", ")],
              ["Account status", label(u.status)],
              ["Last sign-in", fmt.date(u.lastLoginAt, true)],
              ["Approved on", fmt.date(p.createdAt)],
            ]}
          />
        )}
      </Card>
      <Card title="Permissions">
        <div className="space-y-3 p-4 text-[13px]">
          {!p ? (
            <p>No B2B account.</p>
          ) : p.status === "approved" ? (
            <>
              <p>
                This professional can see professional prices, order, and open the IOMA
                PRO portal. Suspending removes that access immediately.
              </p>
              {manage &&
                (confirm ? (
                  <div className="space-y-2">
                    <textarea
                      className="pl-input w-full"
                      rows={3}
                      placeholder="Reason for the suspension (required)"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        disabled={!reason.trim() || post.isPending}
                        onClick={() =>
                          post.mutate({
                            path: `/professional/admin/profiles/${p._id}/suspend`,
                            method: "PATCH",
                            body: { reason: reason.trim() },
                          })
                        }
                      >
                        Confirm suspension
                      </Button>
                      <Button onClick={() => setConfirm(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button onClick={() => setConfirm(true)}>Suspend B2B access</Button>
                ))}
            </>
          ) : (
            <>
              <p>This professional is suspended and has no B2B access.</p>
              {manage && (
                <Button
                  variant="primary"
                  disabled={post.isPending}
                  onClick={() =>
                    post.mutate({
                      path: "/admin/hub/reactivate",
                      body: { profileId: String(p._id) },
                    })
                  }
                >
                  Reactivate B2B access
                </Button>
              )}
            </>
          )}
        </div>
      </Card>
      <Card title="History" className="lg:col-span-2">
        {detail.history.length ? (
          <ul className="divide-y">
            {detail.history.map((h) => (
              <li
                key={String(h._id)}
                className="flex justify-between gap-3 p-3 text-[13px]"
              >
                <span>
                  {label(String(h.action).replace(/\./g, " "))}
                  <span className="pl-help !mt-0"> · {h.actorEmail}</span>
                </span>
                <span>{fmt.date(h.createdAt, true)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-4 text-[13px]">No recorded changes yet.</p>
        )}
      </Card>
    </div>
  );
}
