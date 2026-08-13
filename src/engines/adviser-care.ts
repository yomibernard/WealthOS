/**
 * Adviser care desk — open support/complaints and privacy requests for 360 review.
 * Human collaboration only; no fund movement.
 */

import { classifyEscalationReason, parseEscalationSummary } from "@/engines/escalation-ops";

export type CareDeskItem = {
  id: string;
  kind: "complaint" | "support" | "escalation" | "privacy";
  title: string;
  detail: string;
  status: string;
  priority: "critical" | "important" | "advisory";
  updatedAt: string;
};

export type CareDesk = {
  openCount: number;
  complaintCount: number;
  privacyCount: number;
  summary: string;
  items: CareDeskItem[];
};

export function buildAdviserCareDesk(input: {
  escalations: Array<{
    id: string;
    reason: string;
    status: string;
    summary: string;
    updatedAt: Date | string;
  }>;
  privacyRequests: Array<{
    id: string;
    type: string;
    status: string;
    details: string | null;
    resolution: string | null;
    updatedAt: Date | string;
  }>;
}): CareDesk {
  const items: CareDeskItem[] = [];

  for (const e of input.escalations) {
    const category = classifyEscalationReason(e.reason);
    const parsed = parseEscalationSummary(e.summary);
    const kind =
      category === "complaint" ? "complaint" : category === "support" ? "support" : "escalation";
    items.push({
      id: e.id,
      kind,
      title:
        kind === "complaint"
          ? "Open complaint"
          : kind === "support"
            ? "Open support case"
            : "Open escalation",
      detail: parsed.resolution
        ? `${e.reason} · Note: ${parsed.resolution}`
        : e.reason,
      status: e.status,
      priority: kind === "complaint" ? "critical" : "important",
      updatedAt:
        typeof e.updatedAt === "string" ? e.updatedAt : e.updatedAt.toISOString(),
    });
  }

  for (const p of input.privacyRequests) {
    items.push({
      id: p.id,
      kind: "privacy",
      title:
        p.type === "erasure" ? "Open erasure request" : `Open privacy ${p.type} request`,
      detail: p.resolution || p.details || `${p.type} request is ${p.status}.`,
      status: p.status,
      priority: p.type === "erasure" ? "critical" : "important",
      updatedAt:
        typeof p.updatedAt === "string" ? p.updatedAt : p.updatedAt.toISOString(),
    });
  }

  const rank = { critical: 0, important: 1, advisory: 2 };
  items.sort(
    (a, b) =>
      rank[a.priority] - rank[b.priority] ||
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const complaintCount = items.filter((i) => i.kind === "complaint").length;
  const privacyCount = items.filter((i) => i.kind === "privacy").length;

  let summary: string;
  if (items.length === 0) {
    summary = "No open support, complaint, or privacy requests.";
  } else if (complaintCount > 0 || items.some((i) => i.title.includes("erasure"))) {
    summary = "Care first — open complaints or erasure requests before product talk.";
  } else {
    summary = `${items.length} open care item(s) — acknowledge before recommending products.`;
  }

  return {
    openCount: items.length,
    complaintCount,
    privacyCount,
    summary,
    items: items.slice(0, 12),
  };
}
