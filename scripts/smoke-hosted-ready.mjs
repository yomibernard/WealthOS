/**
 * Hosted smoke / deploy readiness preflight (does not call a live URL unless SMOKE_BASE_URL is set).
 *
 *   npm run smoke:hosted-ready
 *
 * Optional:
 *   SMOKE_REQUIRE_BASE=1   fail if SMOKE_BASE_URL is unset
 *   SMOKE_BASE_URL=…       when set, only validates the URL shape (no network)
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

function mustExist(rel) {
  if (!existsSync(join(root, rel))) failures.push(`missing ${rel}`);
}

function read(rel) {
  const p = join(root, rel);
  if (!existsSync(p)) {
    failures.push(`missing ${rel}`);
    return "";
  }
  return readFileSync(p, "utf8");
}

mustExist("scripts/smoke-hosted.mjs");
mustExist("DEPLOY.md");
mustExist("src/lib/hosted-smoke.ts");

const pkg = read("package.json");
if (pkg && !pkg.includes("smoke:hosted")) {
  failures.push("package.json missing smoke:hosted script");
}
if (pkg && !pkg.includes("smoke:hosted-ready")) {
  failures.push("package.json missing smoke:hosted-ready script");
}

const deploy = read("DEPLOY.md");
for (const needle of [
  "SMOKE_BASE_URL",
  "SMOKE_STRICT",
  "SMOKE_SKIP_AUTH",
  "smoke:hosted",
  "/api/health",
  "safe pilot",
]) {
  if (deploy && !deploy.includes(needle)) {
    failures.push(`DEPLOY.md missing readiness cue ${JSON.stringify(needle)}`);
  }
}

const smoke = read("scripts/smoke-hosted.mjs");
for (const needle of ["SMOKE_BASE_URL", "SMOKE_STRICT", "SMOKE_SKIP_AUTH", "/api/health"]) {
  if (smoke && !smoke.includes(needle)) {
    failures.push(`smoke-hosted.mjs missing ${JSON.stringify(needle)}`);
  }
}

const requireBase = ["1", "true", "yes", "on"].includes(
  (process.env.SMOKE_REQUIRE_BASE ?? "").toLowerCase(),
);
const base = (process.env.SMOKE_BASE_URL || process.env.BASE_URL || "").replace(/\/$/, "");

if (requireBase && !base) {
  failures.push("SMOKE_REQUIRE_BASE=1 but SMOKE_BASE_URL is unset");
}

if (base) {
  if (!/^https?:\/\//i.test(base)) {
    failures.push(`SMOKE_BASE_URL must be http(s): ${base}`);
  }
  if (/localhost|127\.0\.0\.1/i.test(base) && !process.env.SMOKE_ALLOW_LOCAL) {
    failures.push("SMOKE_BASE_URL points at localhost — use a hosted origin or SMOKE_ALLOW_LOCAL=1");
  }
}

console.log("WealthOS hosted smoke readiness");
console.log("  [OK] smoke-hosted.mjs + DEPLOY.md matrix present");
if (base) {
  console.log(`  [OK] SMOKE_BASE_URL shape checked → ${base}`);
} else {
  console.log("  [OK] SMOKE_BASE_URL unset (preflight only; set it to run live smoke)");
}

console.log("\nHosted command matrix:");
console.log("  SMOKE_BASE_URL=https://your-app.vercel.app npm run smoke:hosted");
console.log("  SMOKE_STRICT=1 SMOKE_BASE_URL=https://… npm run smoke:hosted");
console.log("  SMOKE_SKIP_AUTH=1 SMOKE_BASE_URL=https://… npm run smoke:hosted");
console.log("  npm run launch:rehearse-prod");
console.log("  GET /api/health  (demoMode off, databaseKind postgres)");
console.log("  /admin/flags → safe pilot for shared URLs");

if (failures.length) {
  console.error("\nHosted smoke readiness FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("\nHosted smoke readiness OK");
console.log("Owner still runs live smoke against the deployed URL before public pilot.");
