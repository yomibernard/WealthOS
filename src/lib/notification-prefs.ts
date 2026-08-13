/**
 * Notification preference policy — critical cannot be disabled.
 */

export type NotificationPrefs = {
  critical: boolean;
  important: boolean;
  advisory: boolean;
  informational: boolean;
};

export type NotificationCategory =
  | "critical"
  | "important"
  | "advisory"
  | "informational";

export function normalizeCategory(raw: string): NotificationCategory {
  const c = raw.trim().toLowerCase();
  if (c === "critical") return "critical";
  if (c === "important") return "important";
  if (c === "advisory") return "advisory";
  return "informational";
}

export function displayCategory(raw: string): string {
  const n = normalizeCategory(raw);
  return n.charAt(0).toUpperCase() + n.slice(1);
}

/** Whether a notification in this category should be created/shown. Critical always true. */
export function canDeliver(
  prefs: NotificationPrefs | null | undefined,
  category: string,
): boolean {
  const n = normalizeCategory(category);
  if (n === "critical") return true;
  if (!prefs) return true;
  return Boolean(prefs[n]);
}

export const CHANNEL_COPY: Array<{
  key: keyof NotificationPrefs;
  label: string;
  detail: string;
  locked?: boolean;
}> = [
  {
    key: "critical",
    label: "Critical",
    detail: "Security and account integrity alerts. Always on.",
    locked: true,
  },
  {
    key: "important",
    label: "Important",
    detail: "Adviser nudges, shared plan actions, liquidity/concentration alerts.",
  },
  {
    key: "advisory",
    label: "Advisory",
    detail: "Plan tips, funding suggestions, and softer coaching prompts.",
  },
  {
    key: "informational",
    label: "Informational",
    detail: "Monthly wealth reports, weekly digests, and market/context summaries.",
  },
];
