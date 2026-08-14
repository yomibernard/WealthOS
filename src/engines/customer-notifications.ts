/**
 * Customer notification centre — pulse + triage for care, support, privacy, cadence.
 */

export type CustomerNotificationInput = {
  id: string;
  category: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date | string;
};

export type CustomerNotificationKind =
  | "care_update"
  | "support"
  | "privacy"
  | "cadence"
  | "other";

export type CustomerNotificationReadFilter = "all" | "unread" | "read";

export type CustomerNotificationPulse = {
  unreadCount: number;
  totalCount: number;
  headline: string | null;
  primaryHref: string;
};

export function classifyCustomerNotificationKind(note: {
  title: string;
  body: string;
}): CustomerNotificationKind {
  const hay = `${note.title}\n${note.body}`;
  if (
    /adviser acknowledged/i.test(hay) ||
    /care update/i.test(hay) ||
    /acknowledged your (complaint|support|escalation|privacy)/i.test(hay)
  ) {
    return "care_update";
  }
  if (
    /privacy request/i.test(hay) ||
    /\berasure\b/i.test(hay) ||
    /\bndpr\b/i.test(hay) ||
    /data pack/i.test(hay)
  ) {
    return "privacy";
  }
  if (
    /complaint/i.test(hay) ||
    /support (case|request)/i.test(hay) ||
    /\bescalation\b/i.test(hay) ||
    /\bcase is now\b/i.test(hay)
  ) {
    return "support";
  }
  if (
    /weekly (wealth )?digest/i.test(hay) ||
    /monthly wealth report/i.test(hay) ||
    /monthly report/i.test(hay)
  ) {
    return "cadence";
  }
  return "other";
}

export function filterCustomerNotifications<T extends CustomerNotificationInput>(
  notes: T[],
  filters: {
    read?: CustomerNotificationReadFilter;
    kind?: CustomerNotificationKind | "all";
  } = {},
): T[] {
  const read = filters.read ?? "all";
  const kind = filters.kind ?? "all";
  return notes.filter((n) => {
    if (read === "unread" && n.read) return false;
    if (read === "read" && !n.read) return false;
    if (kind !== "all" && classifyCustomerNotificationKind(n) !== kind) return false;
    return true;
  });
}

export function buildCustomerNotificationPulse(
  notes: CustomerNotificationInput[],
): CustomerNotificationPulse {
  const unread = notes.filter((n) => !n.read);
  const unreadCount = unread.length;
  if (unreadCount === 0) {
    return {
      unreadCount: 0,
      totalCount: notes.length,
      headline: null,
      primaryHref: "/app/notifications",
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
      : `${unreadCount} unread notifications`;

  return {
    unreadCount,
    totalCount: notes.length,
    headline,
    primaryHref: "/app/notifications?read=unread",
  };
}

export function customerNotificationKindLabel(kind: CustomerNotificationKind): string {
  if (kind === "care_update") return "Care";
  if (kind === "support") return "Support";
  if (kind === "privacy") return "Privacy";
  if (kind === "cadence") return "Cadence";
  return "Other";
}
