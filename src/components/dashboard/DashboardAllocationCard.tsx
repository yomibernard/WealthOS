import Link from "next/link";
import { formatNaira } from "@/lib/format";
import { buildDonutPaths, type WealthMapSegment } from "@/engines/wealth-visuals";

const COLORS = ["#0f6e56", "#245b7a", "#9a6b16", "#5b4a7a", "#3d6b5a", "#8b2e2e"];

export function DashboardAllocationCard({
  segments,
  totalAssetsNgn,
}: {
  segments: WealthMapSegment[];
  totalAssetsNgn: number;
}) {
  const assets = segments.filter((s) => s.kind === "asset").slice(0, 6);
  const slices = buildDonutPaths(
    assets.map((s, i) => ({
      id: s.id,
      label: s.label,
      value: s.valueNgn,
      color: COLORS[i % COLORS.length],
    })),
    80,
    80,
    62,
    38,
  );

  return (
    <article className="dash-card dash-card-allocation">
      <div className="flex items-start justify-between gap-2">
        <p className="dash-card-label">Wealth allocation</p>
        <Link href="/app/wealth/allocation" className="dash-card-link">
          View details
        </Link>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
        <svg viewBox="0 0 160 160" className="mx-auto h-36 w-36" role="img" aria-label="Allocation donut">
          {slices.map((s) => (
            <path key={s.id} d={s.d} fill={s.color} />
          ))}
          <text
            x="80"
            y="76"
            textAnchor="middle"
            fill="var(--muted)"
            style={{ fontSize: "10px", fontWeight: 600 }}
          >
            Assets
          </text>
          <text
            x="80"
            y="94"
            textAnchor="middle"
            fill="var(--ink)"
            style={{ fontSize: "13px", fontFamily: "var(--font-display)", fontWeight: 650 }}
          >
            {formatNaira(totalAssetsNgn, true)}
          </text>
        </svg>

        <ul className="space-y-2 text-sm">
          {assets.map((s, i) => (
            <li key={s.id} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: COLORS[i % COLORS.length] }}
                  aria-hidden
                />
                {s.label}
              </span>
              <span className="font-semibold tabular-nums">
                {s.percentOfAssets != null ? `${Math.round(s.percentOfAssets)}%` : "—"}
              </span>
            </li>
          ))}
          {segments
            .filter((s) => s.kind === "liability")
            .map((s) => (
              <li key={s.id} className="muted flex items-center justify-between gap-2 text-xs">
                <span>{s.label}</span>
                <span>{formatNaira(s.valueNgn, true)}</span>
              </li>
            ))}
        </ul>
      </div>
    </article>
  );
}
