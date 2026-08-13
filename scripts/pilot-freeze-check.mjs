/**
 * Pilot ops freeze gate (v0.1.1 pack) — docs + scripts present, versions aligned.
 * Does not replace `npm run test` / `npm run release:check`.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

function mustExist(rel) {
  if (!existsSync(join(root, rel))) failures.push(`missing file: ${rel}`);
}

const version = read("VERSION").trim();
const pkg = JSON.parse(read("package.json"));
if (version !== pkg.version) {
  failures.push(`VERSION (${version}) != package.json version (${pkg.version})`);
}
if (version !== "0.1.1") {
  failures.push(`expected pilot freeze VERSION 0.1.1, got ${version}`);
}

mustExist("scripts/smoke-hosted.mjs");
mustExist("scripts/pilot-freeze-check.mjs");
mustExist("src/engines/flag-profiles.ts");
mustExist("src/engines/audit-export.ts");
mustExist("src/engines/ops-daily.ts");
mustExist("src/engines/escalation-ops.ts");
mustExist("src/engines/privacy-export.ts");
mustExist("src/app/admin/ops/page.tsx");
mustExist("src/app/admin/flags/page.tsx");
mustExist("src/app/admin/audit/page.tsx");
mustExist("src/app/admin/escalations/page.tsx");
mustExist("src/app/app/support/page.tsx");
mustExist("DEPLOY.md");
mustExist("OPS_RUNBOOK.md");
mustExist("LAUNCH_REVIEW.md");

const pkgScripts = pkg.scripts || {};
for (const s of ["smoke:hosted", "pilot:freeze", "release:check", "build:vercel"]) {
  if (!pkgScripts[s]) failures.push(`package.json missing script: ${s}`);
}

const changelog = read("CHANGELOG.md");
if (!changelog.includes("0.1.1")) failures.push("CHANGELOG.md missing 0.1.1 section");
if (!changelog.includes("smoke:hosted")) failures.push("CHANGELOG.md missing smoke:hosted mention");

const deploy = read("DEPLOY.md");
if (!deploy.includes("smoke:hosted")) failures.push("DEPLOY.md missing smoke:hosted");
if (!deploy.includes("safe pilot")) failures.push("DEPLOY.md missing safe pilot guidance");

const demo = read("DEMO_SCRIPT.md");
if (!demo.includes("/admin/ops")) failures.push("DEMO_SCRIPT.md missing /admin/ops");
if (!demo.includes("/app/support")) failures.push("DEMO_SCRIPT.md missing /app/support");

const status = read("MVP_STATUS.md");
if (!status.includes("0.1.1")) failures.push("MVP_STATUS.md missing 0.1.1");

const launch = read("LAUNCH_REVIEW.md");
if (!launch.includes("smoke:hosted")) failures.push("LAUNCH_REVIEW.md missing smoke:hosted");
if (!launch.includes("/admin/flags")) failures.push("LAUNCH_REVIEW.md missing flag profiles path");

if (failures.length) {
  console.error("Pilot freeze check FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`Pilot freeze check OK — WealthOS ${version}`);
console.log("Still complete human LAUNCH_REVIEW.md sign-off before public/regulated traffic.");
