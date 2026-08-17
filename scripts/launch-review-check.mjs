/**
 * Engineering LAUNCH_REVIEW evidence gate.
 * Verifies code-path evidence for section B product rules — not legal/staffing sign-off.
 *
 *   npm run launch:review
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

function read(rel) {
  const p = join(root, rel);
  if (!existsSync(p)) {
    failures.push(`missing file ${rel}`);
    return "";
  }
  return readFileSync(p, "utf8");
}

function mustInclude(rel, needles, label) {
  const text = read(rel);
  if (!text) return;
  for (const n of needles) {
    if (!text.includes(n)) {
      failures.push(`${label}: ${rel} missing ${JSON.stringify(n)}`);
    }
  }
}

function mustExist(rel) {
  if (!existsSync(join(root, rel))) failures.push(`missing ${rel}`);
}

mustExist("LAUNCH_REVIEW.md");
mustExist("src/engines/suitability.ts");
mustExist("src/engines/wealthguard.ts");
mustExist("src/engines/nbfa.ts");

mustInclude(
  "src/engines/suitability.ts",
  ["assessSuitability", "SUITABILITY_VERSION"],
  "suitability",
);
mustInclude(
  "src/ai/orchestrator.ts",
  ["assessSuitability"],
  "suitability-before-return",
);

mustInclude(
  "src/engines/wealthguard.ts",
  ["Never auto-labels", "Safe", "Scam", "Fraud"],
  "wealthguard",
);

mustInclude(
  "src/engines/nbfa.ts",
  ["Can recommend no transaction", "Do nothing"],
  "nbfa-do-nothing",
);
mustInclude("src/engines/next-steps.ts", ["do_nothing"], "next-steps-do-nothing");

mustInclude(
  "src/app/api/ai/chat/route.ts",
  ["consent is not active", "WealthAI personalisation is paused"],
  "consent-blocks-ai",
);

mustInclude(
  "src/components/ActionFeedback.tsx",
  ["stepUpCode", "needsStepUp"],
  "material-step-up",
);
mustInclude("src/services/execution.ts", ["fundsMoved: false", "stepUpVerified"], "execution-rail");

mustInclude(
  "src/app/app/crypto/page.tsx",
  ["No trading", "deferred"],
  "crypto-deferral",
);
mustInclude(
  "src/app/app/lending/page.tsx",
  ["No loan offers", "does not originate loans"],
  "lending-deferral",
);

mustInclude("src/engines/tax.ts", ["not filing software"], "tax-not-filing");
mustInclude("src/app/app/tax/page.tsx", ["not a tax return"], "tax-page");
mustInclude("src/app/app/estate/page.tsx", ["not legal drafting"], "estate-not-legal");

mustInclude(
  "src/app/admin/escalations/page.tsx",
  ['"resolved"', "update"],
  "escalations-resolve",
);
mustInclude(
  "src/app/api/admin/escalations/route.ts",
  ["resolved"],
  "escalations-api",
);

const launchReview = read("LAUNCH_REVIEW.md");
if (launchReview && !launchReview.includes("launch:review")) {
  failures.push("LAUNCH_REVIEW.md missing launch:review engineering gate note");
}

if (failures.length) {
  console.error("Launch review evidence check FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("Launch review evidence check OK (engineering section B code paths)");
console.log("Still complete legal counsel + staffing sign-off in LAUNCH_REVIEW.md before public traffic.");
