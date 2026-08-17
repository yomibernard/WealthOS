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

export type OpsCareHandoffReceipt = {
  id: string;
  customerName: string;
  adviserName: string;
  title: string;
  seenAt: string;
  thanksPreview: string | null;
};

export type OpsCareHandoffRemind = {
  id: string;
  customerName: string;
  customerId?: string;
  adminName: string;
  createdAt: string;
  notificationCreated: boolean;
  /** True when no matching recent remind-answer for this customer */
  awaitingAnswer?: boolean;
  /** Whole hours since remind was sent */
  ageHours?: number;
  /** Awaiting answer for 24h+ */
  stale?: boolean;
};

export type OpsCareHandoffRemindAnswer = {
  id: string;
  customerName: string;
  adviserName: string;
  answeredAt: string;
};

export type OpsCareHandoff = {
  unackedCareCustomers: number;
  awaitingReceiptCount: number;
  recentAckCount: number;
  recentReceiptCount: number;
  recentRemindCount: number;
  recentRemindAnswerCount: number;
  summary: string;
  recentAcks: OpsCareHandoffAck[];
  recentReceipts: OpsCareHandoffReceipt[];
  recentReminds: OpsCareHandoffRemind[];
  recentRemindAnswers: OpsCareHandoffRemindAnswer[];
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
      href: "/admin/escalations",
      tone: (input.unackedCareCustomers ?? 0) > 0 ? "warn" : "ok",
      detail:
        (input.unackedCareCustomers ?? 0) > 0
          ? "Open care without an adviser acknowledgment — Remind adviser on the queue."
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
  awaitingReceiptCount?: number;
  recentAcks: OpsCareHandoffAck[];
  recentReceipts?: OpsCareHandoffReceipt[];
  recentReminds?: OpsCareHandoffRemind[];
  recentRemindAnswers?: OpsCareHandoffRemindAnswer[];
  now?: Date;
}): OpsCareHandoff {
  const recentAcks = input.recentAcks.slice(0, 5);
  const recentReceipts = (input.recentReceipts ?? []).slice(0, 5);
  const recentRemindAnswers = (input.recentRemindAnswers ?? []).slice(0, 5);
  const nowMs = (input.now ?? new Date()).getTime();
  const answeredNames = new Set(
    recentRemindAnswers.map((a) => a.customerName.trim().toLowerCase()).filter(Boolean),
  );
  const recentReminds = (input.recentReminds ?? []).slice(0, 5).map((r) => {
    const ageHours = Math.max(
      0,
      Math.floor((nowMs - Date.parse(r.createdAt)) / (60 * 60 * 1000)),
    );
    const awaitingAnswer = !answeredNames.has(r.customerName.trim().toLowerCase());
    return {
      ...r,
      ageHours,
      awaitingAnswer,
      stale: awaitingAnswer && ageHours >= 24,
    };
  });
  const awaitingReceiptCount = input.awaitingReceiptCount ?? 0;
  const staleReminds = recentReminds.filter((r) => r.stale).length;
  const awaitingAnswerCount = recentReminds.filter((r) => r.awaitingAnswer).length;
  let summary: string;
  if (
    input.unackedCareCustomers === 0 &&
    awaitingReceiptCount === 0 &&
    recentAcks.length === 0 &&
    recentReceipts.length === 0 &&
    recentReminds.length === 0 &&
    recentRemindAnswers.length === 0
  ) {
    summary = "No open care handoff gaps and no recent adviser acknowledgments.";
  } else if (input.unackedCareCustomers > 0) {
    summary = `${input.unackedCareCustomers} customer(s) still need a first care acknowledgment.`;
    if (recentReminds.length > 0) {
      summary += ` ${recentReminds.length} recent ops remind(s) sent.`;
    }
    if (staleReminds > 0) {
      summary += ` ${staleReminds} remind(s) still awaiting adviser answer (24h+).`;
    } else if (awaitingAnswerCount > 0) {
      summary += ` ${awaitingAnswerCount} remind(s) awaiting adviser answer.`;
    }
  } else if (awaitingReceiptCount > 0) {
    summary = `${awaitingReceiptCount} care acknowledgment(s) awaiting a customer receipt (seen).`;
  } else if (staleReminds > 0) {
    summary = `${staleReminds} ops remind(s) still awaiting adviser answer (24h+) — queues stay open.`;
  } else if (recentRemindAnswers.length > 0) {
    summary = `Care handoff clear — ${recentRemindAnswers.length} recent remind answer(s).`;
  } else if (recentReminds.length > 0) {
    summary = `${recentReminds.length} recent ops remind(s) sent — awaiting adviser care acknowledgment.`;
  } else if (recentReceipts.length > 0) {
    summary = `Care handoff clear — ${recentReceipts.length} recent customer receipt(s).`;
  } else {
    summary = `Care handoff clear — ${recentAcks.length} recent acknowledgment(s) on file.`;
  }
  return {
    unackedCareCustomers: input.unackedCareCustomers,
    awaitingReceiptCount,
    recentAckCount: recentAcks.length,
    recentReceiptCount: recentReceipts.length,
    recentRemindCount: recentReminds.length,
    recentRemindAnswerCount: recentRemindAnswers.length,
    summary,
    recentAcks,
    recentReceipts,
    recentReminds,
    recentRemindAnswers,
  };
}
