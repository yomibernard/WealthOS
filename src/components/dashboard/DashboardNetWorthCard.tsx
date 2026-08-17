"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatCurrency, formatNaira } from "@/lib/format";
import {
  buildAreaPath,
  convertNgnAmount,
  filterSnapshotsByPeriod,
  type DisplayCurrency,
  type PeriodKey,
  type SnapshotPoint,
} from "@/engines/wealth-visuals";

const PERIODS: { id: PeriodKey; label: string }[] = [
  { id: "1M", label: "This month" },
  { id: "3M", label: "3 months" },
  { id: "6M", label: "6 months" },
  { id: "1Y", label: "1 year" },
  { id: "ALL", label: "All time" },
];

type Rate = { from: string; to: string; rate: number };

export function DashboardNetWorthCard({
  currentNetWorthNgn,
  snapshots,
  rates,
  changeNgn,
  changePct,
  currency = "NGN",
}: {
  currentNetWorthNgn: number;
  snapshots: SnapshotPoint[];
  rates: Rate[];
  changeNgn: number | null;
  changePct: number | null;
  currency?: DisplayCurrency;
}) {
  const [period, setPeriod] = useState<PeriodKey>("1M");

  const series = useMemo(() => {
    const base =
      snapshots.length > 0
        ? snapshots
        : [{ at: new Date().toISOString(), netWorthNgn: currentNetWorthNgn }];
    const filtered = filterSnapshotsByPeriod(base, period);
    const last = filtered[filtered.length - 1];
    const withCurrent =
      !last || Math.abs(last.netWorthNgn - currentNetWorthNgn) > 1
        ? [...filtered, { at: new Date().toISOString(), netWorthNgn: currentNetWorthNgn }]
        : filtered;
    return withCurrent.map((p) => {
      const v = convertNgnAmount(p.netWorthNgn, currency, rates);
      return { at: p.at, value: v ?? p.netWorthNgn };
    });
  }, [snapshots, period, currency, rates, currentNetWorthNgn]);

  const displayValue = convertNgnAmount(currentNetWorthNgn, currency, rates);
  const paths = buildAreaPath(
    series.map((s) => s.value),
    640,
    140,
  );
  const changeDisplay =
    changeNgn == null
      ? null
      : convertNgnAmount(changeNgn, currency, rates) ?? (currency === "NGN" ? changeNgn : null);
  const latestLabel =
    series.length > 0
      ? new Date(series[series.length - 1].at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        })
      : "";

  return (
    <article className="dash-card dash-card-networth">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="dash-card-label">Estimated net worth</p>
          <p className="dash-card-value">
            {displayValue == null
              ? formatNaira(currentNetWorthNgn, true)
              : formatCurrency(displayValue, currency, true)}
          </p>
          <p className="mt-2 text-sm">
            {changeDisplay != null ? (
              <span className={changeDisplay >= 0 ? "text-accent font-semibold" : "text-[var(--warning)] font-semibold"}>
                {changeDisplay >= 0 ? "+" : ""}
                {formatCurrency(changeDisplay, currency, true)}
                {changePct != null ? ` (${changePct >= 0 ? "+" : ""}${changePct.toFixed(1)}%)` : ""}{" "}
                vs prior snapshot
              </span>
            ) : (
              <span className="muted">Generate a report to track month-over-month movement</span>
            )}
          </p>
        </div>
        <label className="dash-select">
          <span className="sr-only">Period</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodKey)}
            aria-label="Net worth period"
          >
            {PERIODS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="dash-chart mt-4" aria-hidden={series.length < 2}>
        <svg viewBox="0 0 640 140" className="h-auto w-full" role="img" aria-label="Net worth trend">
          <defs>
            <linearGradient id="nwFillDash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f6e56" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#0f6e56" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {paths.area ? <path d={paths.area} fill="url(#nwFillDash)" /> : null}
          {paths.line ? (
            <path d={paths.line} fill="none" stroke="#0f6e56" strokeWidth="3" strokeLinecap="round" />
          ) : null}
        </svg>
        <div className="muted mt-1 flex justify-between text-xs">
          <span>{series[0] ? new Date(series[0].at).toLocaleDateString("en-GB", { month: "short" }) : ""}</span>
          <span>{latestLabel}</span>
        </div>
      </div>

      <Link href="/app/wealth/net-worth" className="dash-card-link mt-3 inline-flex">
        View net worth detail
      </Link>
    </article>
  );
}
