/**
 * Customer-facing support / complaint case summary for Home CTAs.
 */

import { classifyEscalationReason, parseEscalationSummary } from "@/engines/escalation-ops";

export type CustomerCaseRow = {
  id: string;
  reason: string;
  status: string;
  category: ReturnType<typeof classifyEscalationReason>;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerCasesPulse = {
  openCount: number;
  complaintCount: number;
  recentlyResolvedCount: number;
  headline: string | null;
  primaryHref: string;
  items: CustomerCaseRow[];
};

export function buildCustomerCasesPulse(
  rows: Array<{
    id: string;
    reason: string;
    status: string;
    summary: string;
    createdAt: Date | string;
    updatedAt: Date | string;
  }>,
  now = new Date(),
): CustomerCasesPulse {
  const items: CustomerCaseRow[] = rows.map((r) => {
    const parsed = parseEscalationSummary(r.summary);
    return {
      id: r.id,
      reason: r.reason,
      status: r.status,
      category: classifyEscalationReason(r.reason),
      resolution: parsed.resolution ?? null,
      createdAt: typeof r.createdAt === "string" ? r.createdAt : r.createdAt.toISOString(),
      updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : r.updatedAt.toISOString(),
    };
  });

  const open = items.filter((i) => i.status === "open" || i.status === "in_progress");
  const complaintCount = open.filter((i) => i.category === "complaint").length;
  const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const recentlyResolved = items.filter(
    (i) =>
      (i.status === "resolved" || i.status === "rejected") &&
      new Date(i.updatedAt).getTime() >= weekAgo,
  );

  let headline: string | null = null;
  if (complaintCount > 0) {
    headline = `${complaintCount} open complaint${complaintCount === 1 ? "" : "s"} — view updates`;
  } else if (open.length > 0) {
    headline = `${open.length} open support case${open.length === 1 ? "" : "s"}`;
  } else if (recentlyResolved.length > 0) {
    headline = `${recentlyResolved.length} recent case update${recentlyResolved.length === 1 ? "" : "s"}`;
  }

  return {
    openCount: open.length,
    complaintCount,
    recentlyResolvedCount: recentlyResolved.length,
    headline,
    primaryHref: "/app/support",
    items: [...open, ...recentlyResolved].slice(0, 5),
  };
}
