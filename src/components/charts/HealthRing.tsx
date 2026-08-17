"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { clsx } from "clsx";
import {
  healthBand,
  scoreToArcPath,
  type HealthRingDimension,
} from "@/engines/wealth-visuals";

export function HealthRing({
  overall,
  version,
  coveragePct,
  dimensions,
}: {
  overall: number;
  version: string;
  coveragePct: number;
  dimensions: HealthRingDimension[];
}) {
  const titleId = useId();
  const [active, setActive] = useState<string | null>(null);
  const band = healthBand(overall);
  const selected = dimensions.find((d) => d.key === active) ?? null;
  const cx = 100;
  const cy = 100;
  const slice = 360 / Math.max(dimensions.length, 1);

  return (
    <section className="hero-metric" aria-labelledby={titleId}>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr] sm:items-center">
        <div className="mx-auto w-full max-w-[220px]">
          <svg viewBox="0 0 200 200" className="h-auto w-full" role="img" aria-labelledby={titleId}>
            <title id={titleId}>
              Wealth Health {overall} out of 100 — {band.title}
            </title>
            <circle cx={cx} cy={cy} r={78} fill="none" stroke="var(--line)" strokeWidth="12" />
            {dimensions.map((d, i) => {
              const start = -90 + i * slice + 2;
              // Dimension petal fills a fraction of its slice based on score
              const fillPct = Math.max(8, (d.score / 100) * ((slice - 4) / 3.6));
              const arc = scoreToArcPath(fillPct, cx, cy, 92, start);
              return (
                <path
                  key={d.key}
                  d={arc}
                  fill="none"
                  stroke={active === d.key ? "var(--ink)" : "var(--chart-2)"}
                  strokeWidth={active === d.key ? 10 : 7}
                  strokeLinecap="round"
                  opacity={0.45 + (d.score / 100) * 0.55}
                  className="cursor-pointer"
                  onClick={() => setActive(active === d.key ? null : d.key)}
                />
              );
            })}
            <path
              d={scoreToArcPath(overall, cx, cy, 78)}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <text
              x={cx}
              y={cy - 4}
              textAnchor="middle"
              fill="var(--ink)"
              style={{ fontSize: "42px", fontFamily: "var(--font-display)", fontWeight: 650 }}
            >
              {overall}
            </text>
            <text
              x={cx}
              y={cy + 22}
              textAnchor="middle"
              fill="var(--muted)"
              style={{ fontSize: "11px", fontWeight: 600 }}
            >
              / 100
            </text>
          </svg>
        </div>

        <div>
          <p className="eyebrow">Wealth Health</p>
          <h2 className="font-display mt-1 text-2xl font-semibold tracking-tight">{band.title}</h2>
          <p className="muted mt-2 text-sm leading-relaxed">
            A governed score with explanations — not a peer ranking. Low scores are signals to
            strengthen, never to shame.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="badge">Version {version}</span>
            <span className={clsx("badge", coveragePct < 75 ? "badge-warn" : "")}>
              Coverage {coveragePct}%
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {dimensions.map((d) => (
          <button
            key={d.key}
            type="button"
            className={clsx(
              "rounded-[var(--radius-sm)] border p-3 text-left transition",
              active === d.key
                ? "border-accent bg-[color-mix(in_srgb,var(--accent-soft)_70%,white)]"
                : "border-line bg-white",
            )}
            aria-pressed={active === d.key}
            onClick={() => setActive(active === d.key ? null : d.key)}
          >
            <p className="text-xs font-semibold text-muted">{d.label}</p>
            <p className="font-display mt-1 text-2xl">{d.score}</p>
          </button>
        ))}
      </div>

      {selected ? (
        <div className="insight-panel mt-4">
          <p className="eyebrow">{selected.label}</p>
          <p className="mt-2 leading-relaxed text-ink-soft">{selected.reason}</p>
          <Link
            href={`/app/health/${selected.key}`}
            className="mt-3 inline-flex text-sm font-semibold text-accent"
          >
            Open full explanation
          </Link>
        </div>
      ) : (
        <p className="muted mt-4 text-sm">Tap a dimension to see why it scored this way.</p>
      )}
    </section>
  );
}
