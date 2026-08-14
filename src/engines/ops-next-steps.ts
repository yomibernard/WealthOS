/**
 * Admin/ops next-steps — ranked deep links for the daily ops board.
 * Wraps ops-daily counts; does not invent case detail.
 */

export type OpsNextStepKind =
  | "complaints"
  | "escalations"
  | "privacy"
  | "launch_gate"
  | "care_handoff"
  | "awaiting"
  | "change_requests"
  | "flag_risk"
  | "do_nothing";

export type OpsNextStepPriority = "critical" | "important" | "advisory";

export type OpsNextStep = {
  id: string;
  kind: OpsNextStepKind;
  priority: OpsNextStepPriority;
  title: string;
  detail: string;
  href: string;
};

export type OpsNextStepsPulse = {
  items: OpsNextStep[];
  count: number;
  headline: string | null;
  primaryHref: string;
  summary: string;
};

export type OpsNextStepsInput = {
  openComplaints?: number;
  openEscalations?: number;
  openPrivacy?: number;
  pendingChangeRequests?: number;
  launchBlocked?: boolean;
  launchBlockers?: string[];
  riskyFlagsOn?: number;
  unackedCareCustomers?: number;
  awaitingReceiptCount?: number;
};

const MAX_STEPS = 3;

export function buildOpsNextStepsPulse(input: OpsNextStepsInput): OpsNextStepsPulse {
  const candidates: OpsNextStep[] = [];

  const complaints = input.openComplaints ?? 0;
  if (complaints > 0) {
    candidates.push({
      id: "complaints",
      kind: "complaints",
      priority: "critical",
      title: `${complaints} open complaint${complaints === 1 ? "" : "s"}`,
      detail: "Formal COMPLAINT cases need a resolution note before routine queues.",
      href: "/admin/escalations",
    });
  }

  const escalations = input.openEscalations ?? 0;
  if (escalations > 0) {
    candidates.push({
      id: "escalations",
      kind: "escalations",
      priority: "critical",
      title: `${escalations} open escalation${escalations === 1 ? "" : "s"}`,
      detail: "L2–L5 cases still open or in progress.",
      href: "/admin/escalations",
    });
  }

  if (input.launchBlocked) {
    const blockers = input.launchBlockers ?? [];
    candidates.push({
      id: "launch_gate",
      kind: "launch_gate",
      priority: "critical",
      title: "Launch gate blocked",
      detail: blockers.length
        ? `Blockers: ${blockers.join(", ")}.`
        : "See launch checks on the ops board.",
      href: "/admin/ops",
    });
  }

  const privacy = input.openPrivacy ?? 0;
  if (privacy > 0) {
    candidates.push({
      id: "privacy",
      kind: "privacy",
      priority: "important",
      title: `${privacy} open privacy request${privacy === 1 ? "" : "s"}`,
      detail: "Access / erasure / rectification still open — queue stays authoritative.",
      href: "/admin/privacy",
    });
  }

  const unacked = input.unackedCareCustomers ?? 0;
  if (unacked > 0) {
    candidates.push({
      id: "care_handoff",
      kind: "care_handoff",
      priority: "important",
      title: `${unacked} care handoff gap${unacked === 1 ? "" : "s"} (unacked)`,
      detail: "Open care without an adviser acknowledgment — check Care radar.",
      href: "/adviser?care=unacked",
    });
  }

  const awaiting = input.awaitingReceiptCount ?? 0;
  if (awaiting > 0) {
    candidates.push({
      id: "awaiting",
      kind: "awaiting",
      priority: "important",
      title: `${awaiting} care ack${awaiting === 1 ? "" : "s"} awaiting receipt`,
      detail: "Customer has not marked the care update as seen yet.",
      href: "/adviser?care=awaiting",
    });
  }

  const pending = input.pendingChangeRequests ?? 0;
  if (pending > 0) {
    candidates.push({
      id: "change_requests",
      kind: "change_requests",
      priority: "important",
      title: `${pending} maker-checker pending`,
      detail: "High-risk config waiting on a second admin.",
      href: "/admin/change-requests",
    });
  }

  const risky = input.riskyFlagsOn ?? 0;
  if (risky > 0) {
    candidates.push({
      id: "flag_risk",
      kind: "flag_risk",
      priority: "advisory",
      title: `${risky} high-risk flag${risky === 1 ? "" : "s"} on`,
      detail: "Partner execution and/or LLM polish are on — confirm intended for this host.",
      href: "/admin/flags",
    });
  }

  const items = candidates.slice(0, MAX_STEPS);

  if (!items.length) {
    const clear: OpsNextStep = {
      id: "do_nothing",
      kind: "do_nothing",
      priority: "advisory",
      title: "Ops queues look quiet — no urgent next step",
      detail: "Still spot-check /api/health and flags when something new lands.",
      href: "/admin/ops",
    };
    return {
      items: [clear],
      count: 1,
      headline: clear.title,
      primaryHref: clear.href,
      summary: "Nothing critical on the ops board; keep care handoff visible when load returns.",
    };
  }

  return {
    items,
    count: items.length,
    headline: items[0]!.title,
    primaryHref: items[0]!.href,
    summary: `${items.length} next step${items.length === 1 ? "" : "s"} for ops today.`,
  };
}

export function formatOpsNextStepsAiContent(
  pulse: OpsNextStepsPulse | null | undefined,
): string {
  if (!pulse?.items.length) {
    return "I do not see a ranked ops next-steps pulse yet. Open the daily board on /admin/ops — doing nothing can still be valid when queues are quiet.";
  }
  const lines = pulse.items.map(
    (s, i) => `${i + 1}. ${s.title} — ${s.detail} Path: ${s.href}`,
  );
  return [
    "Here is what to do next for ops from the live daily board pulse (complaints and launch blockers first):",
    ...lines,
    "Admin queues stay authoritative; care acks and receipts never close escalation or privacy queues.",
  ].join("\n");
}

export function wantsOpsNextSteps(message: string): boolean {
  const m = message.toLowerCase();
  return /what should i do|next (step|best)|priority|ops (board|queue|next)|for ops|daily ops|needs (my|your) attention|launch gate|care handoff/.test(
    m,
  );
}
