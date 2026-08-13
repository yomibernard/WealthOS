/**
 * Daily ops board scoring — pure prioritisation for on-call review.
 */

export type OpsQueueId =
  | "escalations"
  | "complaints"
  | "privacy"
  | "change_requests"
  | "launch_gate"
  | "flag_risk"
  | "care_handoff";

export type OpsQueueInput = {
  openEscalations: number;
  openComplaints: number;
  openPrivacy: number;
  pendingChangeRequests: number;
  launchBlocked: boolean;
  launchBlockers: string[];
  riskyFlagsOn?: number;
  /** Customers with open care and no care_ack yet */
  unackedCareCustomers?: number;
};

export type OpsCareHandoffAck = {
  id: string;
  customerName: string;
  adviserName: string;
  title: string;
  createdAt: string;
};

export type OpsCareHandoff = {
  unackedCareCustomers: number;
  recentAckCount: number;
  summary: string;
  recentAcks: OpsCareHandoffAck[];
};

export type OpsQueueItem = {
  id: OpsQueueId;
  label: string;
  count: number;
  href: string;
  tone: "ok" | "warn" | "danger";
  detail: string;
};

export function buildOpsDailyBoard(input: OpsQueueInput): {
  attentionScore: number;
  summary: string;
  queues: OpsQueueItem[];
} {
  const queues: OpsQueueItem[] = [
    {
      id: "complaints",
      label: "Open complaints",
      count: input.openComplaints,
      href: "/admin/escalations",
      tone: input.openComplaints > 0 ? "danger" : "ok",
      detail:
        input.openComplaints > 0
          ? "Formal COMPLAINT: cases need a resolution note."
          : "No open formal complaints.",
    },
    {
      id: "escalations",
      label: "Open escalations",
      count: input.openEscalations,
      href: "/admin/escalations",
      tone: input.openEscalations > 0 ? "warn" : "ok",
      detail:
        input.openEscalations > 0
          ? "L2–L5 cases still open or in progress."
          : "Escalation queue clear.",
    },
    {
      id: "privacy",
      label: "Privacy requests",
      count: input.openPrivacy,
      href: "/admin/privacy",
      tone: input.openPrivacy > 0 ? "warn" : "ok",
      detail:
        input.openPrivacy > 0
          ? "Access / erasure / rectification still open."
          : "Privacy queue clear.",
    },
    {
      id: "change_requests",
      label: "Maker-checker pending",
      count: input.pendingChangeRequests,
      href: "/admin/change-requests",
      tone: input.pendingChangeRequests > 0 ? "warn" : "ok",
      detail:
        input.pendingChangeRequests > 0
          ? "High-risk config waiting on a second admin."
          : "No pending change requests.",
    },
    {
      id: "launch_gate",
      label: "Launch gate",
      count: input.launchBlocked ? input.launchBlockers.length || 1 : 0,
      href: "/admin/ops",
      tone: input.launchBlocked ? "danger" : "ok",
      detail: input.launchBlocked
        ? `Blockers: ${input.launchBlockers.join(", ") || "see launch checks"}.`
        : "Launch gate reports no blockers for this profile.",
    },
    {
      id: "flag_risk",
      label: "High-risk flags",
      count: input.riskyFlagsOn ?? 0,
      href: "/admin/flags",
      tone: (input.riskyFlagsOn ?? 0) > 0 ? "warn" : "ok",
      detail:
        (input.riskyFlagsOn ?? 0) > 0
          ? "Partner execution and/or LLM polish are on — confirm intended for this host."
          : "Partner execution and LLM polish are off (or unset as off).",
    },
    {
      id: "care_handoff",
      label: "Care handoff (unacked)",
      count: input.unackedCareCustomers ?? 0,
      href: "/adviser?care=unacked",
      tone: (input.unackedCareCustomers ?? 0) > 0 ? "warn" : "ok",
      detail:
        (input.unackedCareCustomers ?? 0) > 0
          ? "Open care without an adviser acknowledgment — check Care radar."
          : "Every open-care customer has at least one care acknowledgment.",
    },
  ];

  // Weighted attention: complaints & launch heavier than routine queues
  const attentionScore =
    input.openComplaints * 5 +
    (input.launchBlocked ? 4 : 0) +
    input.openEscalations * 2 +
    input.openPrivacy * 2 +
    input.pendingChangeRequests +
    (input.riskyFlagsOn ?? 0) +
    (input.unackedCareCustomers ?? 0);

  let summary: string;
  if (attentionScore === 0) {
    summary = "Queues look clear for today. Still spot-check /api/health and flags.";
  } else if (input.openComplaints > 0 || input.launchBlocked) {
    summary = "Priority: complaints and/or launch blockers before routine queues.";
  } else if ((input.unackedCareCustomers ?? 0) > 0 && input.openEscalations + input.openPrivacy === 0) {
    summary = "Care handoff gap — ask advisers to acknowledge open care items.";
  } else {
    summary = "Routine backlog — work escalations, privacy, then maker-checker.";
  }

  return { attentionScore, summary, queues };
}

export function buildOpsCareHandoff(input: {
  unackedCareCustomers: number;
  recentAcks: OpsCareHandoffAck[];
}): OpsCareHandoff {
  const recentAcks = input.recentAcks.slice(0, 5);
  let summary: string;
  if (input.unackedCareCustomers === 0 && recentAcks.length === 0) {
    summary = "No open care handoff gaps and no recent adviser acknowledgments.";
  } else if (input.unackedCareCustomers > 0) {
    summary = `${input.unackedCareCustomers} customer(s) still need a first care acknowledgment.`;
  } else {
    summary = `Care handoff clear — ${recentAcks.length} recent acknowledgment(s) on file.`;
  }
  return {
    unackedCareCustomers: input.unackedCareCustomers,
    recentAckCount: recentAcks.length,
    summary,
    recentAcks,
  };
}
