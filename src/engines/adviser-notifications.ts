/**
 * Adviser notification centre — pulse + triage for care receipts and customer shares.
 */

export type AdviserNotificationInput = {
  id: string;
  category: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date | string;
};

export type AdviserNotificationKind = "care_receipt" | "share" | "other";

export type AdviserNotificationReadFilter = "all" | "unread" | "read";

export type AdviserNotificationPulse = {
  unreadCount: number;
  totalCount: number;
  headline: string | null;
  primaryHref: string;
};

export function classifyAdviserNotificationKind(note: {
  title: string;
  body: string;
}): AdviserNotificationKind {
  if (
    /marked your care update as seen/i.test(note.title) ||
    /sent a care receipt/i.test(note.body)
  ) {
    return "care_receipt";
  }
  if (
    /^Customer shared/i.test(note.title) ||
    /shared a briefing/i.test(note.body)
  ) {
    return "share";
  }
  return "other";
}

export function filterAdviserNotifications<T extends AdviserNotificationInput>(
  notes: T[],
  filters: {
    read?: AdviserNotificationReadFilter;
    kind?: AdviserNotificationKind | "all";
  } = {},
): T[] {
  const read = filters.read ?? "all";
  const kind = filters.kind ?? "all";
  return notes.filter((n) => {
    if (read === "unread" && n.read) return false;
    if (read === "read" && !n.read) return false;
    if (kind !== "all" && classifyAdviserNotificationKind(n) !== kind) return false;
    return true;
  });
}

export function buildAdviserNotificationPulse(
  notes: AdviserNotificationInput[],
): AdviserNotificationPulse {
  const unread = notes.filter((n) => !n.read);
  const unreadCount = unread.length;
  if (unreadCount === 0) {
    return {
      unreadCount: 0,
      totalCount: notes.length,
      headline: null,
      primaryHref: "/adviser/notifications",
    };
  }

  const latest = [...unread].sort((a, b) => {
    const aT = typeof a.createdAt === "string" ? a.createdAt : a.createdAt.toISOString();
    const bT = typeof b.createdAt === "string" ? b.createdAt : b.createdAt.toISOString();
    return bT.localeCompare(aT);
  })[0]!;

  const headline =
    unreadCount === 1
      ? latest.title
      : `${unreadCount} unread adviser notifications`;

  return {
    unreadCount,
    totalCount: notes.length,
    headline,
    primaryHref: "/adviser/notifications?read=unread",
  };
}

export function adviserNotificationLinkLabel(href: string): string {
  if (/^\/adviser\/customers\//i.test(href)) return "Open Care desk";
  if (/^\/adviser/i.test(href)) return "Open adviser portal";
  return "Open";
}

export function adviserNotificationKindLabel(kind: AdviserNotificationKind): string {
  if (kind === "care_receipt") return "Care receipt";
  if (kind === "share") return "Share";
  return "Other";
}
