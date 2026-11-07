"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AdminEmpty } from "./admin-ui";

export interface ChartDatum {
  label: string;
  value: number;
  href?: string;
}
export function BarChart({
  data,
  format = String,
}: {
  data: ChartDatum[];
  format?: (n: number) => string;
}) {
  if (!data.length || data.every((d) => d.value === 0)) return <AdminEmpty />;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="space-y-3">
      {data.map((d, i) => (
        <li key={`${d.label}-${i}`}>
          <div className="mb-1 flex justify-between gap-3 text-xs">
            <span className="min-w-0 break-words">{d.label}</span>
            <span className="shrink-0 tabular-nums">{format(d.value)}</span>
          </div>
          {d.href ? (
            <Link
              href={d.href}
              aria-label={`${d.label}: ${format(d.value)}`}
              className="flex min-h-11 items-center"
            >
              <span className="block h-4 w-full bg-[#f1f1f1]">
                <span
                  className="block h-full bg-[#303030]"
                  style={{ width: `${(d.value / max) * 100}%` }}
                />
              </span>
            </Link>
          ) : (
            <div
              role="img"
              aria-label={`${d.label}: ${format(d.value)}`}
              className="h-4 bg-[#f1f1f1]"
              title={`${d.label}: ${format(d.value)}`}
            >
              <div
                className="h-full bg-[#303030]"
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function RevenueChart({
  data,
  previous,
  format,
}: {
  data: ChartDatum[];
  previous?: ChartDatum[];
  format: (n: number) => string;
}) {
  const t = useTranslations("AdminExperience");
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [active, setActive] = useState<number | null>(null);
  const id = useId();
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) =>
      setWidth(Math.max(240, entries[0]?.contentRect.width ?? 600)),
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const height = 230,
    left = 12,
    right = width - 12,
    bottom = height - 32,
    top = 26;
  const max = Math.max(
    ...data.map((d) => d.value),
    ...(previous ?? []).map((d) => d.value),
    1,
  );
  const points = (items: ChartDatum[]) =>
    items.map((d, i) => ({
      x: left + (i / Math.max(1, items.length - 1)) * (right - left),
      y: bottom - (d.value / max) * (bottom - top),
      ...d,
    }));
  const current = points(data),
    before = points(previous ?? []);
  const path = (items: ReturnType<typeof points>) =>
    items.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
  const tickEvery = Math.max(1, Math.ceil(data.length / (width < 440 ? 3 : 6)));
  return (
    <div ref={ref} className="min-w-0">
      <div className="mb-3 flex min-h-5 flex-wrap justify-between gap-2 text-xs text-neutral-500">
        <span>{t("revenue")} · AED</span>
        <span>
          {active != null && data[active]
            ? `${data[active]!.label}: ${format(data[active]!.value)}`
            : format(max === 1 && data.every((d) => !d.value) ? 0 : max)}
        </span>
      </div>
      {data.every((d) => d.value === 0) && (
        <p className="text-xs text-neutral-500">{t("empty")}</p>
      )}
      <svg
        role="img"
        aria-label={t("revenueChart")}
        aria-describedby={id}
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={left}
            x2={right}
            y1={top + f * (bottom - top)}
            y2={top + f * (bottom - top)}
            stroke="#ebebeb"
          />
        ))}
        {current.length > 0 && (
          <path
            d={`${path(current)} L${right},${bottom} L${left},${bottom} Z`}
            fill="#e3e3e3"
          />
        )}
        {before.length > 0 && (
          <path
            d={path(before)}
            fill="none"
            stroke="#737373"
            strokeWidth={2}
            strokeDasharray="5 4"
          />
        )}
        <path d={path(current)} fill="none" stroke="#303030" strokeWidth={2.5} />
        {current.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={active === i ? 6 : 3}
              fill="#303030"
              tabIndex={0}
              aria-label={`${p.label}: ${format(p.value)}`}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              <title>
                {p.label}: {format(p.value)}
              </title>
            </circle>
            {i % tickEvery === 0 && (
              <text
                x={p.x}
                y={height - 8}
                textAnchor={i === 0 ? "start" : "middle"}
                fontSize={11}
                fill="#525252"
              >
                {p.label.slice(5)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <p id={id} className="text-xs text-neutral-500">
        {t("selectedPeriod")} — {previous ? t("compare") : t("revenueNote")}
      </p>
      <details className="mt-3">
        <summary className="flex min-h-11 cursor-pointer items-center text-xs pl-link">
          {t("chartTable")}
        </summary>
        <div className="max-h-56 overflow-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr>
                <th>{t("selectedPeriod")}</th>
                <th>{t("revenue")}</th>
                {previous && <th>{t("previous")}</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={i}>
                  <td className="py-2">{d.label}</td>
                  <td>{format(d.value)}</td>
                  {previous && (
                    <td>
                      {previous[i]
                        ? `${previous[i]!.label}: ${format(previous[i]!.value)}`
                        : "—"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
