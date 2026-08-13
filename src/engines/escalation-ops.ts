/**
 * Support / complaint escalation ops helpers (no fund movement).
 */

export type EscalationStatus = "open" | "in_progress" | "resolved" | "rejected";

export type EscalationCategory = "support" | "complaint" | "adviser" | "other";

export type CaseCareAckCue = {
  hasCareAck: boolean;
  lastCareAckAt: string | null;
  label: string;
  tone: "ok" | "warn";
};

/** Ops cue: whether an adviser already reassured this customer. */
export function buildCaseCareAckCue(input: {
  status: string;
  lastCareAckAt?: string | null;
}): CaseCareAckCue {
  const lastCareAckAt = input.lastCareAckAt ?? null;
  const open = input.status === "open" || input.status === "in_progress";
  if (lastCareAckAt) {
    return {
      hasCareAck: true,
      lastCareAckAt,
      label: "Care acked",
      tone: "ok",
    };
  }
  return {
    hasCareAck: false,
    lastCareAckAt: null,
    label: "No care ack",
    tone: open ? "warn" : "ok",
  };
}

export function classifyEscalationReason(reason: string): EscalationCategory {
  if (reason.startsWith("COMPLAINT:")) return "complaint";
  if (reason.startsWith("SUPPORT:")) return "support";
  return "other";
}

export function parseEscalationSummary(summary: string): {
  category?: string;
  reason?: string;
  resolution?: string;
  resolvedAt?: string;
  netWorth?: number;
  health?: number;
  raw: string;
} {
  try {
    const parsed = JSON.parse(summary || "{}") as Record<string, unknown>;
    if (parsed && typeof parsed === "object") {
      return {
        category: typeof parsed.category === "string" ? parsed.category : undefined,
        reason: typeof parsed.reason === "string" ? parsed.reason : undefined,
        resolution: typeof parsed.resolution === "string" ? parsed.resolution : undefined,
        resolvedAt: typeof parsed.resolvedAt === "string" ? parsed.resolvedAt : undefined,
        netWorth: typeof parsed.netWorth === "number" ? parsed.netWorth : undefined,
        health: typeof parsed.health === "number" ? parsed.health : undefined,
        raw: summary,
      };
    }
  } catch {
    /* plain text summary from older rows */
  }
  return { raw: summary };
}

export function mergeEscalationResolution(
  summary: string,
  resolution: string,
  status: EscalationStatus,
): string {
  const base = parseEscalationSummary(summary);
  const next = {
    category: base.category,
    reason: base.reason,
    netWorth: base.netWorth,
    health: base.health,
    resolution,
    resolvedAt:
      status === "resolved" || status === "rejected"
        ? new Date().toISOString()
        : base.resolvedAt,
    status,
  };
  // Preserve unknown keys from original JSON when possible
  try {
    const original = JSON.parse(summary || "{}") as Record<string, unknown>;
    return JSON.stringify({ ...original, ...next });
  } catch {
    return JSON.stringify({ ...next, legacySummary: summary });
  }
}

export function customerCaseTitle(category: EscalationCategory, status: EscalationStatus): string {
  if (category === "complaint") {
    return status === "resolved"
      ? "Complaint update"
      : status === "rejected"
        ? "Complaint closed"
        : "Complaint in progress";
  }
  return status === "resolved"
    ? "Support case update"
    : status === "rejected"
      ? "Support case closed"
      : "Support case in progress";
}

export const ESCALATION_STATUSES: EscalationStatus[] = [
  "open",
  "in_progress",
  "resolved",
  "rejected",
];
