/**
 * Adviser insights pack v1.0 — talking points from customer engines.
 * Supports human review; does not auto-execute or invent balances.
 */

export const ADVISER_INSIGHTS_VERSION = "adviser-insights-1.0";

export type AdviserInsightInput = {
  customerName: string;
  netWorthNgn: number;
  confidence: number;
  healthScore: number;
  emergencyMonths: number;
  staleAssetCount: number;
  dataQualityHighPriority: number;
  behindGoalCount: number;
  monthlyFundingGapNgn: number;
  openEscalations: number;
  proposedActions: number;
  latestDigestHeadline?: string | null;
  attention: string[];
};

export type TalkingPoint = {
  id: string;
  priority: "critical" | "important" | "advisory";
  title: string;
  detail: string;
  suggestedQuestion: string;
};

export type AdviserInsightsPack = {
  version: string;
  briefing: string;
  talkingPoints: TalkingPoint[];
  doNotSay: string[];
};

export function buildAdviserInsights(input: AdviserInsightInput): AdviserInsightsPack {
  const points: TalkingPoint[] = [];

  if (input.openEscalations > 0) {
    points.push({
      id: "escalations",
      priority: "critical",
      title: "Open human escalations",
      detail: `${input.openEscalations} open escalation(s). Resolve care needs before product discussion.`,
      suggestedQuestion: "What would make you feel safer reviewing this with me today?",
    });
  }

  if (input.confidence < 0.7 || input.staleAssetCount > 0 || input.dataQualityHighPriority > 0) {
    points.push({
      id: "data_quality",
      priority: input.dataQualityHighPriority > 0 || input.staleAssetCount > 0 ? "important" : "advisory",
      title: "Data confidence gaps",
      detail: `Confidence ~${Math.round(input.confidence * 100)}% · ${input.staleAssetCount} stale · ${input.dataQualityHighPriority} high-priority data items.`,
      suggestedQuestion: "Which holdings should we refresh first — property, business, or pensions?",
    });
  }

  if (input.behindGoalCount > 0) {
    points.push({
      id: "funding",
      priority: "important",
      title: "Goal funding pressure",
      detail: `${input.behindGoalCount} goal(s) behind under illustrative assumptions${
        input.monthlyFundingGapNgn > 0
          ? `; modelled gap ~₦${Math.round(input.monthlyFundingGapNgn).toLocaleString("en-NG")}/mo`
          : ""
      }.`,
      suggestedQuestion: "If we only fix one goal’s funding this quarter, which matters most to you?",
    });
  }

  if (input.emergencyMonths < 3) {
    points.push({
      id: "liquidity",
      priority: "important",
      title: "Liquidity buffer thin",
      detail: `Emergency coverage ≈ ${input.emergencyMonths.toFixed(1)} months.`,
      suggestedQuestion: "How many months of expenses would help you sleep better?",
    });
  }

  if (input.proposedActions > 0) {
    points.push({
      id: "actions",
      priority: "advisory",
      title: "Outstanding WealthOS actions",
      detail: `${input.proposedActions} proposed recommendation(s) awaiting customer review.`,
      suggestedQuestion: "Which of the open recommendations still feels relevant after your latest life events?",
    });
  }

  if (input.latestDigestHeadline) {
    points.push({
      id: "digest",
      priority: "advisory",
      title: "Latest weekly digest",
      detail: input.latestDigestHeadline,
      suggestedQuestion: "Did last week’s digest miss anything important at home or work?",
    });
  }

  if (input.attention.length) {
    points.push({
      id: "attention",
      priority: "advisory",
      title: "System attention items",
      detail: input.attention.slice(0, 3).join("; "),
      suggestedQuestion: "Which of these feels most urgent to you — and which can wait?",
    });
  }

  if (points.length === 0) {
    points.push({
      id: "steady",
      priority: "advisory",
      title: "Steady snapshot",
      detail: "No critical gaps flagged. Use the session to confirm goals and life changes.",
      suggestedQuestion: "What changed in your household or work since we last spoke?",
    });
  }

  const rank = { critical: 0, important: 1, advisory: 2 };
  points.sort((a, b) => rank[a.priority] - rank[b.priority]);

  const briefing = [
    `${input.customerName}: estimated net worth ₦${Math.round(input.netWorthNgn).toLocaleString("en-NG")} (confidence ~${Math.round(input.confidence * 100)}%), Wealth Health ${input.healthScore}/100, liquidity ≈ ${input.emergencyMonths.toFixed(1)} months.`,
    `${points.filter((p) => p.priority !== "advisory").length} priority talking point(s) prepared for human review.`,
  ].join(" ");

  return {
    version: ADVISER_INSIGHTS_VERSION,
    briefing,
    talkingPoints: points.slice(0, 8),
    doNotSay: [
      "Do not invent balances, returns, fees, or licence status.",
      "Do not pressure product purchase — suitability and consent come first.",
      "Do not auto-label offers as scam, fraud, safe, or guaranteed.",
      "Doing nothing can be a suitable recommendation.",
    ],
  };
}
