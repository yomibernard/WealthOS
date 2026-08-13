/**
 * Launch / production readiness checks (env + policy), not a substitute for legal sign-off.
 */

export type LaunchCheck = {
  id: string;
  ok: boolean;
  severity: "blocker" | "warn" | "info";
  message: string;
};

export type LaunchReport = {
  ok: boolean;
  profile: "development" | "production" | "test";
  checks: LaunchCheck[];
  checkedAt: string;
};

function profileFromEnv(env: NodeJS.ProcessEnv): LaunchReport["profile"] {
  if (env.LAUNCH_PROFILE === "production" || env.NODE_ENV === "production") {
    return "production";
  }
  if (env.NODE_ENV === "test") return "test";
  return "development";
}

export function evaluateLaunchGate(env: NodeJS.ProcessEnv = process.env): LaunchReport {
  const profile = profileFromEnv(env);
  const prod = profile === "production";
  const checks: LaunchCheck[] = [];

  const secret = env.SESSION_SECRET ?? "";
  const weakSecret =
    !secret ||
    secret.length < 24 ||
    /wealthos-mvp-dev-secret/i.test(secret) ||
    secret === "change-me";

  checks.push({
    id: "session_secret",
    ok: prod ? !weakSecret : Boolean(secret),
    severity: prod ? "blocker" : "warn",
    message: weakSecret
      ? "SESSION_SECRET is missing, short, or still the MVP default."
      : "SESSION_SECRET looks set.",
  });

  const demoMode = ["1", "true", "yes", "on"].includes((env.DEMO_MODE ?? "").toLowerCase());
  checks.push({
    id: "demo_mode",
    ok: prod ? !demoMode : true,
    severity: prod ? "blocker" : "info",
    message: demoMode
      ? "DEMO_MODE is enabled — disable for production traffic."
      : "DEMO_MODE is off (or unset).",
  });

  const db = env.DATABASE_URL ?? "";
  checks.push({
    id: "database_url",
    ok: Boolean(db),
    severity: "blocker",
    message: db ? `DATABASE_URL present (${db.startsWith("file:") ? "sqlite" : "remote/other"}).` : "DATABASE_URL missing.",
  });

  if (prod && db.startsWith("file:")) {
    checks.push({
      id: "sqlite_in_prod",
      ok: false,
      severity: "blocker",
      message: "Production profile still points at SQLite file DB — complete Postgres cutover.",
    });
  }

  const partner = (env.FF_PARTNER_EXECUTION ?? "true").toLowerCase();
  checks.push({
    id: "partner_execution_flag",
    ok: true,
    severity: "info",
    message:
      partner === "false" || partner === "0"
        ? "Partner execution flag is off."
        : "Partner execution flag is on — confirm fundsMoved remains false until a real rail exists.",
  });

  checks.push({
    id: "docs",
    ok: true,
    severity: "info",
    message: "See OPS_RUNBOOK.md, LAUNCH_REVIEW.md, DEMO_SCRIPT.md, POSTGRES_CUTOVER.md.",
  });

  const ok = checks.filter((c) => c.severity === "blocker").every((c) => c.ok);

  return {
    ok,
    profile,
    checks,
    checkedAt: new Date().toISOString(),
  };
}
