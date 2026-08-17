"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { formatCurrency, formatNaira } from "@/lib/format";
import {
  buildAreaPath,
  convertNgnAmount,
  filterSnapshotsByPeriod,
  type DisplayCurrency,
  type PeriodKey,
  type SnapshotPoint,
} from "@/engines/wealth-visuals";

const PERIODS: PeriodKey[] = ["1M", "3M", "6M", "1Y", "ALL"];
const CURRENCIES: DisplayCurrency[] = ["NGN", "USD", "GBP"];

type Rate = { from: string; to: string; rate: number };

export function NetWorthCurve({
  currentNetWorthNgn,
  snapshots,
  rates,
  changeNgn,
  confidencePct,
}: {
  currentNetWorthNgn: number;
  snapshots: SnapshotPoint[];
  rates: Rate[];
  changeNgn: number | null;
  confidencePct: number;
}) {
  const [period, setPeriod] = useState<PeriodKey>("ALL");
  const [currency, setCurrency] = useState<DisplayCurrency>("NGN");

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

    const converted = withCurrent.map((p) => {
      const v = convertNgnAmount(p.netWorthNgn, currency, rates);
      return { at: p.at, value: v ?? p.netWorthNgn, missingFx: v == null && currency !== "NGN" };
    });
    return converted;
  }, [snapshots, period, currency, rates, currentNetWorthNgn]);

  const missingFx = currency !== "NGN" && series.some((s) => s.missingFx);
  const displayValue = convertNgnAmount(currentNetWorthNgn, currency, rates);
  const paths = buildAreaPath(
    series.map((s) => s.value),
    640,
    160,
  );
  const changeDisplay =
    changeNgn == null
      ? null
      : convertNgnAmount(changeNgn, currency, rates) ?? (currency === "NGN" ? changeNgn : null);

  return (
    <section className="hero-metric">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Estimated net worth</p>
          <p className="font-display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
            {displayValue == null
              ? formatNaira(currentNetWorthNgn, true)
              : formatCurrency(displayValue, currency, true)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {changeDisplay != null ? (
              <span
                className={clsx(
                  "badge",
                  changeDisplay >= 0 ? "" : "badge-warn",
                )}
              >
                {changeDisplay >= 0 ? "+" : ""}
                {formatCurrency(changeDisplay, currency === "NGN" || displayValue != null ? currency : "NGN", true)}{" "}
                this month
              </span>
            ) : (
              <span className="badge">Building history</span>
            )}
            <span className={clsx("badge", confidencePct >= 75 ? "" : "badge-warn")}>
              Confidence {confidencePct}%
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap justify-end gap-1" role="group" aria-label="Display currency">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                type="button"
                className={clsx(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  currency === c ? "bg-ink text-white" : "bg-accent-soft text-accent",
                )}
                aria-pressed={currency === c}
                onClick={() => setCurrency(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap justify-end gap-1" role="group" aria-label="History period">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                className={clsx(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  period === p ? "bg-accent text-white" : "border border-line text-muted",
                )}
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
              >
                {p === "ALL" ? "All" : p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {missingFx ? (
        <p className="muted mt-3 text-sm" role="status">
          Showing NGN-equivalent labels where an FX rate for {currency} is missing — WealthOS never
          invents rates.
        </p>
      ) : null}

      <div className="mt-4" aria-hidden={series.length < 2}>
        <svg
          viewBox="0 0 640 160"
          className="h-36 w-full"
          role="img"
          aria-label={
            series.length < 2
              ? "Net worth history will appear as snapshots are recorded"
              : `Net worth trend over ${period === "ALL" ? "all history" : period}`
          }
        >
          <defs>
            <linearGradient id="nwFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {paths.area ? <path d={paths.area} fill="url(#nwFill)" /> : null}
          {paths.line ? (
            <path
              d={paths.line}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </svg>
      </div>

      <div className="sr-only">
        <table>
          <caption>Net worth history</caption>
          <thead>
            <tr>
              <th>Date</th>
              <th>Value ({currency})</th>
            </tr>
          </thead>
          <tbody>
            {series.map((s) => (
              <tr key={s.at}>
                <td>{new Date(s.at).toLocaleDateString("en-GB")}</td>
                <td>{formatCurrency(s.value, currency, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link href="/app/wealth/net-worth" className="mt-2 inline-flex text-sm font-semibold text-accent">
        Net worth detail
      </Link>
    </section>
  );
}
