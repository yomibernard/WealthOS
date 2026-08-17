/**
 * Prod launch-gate rehearsal with fixture envs (does not read real secrets).
 *
 *   npm run launch:rehearse-prod
 *
 * Proves fail-closed on weak/demo/sqlite and pass on a hardened Postgres fixture.
 * Owner still runs LAUNCH_PROFILE=production npm run launch:check against the real host env.
 */
import { evaluateLaunchEnv } from "./lib/launch-evaluate.mjs";

const failClosed = evaluateLaunchEnv({
  NODE_ENV: "production",
  LAUNCH_PROFILE: "production",
  SESSION_SECRET: "wealthos-mvp-dev-secret-change-in-production",
  DEMO_MODE: "true",
  DATABASE_URL: "file:./dev.db",
});

const passFixture = evaluateLaunchEnv({
  NODE_ENV: "production",
  LAUNCH_PROFILE: "production",
  SESSION_SECRET: "a-sufficiently-long-production-secret-key",
  DEMO_MODE: "false",
  DATABASE_URL: "postgresql://user:pass@host:5432/wealthos",
});

const expectedFailIds = ["session_secret", "demo_mode", "sqlite_in_prod"];
const failOk =
  failClosed.ok === false &&
  expectedFailIds.every((id) => failClosed.checks.some((c) => c.id === id && !c.ok));
const passOk = passFixture.ok === true && passFixture.profile === "production";

console.log("WealthOS prod launch-gate rehearsal (fixture envs only)");
console.log("\n==> Fail-closed fixture (weak secret / DEMO_MODE / sqlite)");
for (const c of failClosed.checks) {
  console.log(`  [${c.ok ? "OK" : "FAIL"}] ${c.id}: ${c.message}`);
}
console.log(`  [${failOk ? "OK" : "FAIL"}] expected blockers present and ok=false`);

console.log("\n==> Pass fixture (strong secret / DEMO off / Postgres URL)");
for (const c of passFixture.checks) {
  console.log(`  [${c.ok ? "OK" : "FAIL"}] ${c.id}: ${c.message}`);
}
console.log(`  [${passOk ? "OK" : "FAIL"}] expected ok=true`);

if (!failOk || !passOk) {
  console.error("\nProd launch rehearsal FAILED");
  process.exit(1);
}

console.log("\nProd launch rehearsal OK");
console.log(
  "Still run LAUNCH_PROFILE=production npm run launch:check against the real host env before public pilot.",
);
