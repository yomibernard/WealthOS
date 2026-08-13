/**
 * Adviser care acknowledgment — human reassurance, does not close ops cases.
 */

export type CareAckKind = "complaint" | "support" | "escalation" | "privacy";

export type CareAckDraft = {
  title: string;
  noteBody: string;
  notificationBody: string;
  href: string;
  inboxTitle: string;
};

export type CareAckHistoryItem = {
  id: string;
  title: string;
  preview: string;
  adviserName: string;
  createdAt: string;
};

export type CareAckHistory = {
  count: number;
  latestAt: string | null;
  summary: string;
  items: CareAckHistoryItem[];
};

export function buildCareAckDraft(input: {
  kind: CareAckKind;
  customerName: string;
  adviserName: string;
  message: string;
  itemTitle?: string;
}): CareAckDraft {
  const msg = input.message.trim();
  const topic =
    input.kind === "complaint"
      ? "complaint"
      : input.kind === "privacy"
        ? "privacy request"
        : input.kind === "support"
          ? "support case"
          : "escalation";

  const href = input.kind === "privacy" ? "/app/privacy" : "/app/support";

  return {
    title: `Adviser acknowledged your ${topic}`,
    noteBody: [
      `${input.adviserName} acknowledged an open ${topic} for ${input.customerName}.`,
      input.itemTitle ? `Item: ${input.itemTitle}` : null,
      msg,
      "This does not close the ops queue — admin resolution still applies where needed.",
    ]
      .filter(Boolean)
      .join("\n\n"),
    notificationBody: `${input.adviserName}: ${msg}`,
    href,
    inboxTitle: `Care update · ${topic}`,
  };
}

function previewCareAckBody(body: string): string {
  const lines = body
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^this does not close/i.test(l) && !/^item:/i.test(l));
  // Prefer the adviser's message line (usually last substantive line before the disclaimer).
  const candidate = lines[lines.length - 1] ?? body.trim();
  return candidate.length > 160 ? `${candidate.slice(0, 157)}…` : candidate;
}

export function buildCareAckHistory(
  notes: Array<{
    id: string;
    title: string;
    body: string;
    createdAt: Date | string;
    adviserName: string;
  }>,
  limit = 5,
): CareAckHistory {
  const sorted = [...notes].sort((a, b) => {
    const aT = typeof a.createdAt === "string" ? a.createdAt : a.createdAt.toISOString();
    const bT = typeof b.createdAt === "string" ? b.createdAt : b.createdAt.toISOString();
    return bT.localeCompare(aT);
  });
  const items = sorted.slice(0, limit).map((n) => ({
    id: n.id,
    title: n.title,
    preview: previewCareAckBody(n.body),
    adviserName: n.adviserName,
    createdAt:
      typeof n.createdAt === "string" ? n.createdAt : n.createdAt.toISOString(),
  }));

  const latestAt = items[0]?.createdAt ?? null;
  let summary: string;
  if (items.length === 0) {
    summary = "No care acknowledgments sent yet.";
  } else if (items.length === 1) {
    summary = `1 care acknowledgment on file (latest ${new Date(latestAt!).toLocaleDateString("en-GB")}).`;
  } else {
    summary = `${notes.length} care acknowledgment(s); showing the latest ${items.length}.`;
  }

  return { count: notes.length, latestAt, summary, items };
}
