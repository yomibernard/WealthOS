/**
 * Month-over-month insights from Wealth Snapshots — informational only.
 */

export const REPORT_INSIGHTS_VERSION = "report-insights-1.0";

export type SnapshotPoint = {
  id: string;
  createdAt: string | Date;
  netWorthNgn: number;
  healthScore: number | null;
  confidence: number;
};

export type MonthOverMonthInsight = {
  id: string;
  tone: "up" | "down" | "flat" | "info";
  title: string;
  body: string;
};

export type ReportInsights = {
  version: string;
  points: { id: string; label: string; netWorthNgn: number; healthScore: number | null }[];
  netWorthDeltaNgn: number | null;
  netWorthDeltaPercent: number | null;
  healthDelta: number | null;
  insights: MonthOverMonthInsight[];
  narrative: string;
};

function asDate(v: string | Date): Date {
  return v instanceof Date ? v : new Date(v);
}

export function buildReportInsights(pointsNewestFirst: SnapshotPoint[]): ReportInsights {
  const ordered = [...pointsNewestFirst].sort(
    (a, b) => asDate(b.createdAt).getTime() - asDate(a.createdAt).getTime(),
  );
  const points = [...ordered]
    .reverse()
    .map((p) => ({
      id: p.id,
      label: asDate(p.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
      netWorthNgn: p.netWorthNgn,
      healthScore: p.healthScore,
    }));

  if (ordered.length < 2) {
    return {
      version: REPORT_INSIGHTS_VERSION,
      points,
      netWorthDeltaNgn: null,
      netWorthDeltaPercent: null,
      healthDelta: null,
      insights: [
        {
          id: "need_history",
          tone: "info",
          title: "Building history",
          body: "Generate another monthly report later to unlock month-over-month comparison.",
        },
      ],
      narrative:
        "One snapshot is on file. A second report will show how estimated net worth and health moved.",
    };
  }

  const newest = ordered[0];
  const prior = ordered[1];
  const netWorthDeltaNgn = newest.netWorthNgn - prior.netWorthNgn;
  const netWorthDeltaPercent =
    prior.netWorthNgn !== 0 ? (netWorthDeltaNgn / Math.abs(prior.netWorthNgn)) * 100 : null;
  const healthDelta =
    newest.healthScore != null && prior.healthScore != null
      ? newest.healthScore - prior.healthScore
      : null;

  const insights: MonthOverMonthInsight[] = [];

  if (Math.abs(netWorthDeltaNgn) < 1) {
    insights.push({
      id: "nw_flat",
      tone: "flat",
      title: "Net worth broadly unchanged",
      body: "Estimated net worth is essentially flat versus the prior snapshot. That can be healthy when buffers and goals are already on track.",
    });
  } else if (netWorthDeltaNgn > 0) {
    insights.push({
      id: "nw_up",
      tone: "up",
      title: "Estimated net worth rose",
      body: `Up about ₦${Math.round(netWorthDeltaNgn).toLocaleString("en-NG")}${
        netWorthDeltaPercent != null ? ` (${netWorthDeltaPercent.toFixed(1)}%)` : ""
      } versus the prior snapshot. Confirm valuations and FX before treating this as cash you can spend.`,
    });
  } else {
    insights.push({
      id: "nw_down",
      tone: "down",
      title: "Estimated net worth fell",
      body: `Down about ₦${Math.round(Math.abs(netWorthDeltaNgn)).toLocaleString("en-NG")}${
        netWorthDeltaPercent != null ? ` (${Math.abs(netWorthDeltaPercent).toFixed(1)}%)` : ""
      }. Check stale property marks, FX moves, and new liabilities before reacting.`,
    });
  }

  if (healthDelta != null) {
    if (healthDelta >= 2) {
      insights.push({
        id: "health_up",
        tone: "up",
        title: "Wealth Health improved",
        body: `Health score moved +${healthDelta} points versus the prior report.`,
      });
    } else if (healthDelta <= -2) {
      insights.push({
        id: "health_down",
        tone: "down",
        title: "Wealth Health softened",
        body: `Health score moved ${healthDelta} points. Review liquidity, debt service, and concentration levers.`,
      });
    } else {
      insights.push({
        id: "health_flat",
        tone: "flat",
        title: "Wealth Health stable",
        body: "Health score is broadly unchanged versus the prior snapshot.",
      });
    }
  }

  const confDelta = newest.confidence - prior.confidence;
  if (confDelta <= -0.08) {
    insights.push({
      id: "confidence_down",
      tone: "down",
      title: "Data confidence slipped",
      body: "Refresh stale valuations or reconnect accounts so recommendations stay trustworthy.",
    });
  } else if (confDelta >= 0.08) {
    insights.push({
      id: "confidence_up",
      tone: "up",
      title: "Data confidence improved",
      body: "Better coverage means WealthOS can rank next steps with more certainty.",
    });
  }

  const narrative = insights.map((i) => i.body).join(" ");

  return {
    version: REPORT_INSIGHTS_VERSION,
    points,
    netWorthDeltaNgn,
    netWorthDeltaPercent,
    healthDelta,
    insights,
    narrative,
  };
}

/** Compact SVG path for a simple sparkline (viewBox 0 0 100 32). */
export function sparklinePath(values: number[]): string {
  if (values.length === 0) return "";
  if (values.length === 1) return "M 0 16 L 100 16";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 28 - ((v - min) / span) * 24;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}
