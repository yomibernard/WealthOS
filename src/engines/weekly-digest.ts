/**
 * Weekly wealth digest v1.0 — calm, informational summary.
 * Does not solicit products or move money.
 */

export const WEEKLY_DIGEST_VERSION = "weekly-digest-1.0";

export type DigestSection = {
  id: string;
  title: string;
  body: string;
  href?: string;
  tone: "info" | "ok" | "watch";
};

export type WeeklyDigestInput = {
  name: string;
  netWorthNgn: number;
  confidence: number;
  healthScore: number;
  emergencyMonths: number;
  staleAssetCount: number;
  dataQualityHighPriority: number;
  behindGoalCount: number;
  monthlyFundingGapNgn: number;
  unreadInbox: number;
  topInboxTitles: string[];
  monthChangeNgn: number | null;
};

export type WeeklyDigest = {
  version: string;
  headline: string;
  sections: DigestSection[];
  nextSteps: { label: string; href: string }[];
  disclaimer: string;
};

export function buildWeeklyDigest(input: WeeklyDigestInput): WeeklyDigest {
  const sections: DigestSection[] = [];

  const changeNote =
    input.monthChangeNgn == null
      ? "Generate a monthly report to unlock period-to-period change."
      : input.monthChangeNgn >= 0
        ? `Estimated net worth is up about ₦${Math.round(input.monthChangeNgn).toLocaleString("en-NG")} versus the prior snapshot.`
        : `Estimated net worth is down about ₦${Math.round(Math.abs(input.monthChangeNgn)).toLocaleString("en-NG")} versus the prior snapshot.`;

  sections.push({
    id: "position",
    title: "Position",
    tone: input.confidence >= 0.75 ? "ok" : "watch",
    body: `${input.name}, estimated net worth is ₦${Math.round(input.netWorthNgn).toLocaleString("en-NG")} (confidence ~${Math.round(input.confidence * 100)}%). Wealth Health ${input.healthScore}/100. Liquidity ≈ ${input.emergencyMonths.toFixed(1)} months. ${changeNote}`,
    href: "/app/wealth/net-worth",
  });

  if (input.staleAssetCount > 0 || input.dataQualityHighPriority > 0) {
    sections.push({
      id: "data",
      title: "Data quality",
      tone: "watch",
      body: `${input.staleAssetCount} stale valuation(s) and ${input.dataQualityHighPriority} high-priority data item(s). Refresh estimates before treating net worth as precise.`,
      href: "/app/wealth/confidence",
    });
  } else {
    sections.push({
      id: "data",
      title: "Data quality",
      tone: "ok",
      body: "No high-priority stale items this week. Keep private holdings current each quarter.",
      href: "/app/wealth/confidence",
    });
  }

  if (input.behindGoalCount > 0) {
    sections.push({
      id: "funding",
      title: "Goal funding",
      tone: "watch",
      body: `${input.behindGoalCount} goal(s) look behind under illustrative assumptions${
        input.monthlyFundingGapNgn > 0
          ? ` — modelled gap about ₦${Math.round(input.monthlyFundingGapNgn).toLocaleString("en-NG")}/mo total`
          : ""
      }. Doing nothing remains valid if cash buffer needs come first.`,
      href: "/app/plan/funding",
    });
  } else {
    sections.push({
      id: "funding",
      title: "Goal funding",
      tone: "ok",
      body: "Goals look broadly on track under current illustrative contributions.",
      href: "/app/plan/funding",
    });
  }

  if (input.unreadInbox > 0) {
    sections.push({
      id: "inbox",
      title: "Inbox",
      tone: "watch",
      body: `${input.unreadInbox} unread item(s)${
        input.topInboxTitles.length
          ? `: ${input.topInboxTitles.slice(0, 3).join("; ")}`
          : ""
      }.`,
      href: "/app/inbox",
    });
  } else {
    sections.push({
      id: "inbox",
      title: "Inbox",
      tone: "ok",
      body: "Inbox is clear — no unread wealth items.",
      href: "/app/inbox",
    });
  }

  const watchCount = sections.filter((s) => s.tone === "watch").length;
  const headline =
    watchCount === 0
      ? "A quiet week — position and plans look steady."
      : watchCount === 1
        ? "One area needs a calm look this week."
        : `${watchCount} areas deserve a calm look this week.`;

  const nextSteps = sections
    .filter((s) => s.tone === "watch" && s.href)
    .map((s) => ({ label: s.title, href: s.href! }));

  if (nextSteps.length === 0) {
    nextSteps.push({ label: "Monthly report", href: "/app/reports" });
    nextSteps.push({ label: "Ask WealthAI", href: "/app/ai" });
  }

  return {
    version: WEEKLY_DIGEST_VERSION,
    headline,
    sections,
    nextSteps: nextSteps.slice(0, 4),
    disclaimer:
      "Weekly digest is informational only — not a solicitation to buy products, and not regulated advice. Suitability and consent still apply before any material action.",
  };
}
