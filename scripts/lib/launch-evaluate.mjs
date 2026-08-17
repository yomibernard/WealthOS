/**
 * Shared launch-gate evaluation for CLI scripts (no TS/tsx dependency).
 * Keep parity with src/lib/launch-gate.ts for session / demo / sqlite blockers.
 */

export function evaluateLaunchEnv(env) {
  const profile =
    env.LAUNCH_PROFILE === "production" || env.NODE_ENV === "production"
      ? "production"
      : "development";
  const prod = profile === "production";
  const checks = [];

  const secret = env.SESSION_SECRET ?? "";
  const weak =
    !secret ||
    secret.length < 24 ||
    /wealthos-mvp-dev-secret/i.test(secret) ||
    secret === "change-me";
  checks.push({
    id: "session_secret",
    ok: prod ? !weak : Boolean(secret),
    severity: prod ? "blocker" : "warn",
    message: weak
      ? prod
        ? "Weak or default SESSION_SECRET (blocker in production)"
        : "MVP/default SESSION_SECRET — acceptable only for local demo"
      : "SESSION_SECRET ok",
  });

  const demo = ["1", "true", "yes", "on"].includes((env.DEMO_MODE ?? "").toLowerCase());
  checks.push({
    id: "demo_mode",
    ok: prod ? !demo : true,
    severity: prod ? "blocker" : "info",
    message: demo
      ? prod
        ? "DEMO_MODE on (blocker in production)"
        : "DEMO_MODE on — expected for local demo"
      : "DEMO_MODE off",
  });

  const db = env.DATABASE_URL ?? "";
  checks.push({
    id: "database_url",
    ok: Boolean(db),
    severity: "blocker",
    message: db ? "DATABASE_URL set" : "DATABASE_URL missing",
  });

  if (prod && db.startsWith("file:")) {
    checks.push({
      id: "sqlite_in_prod",
      ok: false,
      severity: "blocker",
      message: "SQLite DATABASE_URL under production profile",
    });
  }

  const ok = checks.filter((c) => c.severity === "blocker").every((c) => c.ok);
  return { ok, profile, checks };
}
