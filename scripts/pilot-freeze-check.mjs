/**
 * Pilot freeze gate — docs + scripts present, versions aligned.
 * Current pack: v0.1.4 (ops 8.x + trust 9.x + care 10.x + care UX 11.x).
 * Does not replace `npm run test` / `npm run release:check`.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];
const EXPECTED = "0.1.4";

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
if (version !== EXPECTED) {
  failures.push(`expected pilot freeze VERSION ${EXPECTED}, got ${version}`);
}

// 8.x ops surface
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

// 9.x trust loop surface
mustExist("src/engines/customer-cases.ts");
mustExist("src/engines/privacy-requests.ts");
mustExist("src/lib/notification-links.ts");
mustExist("src/app/app/privacy/page.tsx");
mustExist("src/app/app/notifications/page.tsx");
mustExist("src/app/app/inbox/page.tsx");

// 10.x adviser care surface
mustExist("src/engines/adviser-care.ts");
mustExist("src/engines/adviser-portfolio.ts");
mustExist("src/engines/adviser-care-ack.ts");
mustExist("src/services/adviser-care.ts");
mustExist("src/services/adviser-portfolio.ts");
mustExist("src/services/adviser-care-ack.ts");
mustExist("src/app/api/adviser/care-ack/route.ts");
mustExist("src/components/AdviserCareAck.tsx");
mustExist("src/app/adviser/page.tsx");
mustExist("src/app/adviser/customers/[id]/page.tsx");

mustExist("DEPLOY.md");
mustExist("OPS_RUNBOOK.md");
mustExist("LAUNCH_REVIEW.md");

const pkgScripts = pkg.scripts || {};
for (const s of ["smoke:hosted", "pilot:freeze", "release:check", "build:vercel"]) {
  if (!pkgScripts[s]) failures.push(`package.json missing script: ${s}`);
}

const changelog = read("CHANGELOG.md");
if (!changelog.includes("0.1.4")) failures.push("CHANGELOG.md missing 0.1.4 section");
if (!changelog.includes("smoke:hosted")) failures.push("CHANGELOG.md missing smoke:hosted mention");
if (!changelog.includes("notification")) failures.push("CHANGELOG.md missing notification deep-link mention");
if (!changelog.includes("care")) failures.push("CHANGELOG.md missing care pack mention");
if (!changelog.includes("unacked")) failures.push("CHANGELOG.md missing unacked filter mention");

const deploy = read("DEPLOY.md");
if (!deploy.includes("smoke:hosted")) failures.push("DEPLOY.md missing smoke:hosted");
if (!deploy.includes("safe pilot")) failures.push("DEPLOY.md missing safe pilot guidance");

const demo = read("DEMO_SCRIPT.md");
if (!demo.includes("/admin/ops")) failures.push("DEMO_SCRIPT.md missing /admin/ops");
if (!demo.includes("/app/support")) failures.push("DEMO_SCRIPT.md missing /app/support");
if (!demo.includes("Trust loop")) failures.push("DEMO_SCRIPT.md missing Trust loop");
if (!demo.includes("Privacy loop")) failures.push("DEMO_SCRIPT.md missing Privacy loop");
if (!demo.includes("Care radar")) failures.push("DEMO_SCRIPT.md missing Care radar");
if (!demo.includes("Care desk")) failures.push("DEMO_SCRIPT.md missing Care desk");
if (!demo.includes("Unacked")) failures.push("DEMO_SCRIPT.md missing Unacked filter");

const status = read("MVP_STATUS.md");
if (!status.includes("0.1.4")) failures.push("MVP_STATUS.md missing 0.1.4");
if (!status.includes("Adviser care ack")) failures.push("MVP_STATUS.md missing Adviser care ack");
if (!status.includes("Adviser unacked radar")) failures.push("MVP_STATUS.md missing Adviser unacked radar");

const launch = read("LAUNCH_REVIEW.md");
if (!launch.includes("smoke:hosted")) failures.push("LAUNCH_REVIEW.md missing smoke:hosted");
if (!launch.includes("/admin/flags")) failures.push("LAUNCH_REVIEW.md missing flag profiles path");
if (!launch.includes("pilot:freeze")) failures.push("LAUNCH_REVIEW.md missing pilot:freeze");

const notificationsPage = read("src/app/app/notifications/page.tsx");
if (!notificationsPage.includes("resolveNotificationLink")) {
  failures.push("notifications page missing resolveNotificationLink");
}

const adviserHome = read("src/app/adviser/page.tsx");
if (!adviserHome.includes("care")) {
  failures.push("adviser home missing care radar cues");
}
if (!adviserHome.includes("unacked")) {
  failures.push("adviser home missing unacked filter");
}
if (!adviserHome.includes("ackCue")) {
  failures.push("adviser home missing last-ack cue");
}

const careAck = read("src/components/AdviserCareAck.tsx");
if (!careAck.includes("/api/adviser/care-ack")) {
  failures.push("AdviserCareAck missing care-ack API call");
}

const portfolioEngine = read("src/engines/adviser-portfolio.ts");
if (!portfolioEngine.includes("filterPortfolioCareRadar")) {
  failures.push("portfolio engine missing care filters");
}
if (!portfolioEngine.includes("formatCareAckCue")) {
  failures.push("portfolio engine missing ack cue formatter");
}

const careAckEngine = read("src/engines/adviser-care-ack.ts");
if (!careAckEngine.includes("buildCareAckHistory")) {
  failures.push("care-ack engine missing history builder");
}

const customer360 = read("src/app/adviser/customers/[id]/page.tsx");
if (!customer360.includes("Recent care acknowledgments") && !customer360.includes("careHistory")) {
  failures.push("customer 360 missing care acknowledgment history");
}

if (failures.length) {
  console.error("Pilot freeze check FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`Pilot freeze check OK — WealthOS ${version}`);
console.log("Still complete human LAUNCH_REVIEW.md sign-off before public/regulated traffic.");
