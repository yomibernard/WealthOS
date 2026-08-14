/**
 * Pilot freeze gate — docs + scripts present, versions aligned.
 * Current pack: v0.1.19 (… + admin WealthAI ops 25.x + ops care remind 26.x).
 * Does not replace `npm run test` / `npm run release:check`.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];
const EXPECTED = "0.1.19";

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

// 17.x adviser notifications
mustExist("src/engines/adviser-notifications.ts");
mustExist("src/app/adviser/notifications/page.tsx");
mustExist("src/app/api/notifications/[id]/route.ts");

mustExist("DEPLOY.md");
mustExist("OPS_RUNBOOK.md");
mustExist("LAUNCH_REVIEW.md");

const pkgScripts = pkg.scripts || {};
for (const s of ["smoke:hosted", "pilot:freeze", "release:check", "build:vercel"]) {
  if (!pkgScripts[s]) failures.push(`package.json missing script: ${s}`);
}

const changelog = read("CHANGELOG.md");
if (!changelog.includes("0.1.19")) failures.push("CHANGELOG.md missing 0.1.19 section");
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
if (!changelog.includes("awaiting") && !changelog.includes("close-loop")) {
  failures.push("CHANGELOG.md missing care close-loop / awaiting mention");
}
if (!changelog.includes("Adviser notification") && !changelog.includes("adviser notification")) {
  failures.push("CHANGELOG.md missing adviser notification centre mention");
}

const deploy = read("DEPLOY.md");
if (!deploy.includes("smoke:hosted")) failures.push("DEPLOY.md missing smoke:hosted");
if (!deploy.includes("safe pilot")) failures.push("DEPLOY.md missing safe pilot guidance");
if (!deploy.includes("v0.1.19")) failures.push("DEPLOY.md missing v0.1.19 tag guidance");

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
if (!demo.includes("Awaiting receipt") && !demo.includes("awaiting")) {
  failures.push("DEMO_SCRIPT.md missing Awaiting receipt close-loop beat");
}
if (!demo.includes("Adviser notifications") && !demo.includes("/adviser/notifications")) {
  failures.push("DEMO_SCRIPT.md missing Adviser notifications beat");
}

const status = read("MVP_STATUS.md");
if (!status.includes("0.1.19")) failures.push("MVP_STATUS.md missing 0.1.19");
if (!status.includes("Ops care remind")) {
  failures.push("MVP_STATUS.md missing Ops care remind");
}
if (!status.includes("Admin WealthAI ops")) {
  failures.push("MVP_STATUS.md missing Admin WealthAI ops");
}
if (!status.includes("Adviser book next-steps")) {
  failures.push("MVP_STATUS.md missing Adviser book next-steps");
}
if (!status.includes("Home next-steps pulse")) {
  failures.push("MVP_STATUS.md missing Home next-steps pulse");
}
if (!status.includes("Wealth Inbox triage")) {
  failures.push("MVP_STATUS.md missing Wealth Inbox triage");
}
if (!status.includes("Customer notification triage")) {
  failures.push("MVP_STATUS.md missing Customer notification triage");
}
if (!status.includes("Adviser notification triage")) {
  failures.push("MVP_STATUS.md missing Adviser notification triage");
}
if (!status.includes("Adviser notifications")) {
  failures.push("MVP_STATUS.md missing Adviser notifications");
}
if (!status.includes("Care receipt close-loop")) {
  failures.push("MVP_STATUS.md missing Care receipt close-loop");
}
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
if (!launch.includes("0.1.19")) failures.push("LAUNCH_REVIEW.md missing 0.1.19 pack");

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
if (!adviserHome.includes("awaiting")) {
  failures.push("adviser home missing awaiting receipt filter");
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
if (!portfolioEngine.includes('"awaiting"') && !portfolioEngine.includes("'awaiting'")) {
  failures.push("portfolio engine missing awaiting filter");
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
if (!careAckEngine.includes("buildAdviserCareReceiptNotify")) {
  failures.push("care-ack engine missing buildAdviserCareReceiptNotify");
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
if (!opsDaily.includes("awaitingReceiptCount") || !opsDaily.includes("recentReceipts")) {
  failures.push("ops-daily engine missing receipt close-loop fields");
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
if (!adminOps.includes("awaiting") || !adminOps.includes("recentReceipts")) {
  failures.push("admin ops page missing awaiting/receipt close-loop UI");
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
if (!smokeHosted.includes("care=awaiting") || !smokeHosted.includes("/admin/ops")) {
  failures.push("smoke-hosted missing close-loop awaiting/ops paths");
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
if (!smokeLocal.includes("care=awaiting") || !smokeLocal.includes("/admin/ops")) {
  failures.push("smoke-journeys missing close-loop awaiting/ops coverage");
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
if (!careService.includes("buildAdviserCareReceiptNotify")) {
  failures.push("care-ack service missing adviser receipt notify");
}

const receiptUi = read("src/components/CareUpdateReceiptList.tsx");
if (!receiptUi.includes("/api/care-updates/") || !receiptUi.includes("/seen")) {
  failures.push("CareUpdateReceiptList missing seen API call");
}

const seed = read("prisma/seed.ts");
if (!seed.includes('kind: "care_ack"') && !seed.includes("kind: 'care_ack'")) {
  failures.push("seed missing demo care_ack for receipts");
}
if (!seed.includes('status: "seen"') && !seed.includes("status: 'seen'")) {
  failures.push("seed missing seen care receipt for ops close-loop demo");
}

const notificationLinks = read("src/lib/notification-links.ts");
if (!notificationLinks.includes("/adviser")) {
  failures.push("notification-links missing /adviser Path extraction");
}

// 17.x adviser notification centre
const adviserNotifyEngine = read("src/engines/adviser-notifications.ts");
if (!adviserNotifyEngine.includes("buildAdviserNotificationPulse")) {
  failures.push("adviser-notifications engine missing buildAdviserNotificationPulse");
}

const notifyService = read("src/services/notifications.ts");
if (!notifyService.includes("loadAdviserNotificationPulse") || !notifyService.includes("markNotificationRead")) {
  failures.push("notifications service missing adviser pulse / mark read");
}

const adviserNotifyPage = read("src/app/adviser/notifications/page.tsx");
if (!adviserNotifyPage.includes("Mark as read") && !adviserNotifyPage.includes("/api/notifications/")) {
  failures.push("adviser notifications page missing mark-as-read UI");
}

const adviserHomePage = read("src/app/adviser/page.tsx");
if (!adviserHomePage.includes("loadAdviserNotificationPulse") && !adviserHomePage.includes("/adviser/notifications")) {
  failures.push("adviser home missing notification pulse link");
}

if (!smokeLocal.includes("/adviser/notifications") || !smokeLocal.includes("/api/notifications")) {
  failures.push("smoke-journeys missing adviser notifications coverage");
}
if (!smokeHosted.includes("/adviser/notifications")) {
  failures.push("smoke-hosted missing /adviser/notifications path");
}

if (!seed.includes("marked your care update as seen")) {
  failures.push("seed missing adviser care-receipt notification");
}

// 18.x adviser notification triage
if (
  !adviserNotifyEngine.includes("filterAdviserNotifications") ||
  !adviserNotifyEngine.includes("classifyAdviserNotificationKind")
) {
  failures.push("adviser-notifications engine missing triage helpers");
}
if (!notifyService.includes("markAllNotificationsRead")) {
  failures.push("notifications service missing markAllNotificationsRead");
}
mustExist("src/app/api/notifications/mark-all-read/route.ts");
if (!adviserNotifyPage.includes("Mark all as read") || !adviserNotifyPage.includes("mark-all-read")) {
  failures.push("adviser notifications page missing mark-all-read UI");
}
if (!adviserNotifyPage.includes("Care receipts") || !adviserNotifyPage.includes("care_receipt")) {
  failures.push("adviser notifications page missing triage kind chips");
}
if (!smokeLocal.includes("read=unread") || !smokeLocal.includes("mark-all-read")) {
  failures.push("smoke-journeys missing triage / mark-all-read coverage");
}
if (!smokeHosted.includes("read=unread")) {
  failures.push("smoke-hosted missing unread triage path");
}
if (!seed.includes("Customer shared wealth briefing")) {
  failures.push("seed missing adviser share notification for triage demo");
}
if (!demo.includes("Mark all as read") && !demo.includes("triage")) {
  failures.push("DEMO_SCRIPT.md missing notification triage beat");
}

// 19.x customer notification triage
mustExist("src/engines/customer-notifications.ts");
const customerNotifyEngine = read("src/engines/customer-notifications.ts");
if (
  !customerNotifyEngine.includes("filterCustomerNotifications") ||
  !customerNotifyEngine.includes("classifyCustomerNotificationKind") ||
  !customerNotifyEngine.includes("buildCustomerNotificationPulse")
) {
  failures.push("customer-notifications engine missing triage / pulse helpers");
}
if (!notifyService.includes("loadCustomerNotificationPulse")) {
  failures.push("notifications service missing loadCustomerNotificationPulse");
}
const customerNotifyPage = read("src/app/app/notifications/page.tsx");
if (!customerNotifyPage.includes("Mark all as read") || !customerNotifyPage.includes("mark-all-read")) {
  failures.push("customer notifications page missing mark-all-read UI");
}
if (!customerNotifyPage.includes("care_update") || !customerNotifyPage.includes("Cadence")) {
  failures.push("customer notifications page missing triage kind chips");
}
const customerHome = read("src/app/app/page.tsx");
if (!customerHome.includes("loadCustomerNotificationPulse")) {
  failures.push("customer Home missing notification pulse");
}
if (
  !smokeLocal.includes("/app/notifications") ||
  !smokeLocal.includes("kind=care_update") ||
  !smokeLocal.includes("mark-all-read (customer)")
) {
  failures.push("smoke-journeys missing customer notification triage coverage");
}
if (
  !smokeHosted.includes("/app/notifications") ||
  !smokeHosted.includes("kind=care_update") ||
  !smokeHosted.includes("kind=cadence")
) {
  failures.push("smoke-hosted missing customer notification triage paths");
}
if (!seed.includes("Weekly wealth digest ready")) {
  failures.push("seed missing customer cadence notification for triage demo");
}
if (!demo.includes("unread notifications") && !demo.includes("Notifications** triage")) {
  failures.push("DEMO_SCRIPT.md missing customer notification triage beat");
}

// 20.x Wealth Inbox triage
mustExist("src/engines/inbox-triage.ts");
const inboxTriageEngine = read("src/engines/inbox-triage.ts");
if (
  !inboxTriageEngine.includes("filterInboxItems") ||
  !inboxTriageEngine.includes("classifyInboxKind") ||
  !inboxTriageEngine.includes("buildInboxPulse")
) {
  failures.push("inbox-triage engine missing triage / pulse helpers");
}
const inboxService = read("src/services/inbox.ts");
if (!inboxService.includes("markAllInboxRead")) {
  failures.push("inbox service missing markAllInboxRead");
}
mustExist("src/app/api/inbox/mark-all-read/route.ts");
const inboxPage = read("src/app/app/inbox/page.tsx");
if (!inboxPage.includes("Mark all as read") || !inboxPage.includes("mark-all-read")) {
  failures.push("inbox page missing mark-all-read UI");
}
if (!inboxPage.includes("recommendation") || !inboxPage.includes("Recommendations")) {
  failures.push("inbox page missing triage kind chips");
}
if (!customerHome.includes("status=unread") || !customerHome.includes("/app/inbox")) {
  failures.push("customer Home missing unread inbox deep-link");
}
if (
  !smokeLocal.includes("/app/inbox?status=unread") ||
  !smokeLocal.includes("kind=recommendation") ||
  !smokeLocal.includes("mark-all-read (inbox)")
) {
  failures.push("smoke-journeys missing Wealth Inbox triage coverage");
}
if (
  !smokeHosted.includes("/app/inbox") ||
  !smokeHosted.includes("kind=recommendation") ||
  !smokeHosted.includes("kind=adviser")
) {
  failures.push("smoke-hosted missing Wealth Inbox triage paths");
}
if (!demo.includes("/app/inbox?status=unread") && !demo.includes("Wealth Inbox unread")) {
  failures.push("DEMO_SCRIPT.md missing Wealth Inbox triage beat");
}

// 21.x Home next-steps pulse
mustExist("src/engines/next-steps.ts");
mustExist("src/services/next-steps.ts");
mustExist("src/app/api/next-steps/route.ts");
const nextStepsEngine = read("src/engines/next-steps.ts");
if (
  !nextStepsEngine.includes("buildNextStepsPulse") ||
  !nextStepsEngine.includes("formatNextStepsAiContent") ||
  !nextStepsEngine.includes("do_nothing")
) {
  failures.push("next-steps engine missing pulse / AI / do-nothing helpers");
}
const nextStepsService = read("src/services/next-steps.ts");
if (!nextStepsService.includes("loadNextStepsPulse")) {
  failures.push("next-steps service missing loadNextStepsPulse");
}
if (!customerHome.includes("loadNextStepsPulse") || !customerHome.includes("Needs your attention")) {
  failures.push("customer Home missing next-steps pulse UI");
}
const aiChat = read("src/app/api/ai/chat/route.ts");
if (!aiChat.includes("loadNextStepsPulse") || !aiChat.includes("nextSteps")) {
  failures.push("AI chat route missing next-steps grounding");
}
if (
  !smokeLocal.includes("/api/next-steps") ||
  !smokeLocal.includes("primaryHref") ||
  !smokeLocal.includes("What should I do next?")
) {
  failures.push("smoke-journeys missing next-steps / WealthAI coverage");
}
if (!smokeHosted.includes("/api/next-steps")) {
  failures.push("smoke-hosted missing /api/next-steps");
}
if (!demo.includes("next-steps") && !demo.includes("What should I do next?")) {
  failures.push("DEMO_SCRIPT.md missing next-steps beat");
}

// 22.x Adviser book next-steps
mustExist("src/engines/adviser-next-steps.ts");
mustExist("src/services/adviser-next-steps.ts");
mustExist("src/app/api/adviser/next-steps/route.ts");
const adviserNextEngine = read("src/engines/adviser-next-steps.ts");
if (
  !adviserNextEngine.includes("buildAdviserNextStepsPulse") ||
  !adviserNextEngine.includes("do_nothing") ||
  !adviserNextEngine.includes("complaints")
) {
  failures.push("adviser-next-steps engine missing pulse / ranking helpers");
}
const adviserNextService = read("src/services/adviser-next-steps.ts");
if (!adviserNextService.includes("loadAdviserNextStepsPulse")) {
  failures.push("adviser-next-steps service missing loadAdviserNextStepsPulse");
}
if (
  !adviserHomePage.includes("loadAdviserNextStepsPulse") ||
  !adviserHomePage.includes("Needs your attention")
) {
  failures.push("adviser home missing book next-steps pulse UI");
}
if (
  !smokeLocal.includes("/api/adviser/next-steps") ||
  !smokeLocal.includes("adviser next-steps first href") ||
  !smokeLocal.includes("adviser next-steps first item missing kind")
) {
  failures.push("smoke-journeys missing adviser next-steps coverage");
}
if (!smokeHosted.includes("/api/adviser/next-steps")) {
  failures.push("smoke-hosted missing /api/adviser/next-steps");
}
if (!demo.includes("book next-steps") && !demo.includes("Needs your attention** book")) {
  failures.push("DEMO_SCRIPT.md missing adviser book next-steps beat");
}

// 23.x Adviser WealthAI book next-steps
mustExist("src/app/api/adviser/ai/route.ts");
mustExist("src/app/adviser/ai/page.tsx");
if (
  !adviserNextEngine.includes("formatAdviserNextStepsAiContent") ||
  !adviserNextEngine.includes("wantsAdviserBookNextSteps")
) {
  failures.push("adviser-next-steps engine missing AI format helpers");
}
if (
  !orchestrator.includes("runAdviserWealthAI") ||
  !orchestrator.includes("adviserNextStepsPulse")
) {
  failures.push("orchestrator missing runAdviserWealthAI / adviserNextStepsPulse");
}
const adviserAiRoute = read("src/app/api/adviser/ai/route.ts");
if (
  !adviserAiRoute.includes("loadAdviserNextStepsPulse") ||
  !adviserAiRoute.includes("runAdviserWealthAI")
) {
  failures.push("adviser AI route missing pulse grounding");
}
const adviserAiPage = read("src/app/adviser/ai/page.tsx");
if (
  !adviserAiPage.includes("/api/adviser/ai") ||
  !adviserAiPage.includes("What should I do next for my book?")
) {
  failures.push("adviser AI page missing book next-steps chat UI");
}
if (!adviserHomePage.includes("/adviser/ai")) {
  failures.push("adviser home missing WealthAI book CTA");
}
if (
  !smokeLocal.includes("/api/adviser/ai") ||
  !smokeLocal.includes("adviserNextStepsPulse") ||
  !smokeLocal.includes("CoachAI") ||
  !smokeLocal.includes("What should I do next for my book?")
) {
  failures.push("smoke-journeys missing adviser WealthAI book coverage");
}
if (
  !smokeHosted.includes("/api/adviser/ai") ||
  !smokeHosted.includes("/adviser/ai") ||
  !smokeHosted.includes("adviserNextStepsPulse")
) {
  failures.push("smoke-hosted missing adviser WealthAI book coverage");
}
if (
  !demo.includes("WealthAI (book)") &&
  !demo.includes("What should I do next for my book?")
) {
  failures.push("DEMO_SCRIPT.md missing adviser WealthAI book beat");
}

// 24.x Admin/ops next-steps
mustExist("src/engines/ops-next-steps.ts");
mustExist("src/services/ops-next-steps.ts");
mustExist("src/app/api/admin/next-steps/route.ts");
const opsNextEngine = read("src/engines/ops-next-steps.ts");
if (
  !opsNextEngine.includes("buildOpsNextStepsPulse") ||
  !opsNextEngine.includes("do_nothing") ||
  !opsNextEngine.includes("complaints")
) {
  failures.push("ops-next-steps engine missing pulse / ranking helpers");
}
const opsNextService = read("src/services/ops-next-steps.ts");
if (!opsNextService.includes("loadOpsNextStepsPulse")) {
  failures.push("ops-next-steps service missing loadOpsNextStepsPulse");
}
const adminNextRoute = read("src/app/api/admin/next-steps/route.ts");
if (!adminNextRoute.includes("loadOpsNextStepsPulse")) {
  failures.push("admin next-steps route missing loadOpsNextStepsPulse");
}
if (
  !adminOps.includes("loadOpsNextStepsPulse") ||
  !adminOps.includes("Needs your attention")
) {
  failures.push("admin ops page missing next-steps pulse UI");
}
const adminHomePage = read("src/app/admin/page.tsx");
if (
  !adminHomePage.includes("loadOpsNextStepsPulse") ||
  !adminHomePage.includes("Needs your attention")
) {
  failures.push("admin home missing ops next-steps pulse UI");
}
if (
  !smokeLocal.includes("/api/admin/next-steps") ||
  !smokeLocal.includes("ops next-steps first href") ||
  !smokeLocal.includes("ops next-steps first item missing kind")
) {
  failures.push("smoke-journeys missing ops next-steps coverage");
}
if (!smokeHosted.includes("/api/admin/next-steps")) {
  failures.push("smoke-hosted missing /api/admin/next-steps");
}
if (!demo.includes("ops next-steps") && !demo.includes("Needs your attention** ops")) {
  failures.push("DEMO_SCRIPT.md missing admin/ops next-steps beat");
}

// 25.x Admin WealthAI ops next-steps
mustExist("src/app/api/admin/ai/route.ts");
mustExist("src/app/admin/ai/page.tsx");
if (
  !opsNextEngine.includes("formatOpsNextStepsAiContent") ||
  !opsNextEngine.includes("wantsOpsNextSteps")
) {
  failures.push("ops-next-steps engine missing AI format helpers");
}
if (
  !orchestrator.includes("runAdminWealthAI") ||
  !orchestrator.includes("opsNextStepsPulse")
) {
  failures.push("orchestrator missing runAdminWealthAI / opsNextStepsPulse");
}
const adminAiRoute = read("src/app/api/admin/ai/route.ts");
if (
  !adminAiRoute.includes("loadOpsNextStepsPulse") ||
  !adminAiRoute.includes("runAdminWealthAI")
) {
  failures.push("admin AI route missing pulse grounding");
}
const adminAiPage = read("src/app/admin/ai/page.tsx");
if (
  !adminAiPage.includes("/api/admin/ai") ||
  !adminAiPage.includes("What should I do next for ops?")
) {
  failures.push("admin AI page missing ops next-steps chat UI");
}
if (!adminOps.includes("/admin/ai") || !adminHomePage.includes("/admin/ai")) {
  failures.push("admin pages missing WealthAI ops CTA");
}
if (
  !smokeLocal.includes("/api/admin/ai") ||
  !smokeLocal.includes("opsNextStepsPulse") ||
  !smokeLocal.includes("What should I do next for ops?") ||
  !smokeLocal.includes("admin ai ops_next_steps expected CoachAI agent")
) {
  failures.push("smoke-journeys missing admin WealthAI ops coverage");
}
if (
  !smokeHosted.includes("/api/admin/ai") ||
  !smokeHosted.includes("/admin/ai") ||
  !smokeHosted.includes("opsNextStepsPulse")
) {
  failures.push("smoke-hosted missing admin WealthAI ops coverage");
}
if (
  !demo.includes("WealthAI (ops)") &&
  !demo.includes("What should I do next for ops?")
) {
  failures.push("DEMO_SCRIPT.md missing admin WealthAI ops beat");
}

// 26.x Ops care remind
mustExist("src/engines/ops-care-remind.ts");
mustExist("src/services/ops-care-remind.ts");
mustExist("src/app/api/admin/care-remind/route.ts");
mustExist("src/components/OpsCareRemindButton.tsx");
const opsCareRemindEngine = read("src/engines/ops-care-remind.ts");
if (
  !opsCareRemindEngine.includes("buildOpsCareRemindDraft") ||
  !opsCareRemindEngine.includes("queues stay open")
) {
  failures.push("ops-care-remind engine missing draft / queues-stay-open copy");
}
const opsCareRemindService = read("src/services/ops-care-remind.ts");
if (
  !opsCareRemindService.includes("sendOpsCareReminds") ||
  !opsCareRemindService.includes("OPS_CARE_REMIND")
) {
  failures.push("ops-care-remind service missing send / audit");
}
const careRemindRoute = read("src/app/api/admin/care-remind/route.ts");
if (!careRemindRoute.includes("sendOpsCareReminds")) {
  failures.push("care-remind route missing sendOpsCareReminds");
}
if (
  !adminOps.includes("OpsCareRemindButton") ||
  !adminOps.includes("unackedCareCustomers")
) {
  failures.push("admin ops page missing care remind CTA");
}
if (
  !adviserNotifyEngine.includes("care_handoff") ||
  !adviserNotifyPage.includes("care_handoff")
) {
  failures.push("adviser notifications missing Care handoff kind");
}
if (
  !smokeLocal.includes("/api/admin/care-remind") ||
  !smokeLocal.includes("admin care-remind missing queues-stay-open note") ||
  !smokeLocal.includes("adviser care_handoff notification missing after ops care-remind")
) {
  failures.push("smoke-journeys missing ops care remind coverage");
}
if (
  !smokeHosted.includes("/api/admin/care-remind") ||
  !smokeHosted.includes("kind=care_handoff")
) {
  failures.push("smoke-hosted missing ops care remind coverage");
}
if (!demo.includes("Remind linked advisers") && !demo.includes("Care handoff")) {
  failures.push("DEMO_SCRIPT.md missing ops care remind beat");
}

if (failures.length) {
  console.error("Pilot freeze check FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`Pilot freeze check OK — WealthOS ${version}`);
console.log("Still complete human LAUNCH_REVIEW.md sign-off before public/regulated traffic.");
