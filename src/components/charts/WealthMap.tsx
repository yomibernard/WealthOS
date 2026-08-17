"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { clsx } from "clsx";
import { formatNaira } from "@/lib/format";
import type { WealthMapSegment } from "@/engines/wealth-visuals";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

export function WealthMap({
  segments,
  totalAssetsNgn,
}: {
  segments: WealthMapSegment[];
  totalAssetsNgn: number;
}) {
  const [openId, setOpenId] = useState<string | null>(segments[0]?.id ?? null);
  const titleId = useId();
  const assets = segments.filter((s) => s.kind === "asset");
  const liabilities = segments.filter((s) => s.kind === "liability");
  const maxAsset = Math.max(...assets.map((s) => s.valueNgn), 1);

  return (
    <section className="action-card" aria-labelledby={titleId}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id={titleId} className="font-display text-xl font-semibold tracking-tight">
            My Wealth Map
          </h2>
          <p className="muted mt-1 text-sm leading-relaxed">
            Proportional view of what you own — tap a category for detail. Not a trading chart.
          </p>
        </div>
        <Link href="/app/wealth/allocation" className="text-sm font-semibold text-accent shrink-0">
          Allocation
        </Link>
      </div>

      <ul className="mt-4 space-y-2" role="list">
        {assets.map((seg, i) => {
          const open = openId === seg.id;
          const widthPct = Math.max(8, (seg.valueNgn / maxAsset) * 100);
          return (
            <li key={seg.id}>
              <button
                type="button"
                className={clsx(
                  "w-full rounded-[var(--radius-sm)] border border-line p-3 text-left transition",
                  open ? "bg-accent-soft/50 border-accent" : "bg-white hover:bg-accent-soft/30",
                )}
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : seg.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{seg.label}</span>
                  <span className="text-sm font-semibold">
                    {formatNaira(seg.valueNgn, true)}
                    {seg.percentOfAssets != null
                      ? ` · ${Math.round(seg.percentOfAssets)}%`
                      : ""}
                  </span>
                </div>
                <div
                  className="mt-2 h-2.5 overflow-hidden rounded-full bg-line"
                  aria-hidden
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${widthPct}%`,
                      background: COLORS[i % COLORS.length],
                    }}
                  />
                </div>
                {open ? (
                  <div className="mt-3 text-sm leading-relaxed text-ink-soft">
                    <p>
                      About {Math.round(seg.percentOfAssets ?? 0)}% of estimated assets
                      {totalAssetsNgn > 0
                        ? ` (${formatNaira(totalAssetsNgn, true)} total assets).`
                        : "."}
                    </p>
                    {seg.href ? (
                      <Link
                        href={seg.href}
                        className="mt-2 inline-flex font-semibold text-accent"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Explore {seg.label.toLowerCase()}
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      {liabilities.map((seg) => (
        <div
          key={seg.id}
          className="risk-alert mt-3"
          role="status"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold">{seg.label}</span>
            <span className="font-semibold">{formatNaira(seg.valueNgn, true)}</span>
          </div>
          <p className="mt-1 text-sm">
            Shown separately so liabilities never look like assets.
          </p>
          {seg.href ? (
            <Link href={seg.href} className="mt-2 inline-flex text-sm font-semibold text-accent">
              Review debt awareness
            </Link>
          ) : null}
        </div>
      ))}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[280px] text-left text-sm">
          <caption className="sr-only">Wealth map accessible table</caption>
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-2 font-semibold">Category</th>
              <th className="py-2 font-semibold">Value</th>
              <th className="py-2 font-semibold">Share</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((s) => (
              <tr key={`row-${s.id}`} className="border-b border-line/70">
                <td className="py-2">{s.label}</td>
                <td className="py-2">{formatNaira(s.valueNgn, true)}</td>
                <td className="py-2">
                  {s.percentOfAssets != null ? `${Math.round(s.percentOfAssets)}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
