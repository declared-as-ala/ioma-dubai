"use client";
import { useState } from "react";
import { ProductImage } from "@/components/shop/product-image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAdminQuery } from "@/hooks/use-admin";
import { AdminPanel, AdminEmpty, AdminQueryState, useAdminFormat } from "./admin-ui";
import { BarChart, RevenueChart } from "./admin-charts";

type Dashboard = Record<string, any>;
const count = (rows: any[] | undefined, status?: string) =>
  (status ? rows?.find((r) => r._id === status)?.count : rows?.[0]?.count) ?? 0;
function datePreset(preset: string) {
  const now = new Date(Date.now() + 14400000);
  const to = now.toISOString().slice(0, 10);
  const from =
    preset === "today"
      ? to
      : preset === "thisMonth"
        ? `${to.slice(0, 7)}-01`
        : new Date(now.getTime() - (preset === "sevenDays" ? 6 : 29) * 86400000)
            .toISOString()
            .slice(0, 10);
  return { from, to };
}
function Kpi({
  title,
  value,
  href,
  context,
  comparison,
}: {
  title: string;
  value: string;
  href: string;
  context: string;
  comparison?: { change: number; percent: number | null };
}) {
  const t = useTranslations("AdminExperience");
  const { number } = useAdminFormat();
  const up = comparison ? comparison.change >= 0 : true;
  return (
    <Link href={href} className="pl-kpi">
      <span className="pl-stat-label">{title}</span>
      <span className="pl-kpi-value">{value}</span>
      <span className="pl-kpi-foot">
        {comparison &&
          (comparison.percent == null ? (
            <span className="pl-badge">{t("newBaseline")}</span>
          ) : (
            <span
              className={`pl-badge ${up ? "pl-badge--success" : "pl-badge--critical"}`}
            >
              {up ? "↑" : "↓"} {number(Math.abs(comparison.percent))}%
            </span>
          ))}
        <span className="pl-help !mt-0">
          {comparison?.percent != null ? `${t("comparison")}` : context}
        </span>
      </span>
    </Link>
  );
}
export function ActionCenter({ data }: { data: Dashboard }) {
  const t = useTranslations("AdminExperience");
  const { number } = useAdminFormat();
  const period = data.period ? `from=${data.period.from}&to=${data.period.to}` : "";
  const inventory = data.inventory?.health?.[0];
  const entries = [
    {
      label: t("pendingApplications"),
      value: count(data.b2b?.pending),
      href: "/admin/b2b-leads",
    },
    {
      label: t("lowStock"),
      value: (inventory?.lowStock ?? 0) + (inventory?.outOfStock ?? 0),
      href: "/admin/products?status=low_stock",
    },
    {
      label: t("values.failed") + " · " + t("fields.paymentStatus"),
      value: count(data.commerce?.payments, "failed"),
      href: `/admin/orders?paymentStatus=failed&${period}`,
    },
  ].filter((e) => e.value > 0);
  return (
    <AdminPanel title={t("attention")}>
      {entries.length ? (
        <ul className="pl-list">
          {entries.map((e) => (
            <li key={e.href}>
              <Link href={e.href} className="pl-list-row">
                <span>{e.label}</span>
                <span className="flex items-center gap-2">
                  <span className="pl-badge pl-badge--warning">{number(e.value)}</span>
                  <span className="inline-block rtl:rotate-180" aria-hidden>
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <AdminEmpty text={t("noAttention")} />
      )}
    </AdminPanel>
  );
}
function SimpleTable({
  headings,
  rows,
}: {
  headings: string[];
  rows: React.ReactNode[][];
}) {
  if (!rows.length) return <AdminEmpty />;
  return (
    <div className="pl-table-wrap">
      <table className="pl-table" style={{ minWidth: 480 }}>
        <thead>
          <tr>
            {headings.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Metrics({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-2 gap-4">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="pl-stat-label">{label}</dt>
          <dd className="pl-kpi-value">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
export default function AdminDashboard() {
  const t = useTranslations("AdminExperience");
  const f = useAdminFormat();
  const [period, setPeriod] = useState(() => datePreset("thirtyDays"));
  const [draft, setDraft] = useState(period);
  const [preset, setPreset] = useState("thirtyDays");
  const [compare, setCompare] = useState(true);
  const [channel, setChannel] = useState<"total" | "b2c" | "b2b">("total");
  const query = useAdminQuery<Dashboard>(
    `dashboard/overview?from=${period.from}&to=${period.to}`,
  );
  const data = query.data;
  const statusData = (rows: any[] | undefined, href?: string) =>
    (rows ?? []).map((row) => ({
      label: f.label(row._id),
      value: row.count,
      ...(href ? { href: `${href}${encodeURIComponent(row._id)}` } : {}),
    }));
  return (
    <div className="mx-auto max-w-[1280px] space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="pl-page-title">{t("dashboard")}</h1>
          <p className="pl-help !mt-0">
            IOMA Paris Dubai · {period.from} — {period.to} · Asia/Dubai
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPeriod(draft);
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <select
            aria-label={t("selectedPeriod")}
            value={preset}
            onChange={(e) => {
              setPreset(e.target.value);
              if (e.target.value !== "custom") {
                const value = datePreset(e.target.value);
                setDraft(value);
                setPeriod(value);
              }
            }}
            className="pl-input !w-auto"
          >
            {["today", "sevenDays", "thirtyDays", "thisMonth", "custom"].map((value) => (
              <option key={value} value={value}>
                {t(value)}
              </option>
            ))}
          </select>
          {preset === "custom" && (
            <>
              <input
                type="date"
                aria-label={t("from")}
                required
                value={draft.from}
                max={draft.to}
                onChange={(e) => {
                  setPreset("custom");
                  setDraft({ ...draft, from: e.target.value });
                }}
                className="pl-input !w-auto"
              />
              <input
                type="date"
                aria-label={t("to")}
                required
                value={draft.to}
                min={draft.from}
                onChange={(e) => {
                  setPreset("custom");
                  setDraft({ ...draft, to: e.target.value });
                }}
                className="pl-input !w-auto"
              />
              <button className="pl-btn pl-btn--primary" type="submit">
                {t("apply")}
              </button>
            </>
          )}
          <label className="pl-choice">
            <input
              type="checkbox"
              className="pl-check"
              checked={compare}
              onChange={(e) => setCompare(e.target.checked)}
            />
            {t("compare")}
          </label>
        </form>
      </div>
      <AdminQueryState query={query}>
        {data && (
          <>
            <div className="xl:hidden">
              <ActionCenter data={data} />
            </div>
            <div className="pl-card pl-card--flush pl-kpis">
              {data.commerce &&
                ["revenue", "orders", "aov"].map((key) => (
                  <Kpi
                    key={key}
                    title={t(key)}
                    value={
                      key === "orders"
                        ? f.number(data.commerce.metrics[key].value)
                        : f.money(data.commerce.metrics[key].value)
                    }
                    href={`/admin/orders?from=${period.from}&to=${period.to}${key === "orders" ? "" : "&paymentStatus=paid"}`}
                    context={t("selectedPeriod")}
                    comparison={compare ? data.commerce.metrics[key] : undefined}
                  />
                ))}
              {data.customers && (
                <Kpi
                  title={t("customers")}
                  value={f.number(data.customers.newCustomers.value)}
                  comparison={compare ? data.customers.newCustomers : undefined}
                  href={`/admin/customers?from=${period.from}&to=${period.to}`}
                  context={t("selectedPeriod")}
                />
              )}
              {data.b2b && (
                <>
                  <Kpi
                    title={t("pendingApplications")}
                    value={f.number(count(data.b2b.pending))}
                    href="/admin/b2b-leads"
                    context={t("currentSnapshot")}
                  />
                  <Kpi
                    title={t("approvedPartners")}
                    value={f.number(count(data.b2b.approved))}
                    href="/admin/professional-accounts?status=approved"
                    context={t("currentSnapshot")}
                  />
                </>
              )}
              {data.appointments && (
                <Kpi
                  title={t("appointments")}
                  value={f.number(count(data.appointments.today))}
                  href={`/admin/appointments?from=${new Date(Date.now() + 14400000).toISOString().slice(0, 10)}&to=${new Date(Date.now() + 14400000).toISOString().slice(0, 10)}`}
                  context={t("today")}
                />
              )}
              {data.inventory && (
                <Kpi
                  title={t("lowStock")}
                  value={f.number(
                    (data.inventory.health[0]?.lowStock ?? 0) +
                      (data.inventory.health[0]?.outOfStock ?? 0),
                  )}
                  href="/admin/products?status=low_stock"
                  context={t("currentSnapshot")}
                />
              )}
            </div>
            {data.commerce && (
              <>
                <div className="grid gap-4 xl:grid-cols-3">
                  <AdminPanel title={t("revenueChart")} className="xl:col-span-2">
                    <div className="mb-4 flex flex-wrap gap-2">
                      {["total", "b2c", "b2b"].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setChannel(value as typeof channel)}
                          aria-pressed={channel === value}
                          className={`min-h-11 border px-4 text-xs ${channel === value ? "border-blue-600 bg-blue-50 pl-link" : "border-neutral-200"}`}
                        >
                          {value === "total" ? t("total") : value.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <RevenueChart
                      data={data.commerce.series.map((row: any) => ({
                        label: row.date,
                        value: row[channel],
                      }))}
                      previous={
                        compare
                          ? data.commerce.previousSeries.map((row: any) => ({
                              label: row.date,
                              value: row[channel],
                            }))
                          : undefined
                      }
                      format={f.money}
                    />
                    <p className="mt-3 text-xs leading-5 text-neutral-500">
                      {t("revenueNote")}
                    </p>
                  </AdminPanel>
                  <AdminPanel title={t("ordersByStatus")}>
                    <BarChart
                      data={statusData(
                        data.commerce.statuses,
                        `/admin/orders?from=${period.from}&to=${period.to}&fulfillmentStatus=`,
                      )}
                      format={f.number}
                    />
                  </AdminPanel>
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                  <AdminPanel title={t("salesByChannel")}>
                    <BarChart
                      data={data.commerce.channels.map((row: any) => ({
                        label: `${row._id.toUpperCase()} · ${f.number(row.orders)} ${t("orders")}`,
                        value: row.revenue,
                        href: `/admin/orders?type=${row._id}&from=${period.from}&to=${period.to}&paymentStatus=paid`,
                      }))}
                      format={f.money}
                    />
                  </AdminPanel>
                  <AdminPanel title={t("salesByRange")}>
                    <BarChart
                      data={data.commerce.ranges.map((row: any) => ({
                        label: row.name ? f.label(row.name) : t("unassigned"),
                        value: row.revenue,
                        href: row._id ? `/admin/products?rangeId=${row._id}` : undefined,
                      }))}
                      format={f.money}
                    />
                    <p className="mt-4 text-xs text-neutral-500">
                      {t("lineRevenueNote")}
                    </p>
                  </AdminPanel>
                </div>
              </>
            )}
            <div className="hidden xl:block">
              <ActionCenter data={data} />
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {data.commerce && (
                <AdminPanel title={t("topProducts")} href="/admin/products">
                  <SimpleTable
                    headings={[
                      t("fields.productName"),
                      t("units"),
                      t("revenue"),
                      t("fields.available"),
                    ]}
                    rows={data.commerce.products.map((p: any) => [
                      <Link
                        href={
                          p.productId
                            ? `/admin/products/${p.productId}`
                            : "/admin/products"
                        }
                        className="flex min-h-11 items-center gap-2 pl-link"
                      >
                        {p.image && (
                          <ProductImage
                            width={40}
                            height={40}
                            variant="thumbnail"
                            src={p.image}
                            alt=""
                            className="size-10 shrink-0 object-contain"
                          />
                        )}
                        {f.label(p.name)}
                      </Link>,
                      f.number(p.units),
                      f.money(p.revenue),
                      f.number(p.stock),
                    ])}
                  />
                </AdminPanel>
              )}
              {data.inventory && (
                <AdminPanel
                  title={t("inventoryHealth")}
                  href="/admin/products?status=low_stock"
                >
                  <Metrics
                    rows={[
                      [t("inStock"), f.number(data.inventory.health[0]?.inStock ?? 0)],
                      [t("lowStock"), f.number(data.inventory.health[0]?.lowStock ?? 0)],
                      [
                        t("outOfStock"),
                        f.number(data.inventory.health[0]?.outOfStock ?? 0),
                      ],
                      [t("reserved"), f.number(data.inventory.health[0]?.reserved ?? 0)],
                    ]}
                  />
                  <div className="mt-5">
                    <SimpleTable
                      headings={[
                        t("fields.sku"),
                        t("fields.available"),
                        t("reserved"),
                        t("fields.lowStockThreshold"),
                      ]}
                      rows={data.inventory.low.map((v: any) => [
                        <Link
                          href={
                            v.productId
                              ? `/admin/products/${v.productId}`
                              : "/admin/products?status=low_stock"
                          }
                          className="pl-link inline-flex items-center"
                        >
                          {v.sku}
                        </Link>,
                        v.available,
                        v.quantityReserved,
                        v.lowStockThreshold,
                      ])}
                    />
                  </div>
                </AdminPanel>
              )}
              {data.b2b && (
                <AdminPanel title={t("pipeline")} href="/admin/b2b-leads">
                  <BarChart data={statusData(data.b2b.pipeline)} format={f.number} />
                  <div className="mt-5">
                    <SimpleTable
                      headings={[
                        t("fields.companyName"),
                        t("fields.businessType"),
                        t("fields.emirate"),
                        t("fields.status"),
                      ]}
                      rows={data.b2b.attention.map((a: any) => [
                        <Link
                          href={`/admin/professionals?application=${a._id}`}
                          className="pl-link inline-flex items-center"
                        >
                          {a.companyName}
                        </Link>,
                        f.label(a.businessType),
                        a.emirate,
                        f.label(a.status),
                      ])}
                    />
                  </div>
                </AdminPanel>
              )}
              {data.appointments && (
                <AdminPanel title={t("todayAppointments")} href="/admin/appointments">
                  <Metrics
                    rows={[
                      [t("today"), f.number(count(data.appointments.today))],
                      [t("upcoming"), f.number(count(data.appointments.upcoming))],
                      [
                        t("values.completed"),
                        f.number(count(data.appointments.statuses, "completed")),
                      ],
                      [
                        t("values.cancelled"),
                        f.number(count(data.appointments.statuses, "cancelled")),
                      ],
                      [
                        t("values.no_show"),
                        f.number(count(data.appointments.statuses, "no_show")),
                      ],
                    ]}
                  />
                  <div className="mt-5">
                    <SimpleTable
                      headings={[
                        t("fields.startsAt"),
                        t("fields.customer"),
                        t("fields.partner"),
                        t("fields.service"),
                        t("fields.status"),
                      ]}
                      rows={data.appointments.schedule.map((a: any) => [
                        <Link
                          href={`/admin/appointments/${a._id}`}
                          className="pl-link inline-flex items-center"
                        >
                          {f.date(a.startsAt, true)}
                        </Link>,
                        a.customer,
                        a.partner,
                        f.label(a.service),
                        f.label(a.status),
                      ])}
                    />
                  </div>
                </AdminPanel>
              )}
              {data.customers && (
                <AdminPanel title={t("customerAnalytics")} href="/admin/customers">
                  <Metrics
                    rows={[
                      [t("totalCustomers"), f.number(count(data.customers.total))],
                      [t("customers"), f.number(data.customers.newCustomers.value)],
                      [t("withOrders"), f.number(count(data.customers.withOrders))],
                      ...(data.commerce
                        ? [
                            [
                              t("returningCustomers"),
                              f.number(count(data.commerce.returning)),
                            ] as [string, string],
                          ]
                        : []),
                    ]}
                  />
                </AdminPanel>
              )}
              {data.partners && (
                <AdminPanel title={t("partnerNetwork")} href="/admin/partners">
                  <p className="mb-4 text-2xl font-semibold">
                    {f.number(count(data.partners.total))}
                  </p>
                  <BarChart data={statusData(data.partners.types)} format={f.number} />
                </AdminPanel>
              )}
              {data.training && (
                <AdminPanel title={t("upcomingTraining")} href="/admin/training-sessions">
                  <Metrics
                    rows={[
                      [t("upcoming"), f.number(data.training.upcoming[0]?.sessions ?? 0)],
                      [
                        t("fields.seatsBooked"),
                        f.number(data.training.upcoming[0]?.booked ?? 0),
                      ],
                      [
                        t("availableSeats"),
                        f.number(data.training.upcoming[0]?.available ?? 0),
                      ],
                      [t("completedSessions"), f.number(count(data.training.completed))],
                    ]}
                  />
                  <div className="mt-5">
                    <SimpleTable
                      headings={[
                        t("fields.trainingId"),
                        t("fields.startsAt"),
                        t("fields.trainerId"),
                        t("fields.capacity"),
                        t("fields.seatsBooked"),
                      ]}
                      rows={data.training.sessions.map((s: any) => [
                        <Link
                          href={`/admin/training-sessions/${s._id}`}
                          className="pl-link inline-flex items-center"
                        >
                          {f.label(s.name)}
                        </Link>,
                        f.date(s.startsAt, true),
                        s.trainer ?? "—",
                        s.capacity,
                        s.seatsBooked,
                      ])}
                    />
                  </div>
                </AdminPanel>
              )}
              {data.trainingBookings && (
                <AdminPanel title={t("professionalContent")}>
                  <Metrics
                    rows={[
                      [t("resources.protocols"), f.number(count(data.protocols))],
                      [
                        t("resources.documents"),
                        f.number(count(data.documents, "training")),
                      ],
                      [
                        t("resources.certificates"),
                        f.number(count(data.trainingBookings.certificates)),
                      ],
                    ]}
                  />
                  <div className="mt-4 flex flex-wrap gap-4">
                    {["protocols", "documents", "certificates"].map((key) => (
                      <Link
                        key={key}
                        href={`/admin/${key}`}
                        className="inline-flex min-h-11 items-center text-xs pl-link"
                      >
                        {t(`resources.${key}`)}{" "}
                        <span className="ms-1 inline-block rtl:rotate-180">→</span>
                      </Link>
                    ))}
                  </div>
                </AdminPanel>
              )}
            </div>
            {data.commerce && (
              <AdminPanel
                title={t("recentOrders")}
                href={`/admin/orders?from=${period.from}&to=${period.to}`}
              >
                <SimpleTable
                  headings={[
                    t("fields.orderNumber"),
                    t("fields.customer"),
                    t("fields.type"),
                    t("fields.createdAt"),
                    t("total"),
                    t("fields.paymentStatus"),
                    t("fields.fulfillmentStatus"),
                  ]}
                  rows={data.commerce.recent.map((o: any) => [
                    <Link
                      href={`/admin/orders/${o._id}`}
                      className="pl-link inline-flex items-center"
                    >
                      {o.orderNumber}
                    </Link>,
                    o.customer,
                    f.label(o.type),
                    f.date(o.createdAt),
                    f.money(o.totalMinor),
                    f.label(o.paymentStatus),
                    f.label(o.fulfillmentStatus),
                  ])}
                />
              </AdminPanel>
            )}
            {data.activity && (
              <AdminPanel title={t("recentActivity")} href="/admin/audit">
                <SimpleTable
                  headings={[
                    t("fields.actorEmail"),
                    t("fields.action"),
                    t("fields.resource"),
                    t("fields.createdAt"),
                  ]}
                  rows={data.activity.map((a: any) => [
                    a.actorEmail,
                    a.action,
                    a.resource,
                    f.date(a.createdAt, true),
                  ])}
                />
              </AdminPanel>
            )}
          </>
        )}
      </AdminQueryState>
    </div>
  );
}
