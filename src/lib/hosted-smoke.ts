/**
 * Hosted pilot smoke rules — evaluate a live /api/health payload without secrets.
 */

export type HealthPayload = {
  status?: string;
  database?: { ok?: boolean; error?: string | null };
  launch?: { ok?: boolean; profile?: string; blockers?: string[] };
  config?: {
    demoMode?: boolean;
    databaseKind?: string;
  };
};

export type SmokeFinding = {
  id: string;
  ok: boolean;
  severity: "blocker" | "warn";
  message: string;
};

export function databaseKindFromUrl(url: string | undefined): "sqlite" | "postgres" | "other" | "missing" {
  if (!url) return "missing";
  if (url.startsWith("file:")) return "sqlite";
  if (/^postgres(ql)?:\/\//i.test(url)) return "postgres";
  return "other";
}

export function evaluateHostedHealth(
  health: HealthPayload,
  opts: { requirePostgres?: boolean } = {},
): SmokeFinding[] {
  const findings: SmokeFinding[] = [];
  const requirePostgres = opts.requirePostgres ?? true;

  findings.push({
    id: "health_status",
    ok: health.status === "ok",
    severity: "blocker",
    message:
      health.status === "ok"
        ? "Health status is ok."
        : `Health status is ${health.status ?? "missing"} (need ok with reachable DB).`,
  });

  findings.push({
    id: "database_ok",
    ok: Boolean(health.database?.ok),
    severity: "blocker",
    message: health.database?.ok
      ? "Database probe succeeded."
      : `Database probe failed${health.database?.error ? `: ${health.database.error}` : "."}`,
  });

  const kind = health.config?.databaseKind ?? "other";
  findings.push({
    id: "database_kind",
    ok: requirePostgres ? kind === "postgres" : kind !== "sqlite",
    severity: "blocker",
    message:
      kind === "postgres"
        ? "DATABASE_URL looks like Postgres."
        : `DATABASE_URL kind is ${kind} — hosted pilot expects Postgres.`,
  });

  const demoMode = Boolean(health.config?.demoMode);
  findings.push({
    id: "demo_mode_off",
    ok: !demoMode,
    severity: "warn",
    message: demoMode
      ? "DEMO_MODE is on — turn off for shared pilot URLs."
      : "DEMO_MODE is off.",
  });

  const blockers = health.launch?.blockers ?? [];
  findings.push({
    id: "launch_blockers",
    ok: blockers.length === 0,
    severity: "warn",
    message:
      blockers.length === 0
        ? "Launch gate reports no blockers."
        : `Launch blockers: ${blockers.join(", ")}.`,
  });

  return findings;
}

/** Blockers must pass; warns are reported but do not fail the smoke by default. */
export function smokePassed(findings: SmokeFinding[], strict = false): boolean {
  return findings.every((f) => f.ok || (!strict && f.severity === "warn"));
}
