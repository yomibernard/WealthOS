/**
 * Pilot freeze gate — docs + scripts present, versions aligned.
 * Current pack: v0.1.8 (… + WealthAI care 14.x + care receipts 15.x).
 * Does not replace `npm run test` / `npm run release:check`.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];
const EXPECTED = "0.1.8";

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
mustExist("src/app/admin/privacy/page.tsx");
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

// 13.x customer care loop
mustExist("src/app/api/care-updates/route.ts");

// 14.x WealthAI care
mustExist("src/ai/orchestrator.ts");
mustExist("src/app/app/ai/page.tsx");
mustExist("src/app/api/ai/chat/route.ts");

// 15.x care receipts
mustExist("src/app/api/care-updates/[id]/seen/route.ts");
mustExist("src/components/CareUpdateReceiptList.tsx");

mustExist("DEPLOY.md");
mustExist("OPS_RUNBOOK.md");
mustExist("LAUNCH_REVIEW.md");

const pkgScripts = pkg.scripts || {};
for (const s of ["smoke:hosted", "pilot:freeze", "release:check", "build:vercel"]) {
  if (!pkgScripts[s]) failures.push(`package.json missing script: ${s}`);
}

const changelog = read("CHANGELOG.md");
if (!changelog.includes("0.1.8")) failures.push("CHANGELOG.md missing 0.1.8 section");
if (!changelog.includes("smoke:hosted")) failures.push("CHANGELOG.md missing smoke:hosted mention");
if (!changelog.includes("notification")) failures.push("CHANGELOG.md missing notification deep-link mention");
if (!changelog.includes("care")) failures.push("CHANGELOG.md missing care pack mention");
if (!changelog.includes("unacked")) failures.push("CHANGELOG.md missing unacked filter mention");
if (!changelog.includes("care handoff") && !changelog.includes("care_handoff")) {
  failures.push("CHANGELOG.md missing care handoff mention");
}
if (!changelog.includes("care-update") && !changelog.includes("care update")) {
  failures.push("CHANGELOG.md missing customer care-update mention");
}
if (!changelog.includes("care_update") && !changelog.includes("WealthAI care")) {
  failures.push("CHANGELOG.md missing WealthAI care_update mention");
}
if (
  !changelog.includes("Mark as seen") &&
  !changelog.includes("mark as seen") &&
  !changelog.includes("care receipt") &&
  !changelog.includes("Care receipts")
) {
  failures.push("CHANGELOG.md missing care receipt / mark-as-seen mention");
}

const deploy = read("DEPLOY.md");
if (!deploy.includes("smoke:hosted")) failures.push("DEPLOY.md missing smoke:hosted");
if (!deploy.includes("safe pilot")) failures.push("DEPLOY.md missing safe pilot guidance");
if (!deploy.includes("v0.1.8")) failures.push("DEPLOY.md missing v0.1.8 tag guidance");

const demo = read("DEMO_SCRIPT.md");
if (!demo.includes("/admin/ops")) failures.push("DEMO_SCRIPT.md missing /admin/ops");
if (!demo.includes("/app/support")) failures.push("DEMO_SCRIPT.md missing /app/support");
if (!demo.includes("Trust loop")) failures.push("DEMO_SCRIPT.md missing Trust loop");
if (!demo.includes("Privacy loop")) failures.push("DEMO_SCRIPT.md missing Privacy loop");
if (!demo.includes("Care radar")) failures.push("DEMO_SCRIPT.md missing Care radar");
if (!demo.includes("Care desk")) failures.push("DEMO_SCRIPT.md missing Care desk");
if (!demo.includes("Unacked")) failures.push("DEMO_SCRIPT.md missing Unacked filter");
if (!demo.includes("care handoff")) failures.push("DEMO_SCRIPT.md missing care handoff");
if (!demo.includes("care update")) failures.push("DEMO_SCRIPT.md missing care update CTA");
if (!demo.includes("WealthAI") || !demo.includes("/app/ai")) {
  failures.push("DEMO_SCRIPT.md missing WealthAI care path");
}
if (!demo.includes("Mark as seen") && !demo.includes("mark as seen")) {
  failures.push("DEMO_SCRIPT.md missing Mark as seen receipt beat");
}

const status = read("MVP_STATUS.md");
if (!status.includes("0.1.8")) failures.push("MVP_STATUS.md missing 0.1.8");
if (!status.includes("Adviser care ack")) failures.push("MVP_STATUS.md missing Adviser care ack");
if (!status.includes("Adviser unacked radar")) failures.push("MVP_STATUS.md missing Adviser unacked radar");
if (!status.includes("Ops care handoff")) failures.push("MVP_STATUS.md missing Ops care handoff");
if (!status.includes("Privacy care cues")) failures.push("MVP_STATUS.md missing Privacy care cues");
if (!status.includes("Customer care pulse")) failures.push("MVP_STATUS.md missing Customer care pulse");
if (!status.includes("Privacy care updates")) failures.push("MVP_STATUS.md missing Privacy care updates");
if (!status.includes("WealthAI care update")) failures.push("MVP_STATUS.md missing WealthAI care update");
if (!status.includes("Care receipts")) failures.push("MVP_STATUS.md missing Care receipts");

const launch = read("LAUNCH_REVIEW.md");
if (!launch.includes("smoke:hosted")) failures.push("LAUNCH_REVIEW.md missing smoke:hosted");
if (!launch.includes("/admin/flags")) failures.push("LAUNCH_REVIEW.md missing flag profiles path");
if (!launch.includes("pilot:freeze")) failures.push("LAUNCH_REVIEW.md missing pilot:freeze");
if (!launch.includes("0.1.8")) failures.push("LAUNCH_REVIEW.md missing 0.1.8 pack");

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
if (!careAckEngine.includes("buildCareUpdatePulse")) {
  failures.push("care-ack engine missing buildCareUpdatePulse");
}
if (!careAckEngine.includes("formatCareUpdateAiContent")) {
  failures.push("care-ack engine missing formatCareUpdateAiContent");
}
if (!careAckEngine.includes("appendCareReceipt") || !careAckEngine.includes("buildCareUpdateList")) {
  failures.push("care-ack engine missing receipt helpers");
}

const customer360 = read("src/app/adviser/customers/[id]/page.tsx");
if (!customer360.includes("Recent care acknowledgments") && !customer360.includes("careHistory")) {
  failures.push("customer 360 missing care acknowledgment history");
}
if (!customer360.includes("Seen") || !customer360.includes("Unseen")) {
  failures.push("customer 360 missing Seen/Unseen receipt cues");
}

// 12.x ops care handoff surface
const opsDaily = read("src/engines/ops-daily.ts");
if (!opsDaily.includes("care_handoff")) {
  failures.push("ops-daily engine missing care_handoff queue");
}
if (!opsDaily.includes("buildOpsCareHandoff")) {
  failures.push("ops-daily engine missing buildOpsCareHandoff");
}

const escalationOps = read("src/engines/escalation-ops.ts");
if (!escalationOps.includes("buildCaseCareAckCue")) {
  failures.push("escalation-ops missing buildCaseCareAckCue");
}

const privacyRequests = read("src/engines/privacy-requests.ts");
if (!privacyRequests.includes("buildPrivacyAdminCareView")) {
  failures.push("privacy-requests missing buildPrivacyAdminCareView");
}

const adminOps = read("src/app/admin/ops/page.tsx");
if (!adminOps.includes("careHandoff") && !adminOps.includes("Care handoff")) {
  failures.push("admin ops page missing care handoff strip");
}

const adminEsc = read("src/app/admin/escalations/page.tsx");
if (!adminEsc.includes("careAck")) {
  failures.push("admin escalations page missing careAck cue");
}

const adminPrivacy = read("src/app/admin/privacy/page.tsx");
if (!adminPrivacy.includes("careAck")) {
  failures.push("admin privacy page missing careAck cue");
}

// 13.x customer care loop surface
const homePage = read("src/app/app/page.tsx");
if (!homePage.includes("carePulse") && !homePage.includes("loadCareUpdatePulse")) {
  failures.push("Home missing care-update pulse");
}

const supportPage = read("src/app/app/support/page.tsx");
if (!supportPage.includes("care-updates") && !supportPage.includes("careUpdates")) {
  failures.push("Support page missing care updates");
}
if (!supportPage.includes("CareUpdateReceiptList") && !supportPage.includes("Mark as seen")) {
  failures.push("Support page missing care receipt UI");
}

const privacyPage = read("src/app/app/privacy/page.tsx");
if (!privacyPage.includes("care-updates") && !privacyPage.includes("careUpdates")) {
  failures.push("Privacy page missing care updates");
}
if (!privacyPage.includes("CareUpdateReceiptList") && !privacyPage.includes("Mark as seen")) {
  failures.push("Privacy page missing care receipt UI");
}

const careUpdatesApi = read("src/app/api/care-updates/route.ts");
if (!careUpdatesApi.includes("loadCareUpdatePulse")) {
  failures.push("care-updates API missing loadCareUpdatePulse");
}
if (!careUpdatesApi.includes("loadCareUpdateList")) {
  failures.push("care-updates API missing loadCareUpdateList");
}

const smokeHosted = read("scripts/smoke-hosted.mjs");
if (!smokeHosted.includes("/api/care-updates")) {
  failures.push("smoke-hosted missing /api/care-updates path");
}
if (!smokeHosted.includes("/app/ai")) {
  failures.push("smoke-hosted missing /app/ai path");
}
if (!smokeHosted.includes("list=1")) {
  failures.push("smoke-hosted missing care-updates list path");
}

const smokeLocal = read("scripts/smoke-journeys.mjs");
if (!smokeLocal.includes("/app/support") || !smokeLocal.includes("/api/care-updates")) {
  failures.push("smoke-journeys missing support/care-updates coverage");
}
if (!smokeLocal.includes("/app/ai") || !smokeLocal.includes("/api/ai/chat")) {
  failures.push("smoke-journeys missing WealthAI care coverage");
}
if (!smokeLocal.includes("/seen")) {
  failures.push("smoke-journeys missing care receipt seen coverage");
}

// 14.x WealthAI care surface
const orchestrator = read("src/ai/orchestrator.ts");
if (!orchestrator.includes("care_update")) {
  failures.push("orchestrator missing care_update intent");
}
if (!orchestrator.includes("formatCareUpdateAiContent")) {
  failures.push("orchestrator missing formatCareUpdateAiContent");
}

const wealthService = read("src/services/wealth.ts");
if (!wealthService.includes("careUpdate") || !wealthService.includes("loadCareUpdatePulse")) {
  failures.push("wealth service missing careUpdate context for WealthAI");
}

// 15.x care receipts surface
const careService = read("src/services/adviser-care-ack.ts");
if (!careService.includes("markCareUpdateSeen")) {
  failures.push("care-ack service missing markCareUpdateSeen");
}

const receiptUi = read("src/components/CareUpdateReceiptList.tsx");
if (!receiptUi.includes("/api/care-updates/") || !receiptUi.includes("/seen")) {
  failures.push("CareUpdateReceiptList missing seen API call");
}

const seed = read("prisma/seed.ts");
if (!seed.includes('kind: "care_ack"') && !seed.includes("kind: 'care_ack'")) {
  failures.push("seed missing demo care_ack for receipts");
}

if (failures.length) {
  console.error("Pilot freeze check FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`Pilot freeze check OK — WealthOS ${version}`);
console.log("Still complete human LAUNCH_REVIEW.md sign-off before public/regulated traffic.");
