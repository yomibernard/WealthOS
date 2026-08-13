/**
 * Pure privacy export shaping — NDPR-oriented portability package.
 * Never includes credential material.
 */

export type SnapshotExportRow = {
  id: string;
  createdAt: string;
  netWorthNgn: number;
  confidence: number;
  healthScore: number | null;
  payloadJson: string;
};

export type NoteExportRow = {
  id: string;
  kind: string;
  title: string;
  body: string;
  status: string;
  sharedWithCustomer: boolean;
  createdAt: string;
};

export type CadenceSummary = {
  monthlyReportCount: number;
  weeklyDigestCount: number;
  shareCount: number;
  nudgeCount: number;
  snapshotIds: string[];
};

export function classifySnapshotType(payloadJson: string): string {
  try {
    const p = JSON.parse(payloadJson || "{}") as { type?: string };
    if (p.type === "monthly_report" || p.type === "weekly_digest") return p.type;
  } catch {
    /* ignore */
  }
  if (payloadJson.includes("monthly_report")) return "monthly_report";
  if (payloadJson.includes("weekly_digest")) return "weekly_digest";
  return "snapshot";
}

export function buildCadenceSummary(
  snapshots: SnapshotExportRow[],
  notes: NoteExportRow[],
): CadenceSummary {
  const monthly = snapshots.filter((s) => classifySnapshotType(s.payloadJson) === "monthly_report");
  const weekly = snapshots.filter((s) => classifySnapshotType(s.payloadJson) === "weekly_digest");
  const shares = notes.filter((n) => n.kind === "customer_share");
  const nudges = notes.filter((n) => n.kind === "adviser_nudge");
  return {
    monthlyReportCount: monthly.length,
    weeklyDigestCount: weekly.length,
    shareCount: shares.length,
    nudgeCount: nudges.length,
    snapshotIds: [...monthly, ...weekly].map((s) => s.id),
  };
}

/** Strip anything that looks like a password / hash field from a plain object tree. */
export function omitCredentialFields<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => omitCredentialFields(v)) as T;
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (/password|secret|token|hash/i.test(k) && k !== "payloadJson") continue;
      out[k] = omitCredentialFields(v);
    }
    return out as T;
  }
  return value;
}

export function assertNoPasswordHash(pack: unknown): boolean {
  return !JSON.stringify(pack).includes("passwordHash");
}
