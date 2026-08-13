/**
 * CLI launch gate. Use LAUNCH_PROFILE=production to enforce prod blockers.
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// Load compiled-less TS via dynamic eval path: duplicate minimal checks in plain JS
// so the script runs without tsx dependency in CI.
function evaluate(env) {
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
        : "MVP/default SESSION_SECRET — acceptable only in local demo"
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

// Load .env lightly
try {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m || process.env[m[1]] != null) continue;
      process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  }
} catch {
  /* ignore */
}

const report = evaluate(process.env);
console.log(`WealthOS launch check (${report.profile})`);
for (const c of report.checks) {
  const mark = c.ok ? "OK" : "FAIL";
  console.log(`  [${mark}] ${c.id}: ${c.message}`);
}
if (!report.ok) {
  console.error("\nLaunch gate FAILED — see LAUNCH_REVIEW.md");
  process.exit(1);
}
console.log("\nLaunch gate OK for this profile");
void require;
