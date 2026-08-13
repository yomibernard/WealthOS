/**
 * Adviser notification centre — pulse for care receipts and customer shares.
 */

export type AdviserNotificationInput = {
  id: string;
  category: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date | string;
};

export type AdviserNotificationPulse = {
  unreadCount: number;
  totalCount: number;
  headline: string | null;
  primaryHref: string;
};

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
    primaryHref: "/adviser/notifications",
  };
}

export function adviserNotificationLinkLabel(href: string): string {
  if (/^\/adviser\/customers\//i.test(href)) return "Open Care desk";
  if (/^\/adviser/i.test(href)) return "Open adviser portal";
  return "Open";
}
