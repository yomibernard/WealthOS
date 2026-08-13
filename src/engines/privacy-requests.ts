/**
 * Customer privacy-request pulse + inbox drafts (NDPR-oriented).
 */

import { buildCaseCareAckCue, type CaseCareAckCue } from "@/engines/escalation-ops";

export type PrivacyRequestStatus = "open" | "in_progress" | "completed" | "rejected";

export type PrivacyAdminCareView = {
  careAck: CaseCareAckCue;
};

/** Admin privacy queue helper — same care-ack cue shape as escalations. */
export function buildPrivacyAdminCareView(input: {
  status: string;
  lastCareAckAt?: string | null;
}): PrivacyAdminCareView {
  return { careAck: buildCaseCareAckCue(input) };
}

export type PrivacyInboxDraft = {
  category: string;
  priority: string;
  title: string;
  body: string;
  href: string;
  sourceType: string;
  sourceId: string;
};

export type PrivacyRequestsPulse = {
  openCount: number;
  erasureOpen: boolean;
  recentlyClosedCount: number;
  headline: string | null;
  primaryHref: string;
};

export function buildPrivacyInboxDraft(input: {
  id: string;
  type: string;
  status: string;
  resolution?: string | null;
  details?: string | null;
}): PrivacyInboxDraft {
  const open = input.status === "open" || input.status === "in_progress";
  const erasure = input.type === "erasure";

  let title: string;
  if (open && erasure) title = "Erasure request in progress";
  else if (open) title = `Privacy ${input.type} request open`;
  else if (input.status === "completed") title = `Privacy ${input.type} completed`;
  else title = `Privacy ${input.type} closed`;

  const bodyParts = [`Your ${input.type} request is ${input.status}.`];
  if (input.resolution) bodyParts.push(input.resolution);
  else if (input.details) bodyParts.push(input.details);
  else bodyParts.push("Track status in Privacy Centre. Password hashes are never exported.");

  return {
    category: "privacy",
    priority: erasure || open ? "important" : "informational",
    title,
    body: bodyParts.join(" "),
    href: "/app/privacy",
    sourceType: "privacy_request",
    sourceId: open ? input.id : `${input.id}:${input.status}`,
  };
}

export function buildPrivacyRequestsPulse(
  rows: Array<{
    id: string;
    type: string;
    status: string;
    updatedAt: Date | string;
  }>,
  now = new Date(),
): PrivacyRequestsPulse {
  const open = rows.filter((r) => r.status === "open" || r.status === "in_progress");
  const erasureOpen = open.some((r) => r.type === "erasure");
  const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const recentlyClosed = rows.filter(
    (r) =>
      (r.status === "completed" || r.status === "rejected") &&
      new Date(r.updatedAt).getTime() >= weekAgo,
  );

  let headline: string | null = null;
  if (erasureOpen) headline = "Erasure request open — review Privacy Centre";
  else if (open.length > 0)
    headline = `${open.length} open privacy request${open.length === 1 ? "" : "s"}`;
  else if (recentlyClosed.length > 0)
    headline = `${recentlyClosed.length} recent privacy update${recentlyClosed.length === 1 ? "" : "s"}`;

  return {
    openCount: open.length,
    erasureOpen,
    recentlyClosedCount: recentlyClosed.length,
    headline,
    primaryHref: "/app/privacy",
  };
}
