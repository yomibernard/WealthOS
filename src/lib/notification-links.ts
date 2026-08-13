/**
 * Resolve in-product deep links for notifications (no schema href column required).
 */

export type NotificationLinkInput = {
  title?: string | null;
  body?: string | null;
  category?: string | null;
};

const RULES: Array<{ href: string; label: string; patterns: RegExp[] }> = [
  {
    href: "/app/support",
    label: "Open support",
    patterns: [
      /complaint/i,
      /support (case|request)/i,
      /support case/i,
      /\bcase is now\b/i,
      /escalation/i,
      /acknowledged your (complaint|support|escalation)/i,
      /care update · (complaint|support|escalation)/i,
    ],
  },
  {
    href: "/app/privacy",
    label: "Open privacy",
    patterns: [
      /privacy request/i,
      /\berasure\b/i,
      /data pack/i,
      /ndpr/i,
      /acknowledged your privacy/i,
      /care update · privacy/i,
    ],
  },
  {
    href: "/app/digest",
    label: "Open digest",
    patterns: [/weekly (wealth )?digest/i],
  },
  {
    href: "/app/reports",
    label: "Open report",
    patterns: [/monthly wealth report/i, /monthly report/i],
  },
  {
    href: "/app/inbox",
    label: "Open inbox",
    patterns: [
      /adviser nudge/i,
      /\bnudge\b/i,
      /your adviser asked/i,
      /shared with your adviser/i,
      /shared a briefing/i,
      /please refresh your wealth graph/i,
      /please complete your financial profile/i,
      /please generate your weekly digest/i,
    ],
  },
  {
    href: "/app/adviser-collab",
    label: "Adviser collab",
    patterns: [/adviser note/i, /collaboration/i],
  },
  {
    href: "/app/wealth/confidence",
    label: "Data confidence",
    patterns: [/data quality/i, /stale valuation/i, /fix data quality/i],
  },
  {
    href: "/app/plan/funding",
    label: "Goal funding",
    patterns: [/goal funding/i, /funding pulse/i, /contribution/i],
  },
  {
    href: "/app/profile",
    label: "Open profile",
    patterns: [/complete your profile/i, /profile completeness/i, /financial profile/i],
  },
  {
    href: "/app/actions",
    label: "Open actions",
    patterns: [/recommendation/i, /next best/i],
  },
];

/** Prefer an explicit Path: /app/... or /adviser/... line from WealthAI-style copy. */
export function extractPathFromBody(body: string | null | undefined): string | null {
  if (!body) return null;
  const m = body.match(/\bPath:\s*((?:\/app|\/adviser)\/[a-z0-9\-/_]+)/i);
  if (m?.[1]) return m[1];
  const bare = body.match(/(^|\s)((?:\/app|\/adviser)\/[a-z0-9\-/_]+)(\s|$)/i);
  return bare?.[2] ?? null;
}

export function resolveNotificationLink(input: NotificationLinkInput): {
  href: string;
  label: string;
} | null {
  const fromBody = extractPathFromBody(input.body);
  if (fromBody) {
    return { href: fromBody, label: "Open" };
  }

  const hay = `${input.title ?? ""}\n${input.body ?? ""}`;
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(hay))) {
      return { href: rule.href, label: rule.label };
    }
  }
  return null;
}
