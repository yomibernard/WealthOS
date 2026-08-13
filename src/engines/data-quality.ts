/**
 * Data quality / confidence remediation engine v1.0
 * Surfaces what to fix so net worth stays trustworthy — no invented balances.
 */

export const DATA_QUALITY_VERSION = "data-quality-1.0";

export type QualityItemInput = {
  id: string;
  kind: "asset" | "liability";
  name: string;
  source: string;
  verificationStatus: string;
  confidence: number;
  lastValuationDate: Date | string;
  currency: string;
  categoryOrType?: string;
};

export type QualityIssueCode =
  | "stale_valuation"
  | "estimated_only"
  | "low_confidence"
  | "foreign_currency";

export type QualityIssue = {
  code: QualityIssueCode;
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
};

export type RemediationItem = {
  id: string;
  kind: "asset" | "liability";
  name: string;
  source: string;
  verificationStatus: string;
  confidence: number;
  ageDays: number;
  currency: string;
  issues: QualityIssue[];
  priority: number;
  recommendedAction: string;
};

export type DataQualityReport = {
  version: string;
  overallScore: number;
  issueCount: number;
  highPriorityCount: number;
  items: RemediationItem[];
  summary: string;
};

function ageDays(date: Date | string, now = new Date()): number {
  const t = date instanceof Date ? date.getTime() : new Date(date).getTime();
  return Math.max(0, Math.floor((now.getTime() - t) / (24 * 60 * 60 * 1000)));
}

export function assessItem(item: QualityItemInput, now = new Date()): RemediationItem {
  const age = ageDays(item.lastValuationDate, now);
  const issues: QualityIssue[] = [];

  if (age > 180 || item.verificationStatus === "STALE") {
    issues.push({
      code: "stale_valuation",
      severity: "high",
      title: "Stale valuation",
      detail: `Last marked ${age} days ago. Refresh so net worth is not drifting on old estimates.`,
    });
  } else if (age > 90) {
    issues.push({
      code: "stale_valuation",
      severity: "medium",
      title: "Ageing valuation",
      detail: `Last marked ${age} days ago. A quick confirm keeps confidence healthy.`,
    });
  }

  if (item.verificationStatus === "ESTIMATED") {
    issues.push({
      code: "estimated_only",
      severity: "medium",
      title: "Estimated only",
      detail: "Still marked as estimated — confirm if you have a statement or appraisal.",
    });
  }

  if (item.confidence < 0.55) {
    issues.push({
      code: "low_confidence",
      severity: "high",
      title: "Low item confidence",
      detail: `Item confidence is ${Math.round(item.confidence * 100)}%. Update value or provenance.`,
    });
  } else if (item.confidence < 0.7) {
    issues.push({
      code: "low_confidence",
      severity: "low",
      title: "Moderate confidence",
      detail: "A fresher mark or verified source would strengthen this line.",
    });
  }

  if (item.currency !== "NGN") {
    issues.push({
      code: "foreign_currency",
      severity: "low",
      title: "FX-sensitive",
      detail: `${item.currency} holdings move with FX — keep the local mark current.`,
    });
  }

  const severityWeight = { high: 30, medium: 15, low: 5 };
  const priority = issues.reduce((s, i) => s + severityWeight[i.severity], 0);

  let recommendedAction = "No action needed right now.";
  if (issues.some((i) => i.code === "stale_valuation")) {
    recommendedAction = "Confirm today’s estimate or enter an updated value.";
  } else if (issues.some((i) => i.code === "low_confidence" && i.severity === "high")) {
    recommendedAction = "Update the amount and mark how you know it.";
  } else if (issues.some((i) => i.code === "estimated_only")) {
    recommendedAction = "Confirm the estimate or upgrade verification when you have evidence.";
  }

  return {
    id: item.id,
    kind: item.kind,
    name: item.name,
    source: item.source,
    verificationStatus: item.verificationStatus,
    confidence: item.confidence,
    ageDays: age,
    currency: item.currency,
    issues,
    priority,
    recommendedAction,
  };
}

export function buildDataQualityReport(
  items: QualityItemInput[],
  overallConfidence: number,
  now = new Date(),
): DataQualityReport {
  const assessed = items
    .map((i) => assessItem(i, now))
    .filter((i) => i.issues.length > 0)
    .sort((a, b) => b.priority - a.priority);

  const highPriorityCount = assessed.filter((i) =>
    i.issues.some((x) => x.severity === "high"),
  ).length;

  const issueCount = assessed.reduce((s, i) => s + i.issues.length, 0);
  const overallScore = Math.round(
    Math.max(0, Math.min(1, overallConfidence - highPriorityCount * 0.04)) * 100,
  );

  let summary =
    "Wealth Graph data looks fresh enough for directional planning. Estimates are never precise facts.";
  if (highPriorityCount > 0) {
    summary = `${highPriorityCount} holding(s) need attention before you treat net worth as reliable. Start with stale or low-confidence items.`;
  } else if (assessed.length > 0) {
    summary = "A few ageing or estimated lines remain — optional refresh will improve confidence.";
  }

  return {
    version: DATA_QUALITY_VERSION,
    overallScore,
    issueCount,
    highPriorityCount,
    items: assessed,
    summary,
  };
}
