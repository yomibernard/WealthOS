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
  seen: boolean;
  thanksPreview: string | null;
  seenAt: string | null;
};

export type CareAckHistory = {
  count: number;
  latestAt: string | null;
  unseenCount: number;
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
  const withoutReceipt = body
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter(
      (l) =>
        !/^this does not close/i.test(l) &&
        !/^item:/i.test(l) &&
        !/^---$/.test(l) &&
        !/^customer receipt/i.test(l),
    );
  const candidate = withoutReceipt[withoutReceipt.length - 1] ?? body.trim();
  return candidate.length > 160 ? `${candidate.slice(0, 157)}…` : candidate;
}

/** Parse optional customer thanks line appended after mark-as-seen. */
export function parseCareReceipt(body: string): {
  thanksPreview: string | null;
  seenAt: string | null;
} {
  const m = body.match(
    /Customer receipt \(seen ([^)]+)\)(?::\s*([\s\S]+))?$/m,
  );
  if (!m) return { thanksPreview: null, seenAt: null };
  const thanks = (m[2] ?? "").trim();
  return {
    seenAt: m[1] ?? null,
    thanksPreview: thanks
      ? thanks.length > 120
        ? `${thanks.slice(0, 117)}…`
        : thanks
      : null,
  };
}

export function appendCareReceipt(
  body: string,
  seenAt: string,
  thanks?: string | null,
): string {
  if (/Customer receipt \(seen /i.test(body)) return body;
  const note = (thanks ?? "").trim().slice(0, 200);
  const line = note
    ? `Customer receipt (seen ${seenAt}): ${note}`
    : `Customer receipt (seen ${seenAt}).`;
  return `${body.trim()}\n\n---\n${line}`;
}

export function isCareAckSeen(status?: string | null): boolean {
  return (status ?? "open").toLowerCase() === "seen";
}

export function buildCareAckHistory(
  notes: Array<{
    id: string;
    title: string;
    body: string;
    createdAt: Date | string;
    adviserName: string;
    status?: string | null;
  }>,
  limit = 5,
): CareAckHistory {
  const sorted = [...notes].sort((a, b) => {
    const aT = typeof a.createdAt === "string" ? a.createdAt : a.createdAt.toISOString();
    const bT = typeof b.createdAt === "string" ? b.createdAt : b.createdAt.toISOString();
    return bT.localeCompare(aT);
  });
  const items = sorted.slice(0, limit).map((n) => {
    const receipt = parseCareReceipt(n.body);
    const seen = isCareAckSeen(n.status) || Boolean(receipt.seenAt);
    return {
      id: n.id,
      title: n.title,
      preview: previewCareAckBody(n.body),
      adviserName: n.adviserName,
      createdAt:
        typeof n.createdAt === "string" ? n.createdAt : n.createdAt.toISOString(),
      seen,
      thanksPreview: receipt.thanksPreview,
      seenAt: receipt.seenAt,
    };
  });

  const latestAt = items[0]?.createdAt ?? null;
  const unseenCount = notes.filter(
    (n) => !isCareAckSeen(n.status) && !parseCareReceipt(n.body).seenAt,
  ).length;
  let summary: string;
  if (items.length === 0) {
    summary = "No care acknowledgments sent yet.";
  } else if (items.length === 1) {
    summary = `1 care acknowledgment on file (latest ${new Date(latestAt!).toLocaleDateString("en-GB")})${
      unseenCount ? " — awaiting customer receipt" : ""
    }.`;
  } else {
    summary = `${notes.length} care acknowledgment(s); showing the latest ${items.length}${
      unseenCount ? ` · ${unseenCount} unseen` : ""
    }.`;
  }

  return { count: notes.length, latestAt, unseenCount, summary, items };
}

export type CareUpdatePulseItem = {
  id: string;
  title: string;
  preview: string;
  adviserName: string;
  createdAt: string;
  href: string;
  seen: boolean;
  thanksPreview: string | null;
};

export type CareUpdatePulse = {
  count: number;
  headline: string | null;
  primaryHref: string;
  latestAt: string | null;
  items: CareUpdatePulseItem[];
};

function toPulseItem(
  n: {
    id?: string;
    title: string;
    body: string;
    createdAt: Date | string;
    adviserName: string;
    status?: string | null;
  },
  i: number,
): CareUpdatePulseItem {
  const createdAt =
    typeof n.createdAt === "string" ? n.createdAt : n.createdAt.toISOString();
  const privacy = /privacy/i.test(n.title);
  const receipt = parseCareReceipt(n.body);
  const seen = isCareAckSeen(n.status) || Boolean(receipt.seenAt);
  return {
    id: n.id ?? `care-${i}`,
    title: n.title,
    preview: previewCareAckBody(n.body),
    adviserName: n.adviserName,
    createdAt,
    href: privacy ? "/app/privacy" : "/app/support",
    seen,
    thanksPreview: receipt.thanksPreview,
  };
}

/** Customer Home CTA — recent *unseen* adviser care acknowledgments. */
export function buildCareUpdatePulse(
  notes: Array<{
    id?: string;
    title: string;
    body: string;
    createdAt: Date | string;
    adviserName: string;
    status?: string | null;
  }>,
  now = new Date(),
  windowDays = 14,
): CareUpdatePulse {
  const cutoff = now.getTime() - windowDays * 86_400_000;
  const recent = notes
    .map((n, i) => toPulseItem(n, i))
    .filter((n) => new Date(n.createdAt).getTime() >= cutoff)
    .filter((n) => !n.seen)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (recent.length === 0) {
    return {
      count: 0,
      headline: null,
      primaryHref: "/app/inbox",
      latestAt: null,
      items: [],
    };
  }

  const latest = recent[0]!;
  const headline =
    recent.length === 1
      ? `${latest.adviserName} sent a care update`
      : `${recent.length} recent care updates from your adviser`;

  return {
    count: recent.length,
    headline,
    primaryHref: latest.href,
    latestAt: latest.createdAt,
    items: recent,
  };
}

/** Support/Privacy list — recent acks including seen receipts. */
export function buildCareUpdateList(
  notes: Array<{
    id?: string;
    title: string;
    body: string;
    createdAt: Date | string;
    adviserName: string;
    status?: string | null;
  }>,
  now = new Date(),
  windowDays = 14,
): CareUpdatePulse {
  const cutoff = now.getTime() - windowDays * 86_400_000;
  const recent = notes
    .map((n, i) => toPulseItem(n, i))
    .filter((n) => new Date(n.createdAt).getTime() >= cutoff)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (recent.length === 0) {
    return {
      count: 0,
      headline: null,
      primaryHref: "/app/inbox",
      latestAt: null,
      items: [],
    };
  }

  const unseen = recent.filter((n) => !n.seen);
  const latest = (unseen[0] ?? recent[0])!;
  const headline =
    unseen.length === 1
      ? `${latest.adviserName} sent a care update`
      : unseen.length > 1
        ? `${unseen.length} unseen care updates from your adviser`
        : `${recent.length} recent care update(s)`;

  return {
    count: recent.length,
    headline,
    primaryHref: latest.href,
    latestAt: latest.createdAt,
    items: recent,
  };
}

/** WealthAI grounded copy for care-update questions (ops still authoritative). */
export function formatCareUpdateAiContent(pulse?: CareUpdatePulse | null): string {
  const base = [
    "When your adviser acknowledges an open care item, WealthOS shows a calm care update on Home and lists it on Support or Privacy Centre.",
    "You can mark a care update as seen (optional thanks) — that receipt does not close the ops queue.",
    "Admin resolution still applies where needed.",
  ];

  if (pulse && pulse.count > 0 && pulse.headline) {
    const latest = pulse.items[0];
    return [
      `You have ${pulse.count} unseen care update(s): ${pulse.headline}.`,
      latest?.preview ? `Latest note: ${latest.preview}` : null,
      ...base,
      `Open ${pulse.primaryHref} to read details and mark as seen.`,
      "Paths: /app · /app/support · /app/privacy",
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    ...base,
    "I do not see an unseen care acknowledgment in the last 14 days — check Support or Privacy for ones you already marked as seen, or ask your adviser from the Care desk.",
    "Paths: /app · /app/support · /app/privacy · /app/inbox",
  ].join(" ");
}
