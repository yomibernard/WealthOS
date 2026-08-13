/**
 * Adviser → customer nudge v1.0
 * Requests action without executing products or inventing balances.
 */

export const ADVISER_NUDGE_VERSION = "adviser-nudge-1.0";

export type NudgeType =
  | "refresh_data"
  | "complete_profile"
  | "generate_digest"
  | "review_funding"
  | "review_actions";

export type NudgeTemplate = {
  type: NudgeType;
  title: string;
  body: string;
  href: string;
  priority: "important" | "advisory";
};

const TEMPLATES: Record<NudgeType, Omit<NudgeTemplate, "type">> = {
  refresh_data: {
    title: "Please refresh your Wealth Graph data",
    body: "Your adviser asked you to confirm or update stale valuations so net worth and recommendations stay trustworthy. No money will move.",
    href: "/app/wealth/confidence",
    priority: "important",
  },
  complete_profile: {
    title: "Please complete your financial profile",
    body: "Your adviser asked you to close profile gaps (risk, income, goals, consent) so suitability reviews are better grounded.",
    href: "/app/profile",
    priority: "important",
  },
  generate_digest: {
    title: "Please generate your weekly digest",
    body: "Your adviser asked for a fresh weekly wealth digest before your next review. It is informational only.",
    href: "/app/digest",
    priority: "advisory",
  },
  review_funding: {
    title: "Please review goal funding",
    body: "Your adviser asked you to look at goal funding pulse and decide whether to adjust planned monthly contributions (plan choice only).",
    href: "/app/plan/funding",
    priority: "advisory",
  },
  review_actions: {
    title: "Please review open recommendations",
    body: "Your adviser asked you to review outstanding WealthOS actions. Doing nothing can still be suitable.",
    href: "/app/actions",
    priority: "important",
  },
};

export function buildAdviserNudge(
  type: NudgeType,
  adviserName: string,
  personalNote?: string | null,
): NudgeTemplate & { version: string; noteBody: string } {
  const base = TEMPLATES[type];
  const noteBody = [
    base.body,
    personalNote?.trim() ? `Adviser note from ${adviserName}: ${personalNote.trim().slice(0, 400)}` : null,
    "This is a request for review — not an instruction to buy a product.",
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    version: ADVISER_NUDGE_VERSION,
    type,
    title: base.title,
    body: base.body,
    href: base.href,
    priority: base.priority,
    noteBody,
  };
}

export function listNudgeTypes(): Array<{ type: NudgeType; label: string }> {
  return [
    { type: "refresh_data", label: "Refresh data quality" },
    { type: "complete_profile", label: "Complete profile" },
    { type: "generate_digest", label: "Generate weekly digest" },
    { type: "review_funding", label: "Review goal funding" },
    { type: "review_actions", label: "Review open actions" },
  ];
}
