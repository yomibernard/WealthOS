/**
 * Pure helpers for WealthOS visual intelligence (Wave 2).
 * Numbers come from engines / snapshots — never invented in the UI.
 */

export type SnapshotPoint = {
  at: string; // ISO
  netWorthNgn: number;
};

export type WealthMapSegment = {
  id: string;
  label: string;
  valueNgn: number;
  /** Share of total assets (0–100). Liabilities use null. */
  percentOfAssets: number | null;
  kind: "asset" | "liability";
  href?: string;
};

export type HealthRingDimension = {
  key: string;
  label: string;
  score: number;
  reason: string;
};

export type PeriodKey = "1M" | "3M" | "6M" | "1Y" | "ALL";
export type DisplayCurrency = "NGN" | "USD" | "GBP";

const PERIOD_DAYS: Record<Exclude<PeriodKey, "ALL">, number> = {
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
};

const CATEGORY_MAP: Record<string, { id: string; label: string; href?: string }> = {
  CASH: { id: "cash", label: "Cash", href: "/app/cashflow" },
  PROPERTY: { id: "property", label: "Property", href: "/app/property" },
  INVESTMENT: { id: "investments", label: "Investments", href: "/app/wealth/allocation" },
  PENSION: { id: "pension", label: "Pension", href: "/app/pension" },
  BUSINESS: { id: "business", label: "Business", href: "/app/business" },
  CRYPTO: { id: "other", label: "Other", href: "/app/crypto" },
  INSURANCE: { id: "other", label: "Other", href: "/app/insurance" },
};

export function filterSnapshotsByPeriod(
  points: SnapshotPoint[],
  period: PeriodKey,
  now = new Date(),
): SnapshotPoint[] {
  const sorted = [...points].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );
  if (period === "ALL" || sorted.length === 0) return sorted;
  const cutoff = now.getTime() - PERIOD_DAYS[period] * 24 * 60 * 60 * 1000;
  const filtered = sorted.filter((p) => new Date(p.at).getTime() >= cutoff);
  return filtered.length ? filtered : sorted.slice(-1);
}

export function convertNgnAmount(
  amountNgn: number,
  currency: DisplayCurrency,
  rates: { from: string; to: string; rate: number }[],
): number | null {
  if (currency === "NGN") return amountNgn;
  const direct = rates.find((r) => r.from === "NGN" && r.to === currency);
  if (direct) return amountNgn * direct.rate;
  const inverse = rates.find((r) => r.from === currency && r.to === "NGN");
  if (inverse && inverse.rate !== 0) return amountNgn / inverse.rate;
  return null;
}

export function buildWealthMapSegments(
  assetBreakdown: { category: string; valueNgn: number; percent: number }[],
  totalLiabilitiesNgn: number,
): WealthMapSegment[] {
  const buckets = new Map<string, WealthMapSegment>();

  for (const row of assetBreakdown) {
    const mapped = CATEGORY_MAP[row.category] ?? {
      id: "other",
      label: "Other",
      href: "/app/wealth",
    };
    const existing = buckets.get(mapped.id);
    if (existing) {
      existing.valueNgn += row.valueNgn;
      existing.percentOfAssets = (existing.percentOfAssets ?? 0) + row.percent;
    } else {
      buckets.set(mapped.id, {
        id: mapped.id,
        label: mapped.label,
        valueNgn: row.valueNgn,
        percentOfAssets: row.percent,
        kind: "asset",
        href: mapped.href,
      });
    }
  }

  const assets = [...buckets.values()].sort((a, b) => b.valueNgn - a.valueNgn);
  if (totalLiabilitiesNgn > 0) {
    assets.push({
      id: "liabilities",
      label: "Liabilities",
      valueNgn: totalLiabilitiesNgn,
      percentOfAssets: null,
      kind: "liability",
      href: "/app/lending",
    });
  }
  return assets;
}

export function healthBand(score: number): { title: string; tone: "good" | "watch" | "focus" } {
  if (score >= 80) return { title: "Strong footing", tone: "good" };
  if (score >= 65) return { title: "Good, but needs attention", tone: "watch" };
  if (score >= 50) return { title: "Needs attention", tone: "watch" };
  return { title: "Needs focused work", tone: "focus" };
}

/** Short label for compact dashboard cards (reference-style). */
export function healthShortLabel(score: number): string {
  if (score >= 80) return "Strong";
  if (score >= 65) return "Good";
  if (score >= 50) return "Watch";
  return "Focus";
}

export type DonutSlice = {
  id: string;
  label: string;
  value: number;
  color: string;
};

/** SVG donut paths from positive values (pure geometry — values must be engine-grounded). */
export function buildDonutPaths(
  slices: DonutSlice[],
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
): { id: string; label: string; color: string; d: string; percent: number }[] {
  const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);
  if (total <= 0) return [];
  let angle = -Math.PI / 2;
  return slices
    .filter((s) => s.value > 0)
    .map((s) => {
      const sweep = (s.value / total) * Math.PI * 2;
      const a0 = angle;
      const a1 = angle + sweep;
      angle = a1;
      const large = sweep > Math.PI ? 1 : 0;
      const x0o = cx + outerR * Math.cos(a0);
      const y0o = cy + outerR * Math.sin(a0);
      const x1o = cx + outerR * Math.cos(a1);
      const y1o = cy + outerR * Math.sin(a1);
      const x0i = cx + innerR * Math.cos(a1);
      const y0i = cy + innerR * Math.sin(a1);
      const x1i = cx + innerR * Math.cos(a0);
      const y1i = cy + innerR * Math.sin(a0);
      const d = [
        `M ${x0o.toFixed(2)} ${y0o.toFixed(2)}`,
        `A ${outerR} ${outerR} 0 ${large} 1 ${x1o.toFixed(2)} ${y1o.toFixed(2)}`,
        `L ${x0i.toFixed(2)} ${y0i.toFixed(2)}`,
        `A ${innerR} ${innerR} 0 ${large} 0 ${x1i.toFixed(2)} ${y1i.toFixed(2)}`,
        "Z",
      ].join(" ");
      return {
        id: s.id,
        label: s.label,
        color: s.color,
        d,
        percent: (s.value / total) * 100,
      };
    });
}

/** SVG arc path for a score 0–100 ring segment. */
export function scoreToArcPath(
  score: number,
  cx: number,
  cy: number,
  r: number,
  startAngleDeg = -90,
): string {
  const clamped = Math.max(0, Math.min(100, score));
  if (clamped <= 0) return "";
  const sweep = (clamped / 100) * 360;
  const start = (startAngleDeg * Math.PI) / 180;
  const end = ((startAngleDeg + sweep) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  const large = sweep > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

export function buildAreaPath(
  values: number[],
  width: number,
  height: number,
  pad = 8,
): { line: string; area: string } {
  if (values.length === 0) return { line: "", area: "" };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const pts = values.map((v, i) => {
    const x = pad + (values.length === 1 ? innerW / 2 : (i / (values.length - 1)) * innerW);
    const y = pad + innerH - ((v - min) / span) * innerH;
    return { x, y };
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${(height - pad).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(height - pad).toFixed(1)} Z`;
  return { line, area };
}
