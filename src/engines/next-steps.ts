/**
 * Home next-steps pulse — ranked deep links for “know what to do next”.
 * Care / support / privacy outrank product actions; do-nothing is valid.
 */

export type NextStepKind =
  | "care_update"
  | "support"
  | "privacy"
  | "data_quality"
  | "profile"
  | "action"
  | "do_nothing";

export type NextStepPriority = "critical" | "important" | "advisory";

export type NextStep = {
  id: string;
  kind: NextStepKind;
  priority: NextStepPriority;
  title: string;
  detail: string;
  href: string;
};

export type NextStepsPulse = {
  items: NextStep[];
  count: number;
  headline: string | null;
  primaryHref: string;
  summary: string;
};

export type NextStepsInput = {
  careHeadline?: string | null;
  careHref?: string | null;
  supportHeadline?: string | null;
  supportHref?: string | null;
  complaintCount?: number;
  privacyHeadline?: string | null;
  privacyHref?: string | null;
  erasureOpen?: boolean;
  staleAssetCount?: number;
  dataConfidence?: number;
  profileScore?: number | null;
  profileSummary?: string | null;
  actions?: Array<{
    actionType?: string;
    title: string;
    what?: string;
    why?: string;
  }>;
};

const MAX_STEPS = 3;

export function buildNextStepsPulse(input: NextStepsInput): NextStepsPulse {
  const candidates: NextStep[] = [];

  if (input.careHeadline) {
    candidates.push({
      id: "care_update",
      kind: "care_update",
      priority: "important",
      title: input.careHeadline,
      detail: "Read your adviser care update and mark as seen when ready.",
      href: input.careHref || "/app/support",
    });
  }

  if (input.supportHeadline) {
    candidates.push({
      id: "support",
      kind: "support",
      priority: (input.complaintCount ?? 0) > 0 ? "critical" : "important",
      title: input.supportHeadline,
      detail: "Open Support for case status — ops still owns formal resolution.",
      href: input.supportHref || "/app/support",
    });
  }

  if (input.privacyHeadline) {
    candidates.push({
      id: "privacy",
      kind: "privacy",
      priority: input.erasureOpen ? "critical" : "important",
      title: input.privacyHeadline,
      detail: "Review Privacy Centre updates without closing ops queues yourself.",
      href: input.privacyHref || "/app/privacy",
    });
  }

  const stale = input.staleAssetCount ?? 0;
  const confidence = input.dataConfidence ?? 1;
  if (stale > 0 || confidence < 0.75) {
    candidates.push({
      id: "data_quality",
      kind: "data_quality",
      priority: stale > 0 ? "important" : "advisory",
      title:
        stale > 0
          ? `Fix ${stale} stale valuation${stale === 1 ? "" : "s"}`
          : `Improve data confidence (${Math.round(confidence * 100)}%)`,
      detail: "Refresh estimates so net worth and recommendations stay trustworthy.",
      href: "/app/wealth/confidence",
    });
  }

  const profileScore = input.profileScore;
  if (profileScore != null && profileScore < 80) {
    candidates.push({
      id: "profile",
      kind: "profile",
      priority: "advisory",
      title: `Complete your profile · ${profileScore}%`,
      detail: input.profileSummary || "Close the next profile gap for better guidance.",
      href: "/app/profile",
    });
  }

  for (const [idx, action] of (input.actions ?? []).entries()) {
    if (/no material action|do nothing|do-nothing/i.test(action.title)) continue;
    candidates.push({
      id: `action-${action.actionType ?? idx}`,
      kind: "action",
      priority: "advisory",
      title: action.title,
      detail: action.what || action.why || "Review suitability and next step in Actions.",
      href: "/app/actions",
    });
  }

  const items = candidates.slice(0, MAX_STEPS);

  if (!items.length) {
    const doNothing: NextStep = {
      id: "do_nothing",
      kind: "do_nothing",
      priority: "advisory",
      title: "No urgent next step right now",
      detail: "Doing nothing can be the right call — review Actions when you want a second look.",
      href: "/app/actions",
    };
    return {
      items: [doNothing],
      count: 1,
      headline: doNothing.title,
      primaryHref: doNothing.href,
      summary: "Nothing critical needs attention; do-nothing remains valid.",
    };
  }

  return {
    items,
    count: items.length,
    headline: items[0]!.title,
    primaryHref: items[0]!.href,
    summary: `${items.length} next step${items.length === 1 ? "" : "s"} ranked for you.`,
  };
}

export function formatNextStepsAiContent(pulse: NextStepsPulse | null | undefined): string {
  if (!pulse?.items.length) {
    return "I do not see a ranked next-steps pulse yet. Open Home or Actions to review priorities — doing nothing can still be valid.";
  }
  const lines = pulse.items.map(
    (s, i) => `${i + 1}. ${s.title} — ${s.detail} Path: ${s.href}`,
  );
  return [
    "Here is what to do next from your live Home pulse (care and trust first, then product actions):",
    ...lines,
    "Suitability still applies before any product move; ops queues stay authoritative for complaints and privacy.",
  ].join("\n");
}
