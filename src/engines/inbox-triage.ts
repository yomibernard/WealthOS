/**
 * Wealth Inbox triage — filter unread/status and category kinds.
 */

export type InboxTriageInput = {
  id: string;
  category: string;
  priority: string;
  title: string;
  body: string;
  href: string | null;
  status: string;
  createdAt: Date | string;
};

export type InboxKind =
  | "recommendation"
  | "connection"
  | "data_quality"
  | "estate"
  | "adviser"
  | "support"
  | "privacy"
  | "life_event"
  | "other";

export type InboxStatusFilter = "all" | "unread" | "read";

export type InboxPulse = {
  unreadCount: number;
  totalCount: number;
  headline: string | null;
  primaryHref: string;
};

export function classifyInboxKind(category: string): InboxKind {
  const c = category.trim().toLowerCase();
  if (c === "recommendation") return "recommendation";
  if (c === "connection") return "connection";
  if (c === "data_quality") return "data_quality";
  if (c === "estate") return "estate";
  if (c === "adviser") return "adviser";
  if (c === "privacy") return "privacy";
  if (c === "life_event") return "life_event";
  if (c === "complaint" || c === "escalation" || c === "support") return "support";
  return "other";
}

export function filterInboxItems<T extends InboxTriageInput>(
  items: T[],
  filters: {
    status?: InboxStatusFilter;
    kind?: InboxKind | "all";
  } = {},
): T[] {
  const status = filters.status ?? "all";
  const kind = filters.kind ?? "all";
  return items.filter((item) => {
    if (status === "unread" && item.status !== "unread") return false;
    if (status === "read" && item.status === "unread") return false;
    if (kind !== "all" && classifyInboxKind(item.category) !== kind) return false;
    return true;
  });
}

export function buildInboxPulse(items: InboxTriageInput[]): InboxPulse {
  const active = items.filter((i) => i.status !== "dismissed");
  const unread = active.filter((i) => i.status === "unread");
  const unreadCount = unread.length;
  if (unreadCount === 0) {
    return {
      unreadCount: 0,
      totalCount: active.length,
      headline: null,
      primaryHref: "/app/inbox",
    };
  }

  const latest = [...unread].sort((a, b) => {
    const aT = typeof a.createdAt === "string" ? a.createdAt : a.createdAt.toISOString();
    const bT = typeof b.createdAt === "string" ? b.createdAt : b.createdAt.toISOString();
    return bT.localeCompare(aT);
  })[0]!;

  const headline =
    unreadCount === 1 ? latest.title : `${unreadCount} unread inbox items`;

  return {
    unreadCount,
    totalCount: active.length,
    headline,
    primaryHref: "/app/inbox?status=unread",
  };
}

export function inboxKindLabel(kind: InboxKind): string {
  if (kind === "recommendation") return "Recommendations";
  if (kind === "connection") return "Connections";
  if (kind === "data_quality") return "Data quality";
  if (kind === "estate") return "Estate";
  if (kind === "adviser") return "Adviser";
  if (kind === "support") return "Support";
  if (kind === "privacy") return "Privacy";
  if (kind === "life_event") return "Life events";
  return "Other";
}
