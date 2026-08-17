/**
 * Admin audit export shaping — filter, categorise, redact credential-like keys.
 */

export type AuditCategory =
  | "auth"
  | "privacy"
  | "escalation"
  | "consent"
  | "ai"
  | "wealth"
  | "adviser"
  | "care"
  | "cadence"
  | "execution"
  | "admin"
  | "other";

export const AUDIT_CATEGORIES: AuditCategory[] = [
  "auth",
  "privacy",
  "escalation",
  "consent",
  "ai",
  "wealth",
  "adviser",
  "care",
  "cadence",
  "execution",
  "admin",
  "other",
];

const CATEGORY_MATCHERS: Array<{ category: AuditCategory; patterns: RegExp[] }> = [
  { category: "auth", patterns: [/^AUTH_/] },
  {
    category: "privacy",
    patterns: [/^PRIVACY_/, /ERASURE/],
  },
  { category: "escalation", patterns: [/^ESCALATION_/] },
  { category: "consent", patterns: [/^CONSENT_/] },
  { category: "ai", patterns: [/^AI_/, /^WEALTHGUARD_/] },
  {
    category: "wealth",
    patterns: [
      /^ASSET_/,
      /^LIABILITY_/,
      /^GOAL_/,
      /^RECOMMENDATION_/,
      /^ESTATE_/,
      /^DOCUMENT_/,
      /^MEMORY_/,
      /^connection\./i,
      /^FX_/,
    ],
  },
  {
    category: "care",
    patterns: [
      /^OPS_CARE_REMIND/,
      /^OPS_REMIND_ANSWERED/,
      /^ADVISER_CARE_ACK/,
      /^CUSTOMER_CARE_RECEIPT/,
    ],
  },
  {
    category: "adviser",
    patterns: [/^ADVISER_/, /^CUSTOMER_SHARED_/],
  },
  {
    category: "cadence",
    patterns: [/MONTHLY_WEALTH_REPORT/, /WEEKLY_WEALTH_DIGEST/, /NOTIFICATION_PREFS_/],
  },
  { category: "execution", patterns: [/^EXECUTION_/] },
  {
    category: "admin",
    patterns: [/^CHANGE_REQUEST_/, /^FX_REFRESH/, /^AUDIT_EXPORT_/],
  },
];

export function categoriseAuditEvent(eventType: string): AuditCategory {
  for (const row of CATEGORY_MATCHERS) {
    if (row.patterns.some((p) => p.test(eventType))) return row.category;
  }
  return "other";
}

/** Strip password/secret/token/hash keys from JSON trees (keeps payloadJson string keys if nested). */
export function redactAuditPayload(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactAuditPayload);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (/password|secret|token|api[_-]?key|authorization/i.test(k)) {
        out[k] = "[redacted]";
        continue;
      }
      out[k] = redactAuditPayload(v);
    }
    return out;
  }
  return value;
}

export function parseAndRedactPayload(payloadJson: string): unknown {
  try {
    return redactAuditPayload(JSON.parse(payloadJson || "{}"));
  } catch {
    return { raw: payloadJson };
  }
}

export type AuditExportRow = {
  id: string;
  eventType: string;
  category: AuditCategory;
  entityType: string | null;
  entityId: string | null;
  userId: string | null;
  createdAt: string;
  payload: unknown;
};

export function buildAuditExportPackage(input: {
  exportedAt: string;
  category: AuditCategory | "all";
  eventType?: string;
  rows: AuditExportRow[];
}) {
  const byCategory = AUDIT_CATEGORIES.reduce(
    (acc, c) => {
      acc[c] = input.rows.filter((r) => r.category === c).length;
      return acc;
    },
    {} as Record<AuditCategory, number>,
  );

  return {
    exportedAt: input.exportedAt,
    purpose: "Admin audit export for pilot compliance review",
    filter: {
      category: input.category,
      eventType: input.eventType ?? null,
    },
    counts: {
      total: input.rows.length,
      byCategory,
    },
    events: input.rows,
  };
}

export function filterAuditRows(
  rows: AuditExportRow[],
  opts: { category?: AuditCategory | "all"; eventType?: string; q?: string },
): AuditExportRow[] {
  const category = opts.category ?? "all";
  const eventType = opts.eventType?.trim();
  const q = opts.q?.trim().toLowerCase();

  return rows.filter((r) => {
    if (category !== "all" && r.category !== category) return false;
    if (eventType && r.eventType !== eventType) return false;
    if (q) {
      const hay = `${r.eventType} ${r.entityType ?? ""} ${r.entityId ?? ""} ${r.userId ?? ""} ${JSON.stringify(r.payload)}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
