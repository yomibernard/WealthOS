/**
 * Umbrella release gate for WealthOS.
 * Runs launch check (dev profile), postgres-ready, launch:review, and optionally perf.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const steps = [
  { name: "launch:check", cmd: "npm", args: ["run", "launch:check"] },
  { name: "db:postgres-ready", cmd: "npm", args: ["run", "db:postgres-ready"] },
  { name: "launch:review", cmd: "npm", args: ["run", "launch:review"] },
  { name: "secrets:check", cmd: "npm", args: ["run", "secrets:check"] },
];

if (existsSync(join(root, ".next", "BUILD_ID"))) {
  steps.push({ name: "perf:check", cmd: "npm", args: ["run", "perf:check"] });
} else {
  console.log("Skipping perf:check (no .next build — run npm run build first for full gate)");
}

let failed = false;
for (const step of steps) {
  console.log(`\n==> ${step.name}`);
  const res = spawnSync(step.cmd, step.args, { cwd: root, stdio: "inherit", shell: true });
  if (res.status !== 0) {
    failed = true;
    console.error(`FAILED: ${step.name}`);
    break;
  }
}

if (failed) {
  console.error("\nRelease check FAILED");
  process.exit(1);
}
console.log("\nRelease check OK — still complete LAUNCH_REVIEW.md human sign-off before public traffic");
