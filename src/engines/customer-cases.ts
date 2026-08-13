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

export type CaseInboxDraft = {
  category: string;
  priority: string;
  title: string;
  body: string;
  href: string;
  sourceType: string;
  sourceId: string;
};

/** Inbox card for a support/complaint/adviser escalation (deep-links to Support). */
export function buildCaseInboxDraft(input: {
  id: string;
  reason: string;
  status: string;
  resolution?: string | null;
}): CaseInboxDraft {
  const category = classifyEscalationReason(input.reason);
  const isComplaint = category === "complaint";
  const open = input.status === "open" || input.status === "in_progress";

  let title: string;
  if (open && isComplaint) title = "Open complaint";
  else if (open && category === "support") title = "Open support case";
  else if (open) title = "Open human escalation";
  else if (input.status === "resolved") title = isComplaint ? "Complaint resolved" : "Support case resolved";
  else title = isComplaint ? "Complaint closed" : "Support case closed";

  const bodyParts = [input.reason];
  if (input.resolution) bodyParts.push(`Update: ${input.resolution}`);
  else if (open) bodyParts.push("Track progress and replies in Support & complaints.");

  return {
    category: isComplaint ? "complaint" : "escalation",
    priority: isComplaint || open ? "important" : "informational",
    title,
    body: bodyParts.join(" "),
    href: "/app/support",
    sourceType: "escalation",
    // Open cards share a stable id for refresh upserts; closed cards get a status suffix.
    sourceId: open ? input.id : `${input.id}:${input.status}`,
  };
}

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
