/**
 * Local engineering launch-A umbrella (no live host, no real prod secrets).
 *
 *   npm run launch:local-a
 *
 * Runs: db:postgres-ready → launch:rehearse-prod → launch:review → secrets:check → smoke:hosted-ready
 * Does not replace LAUNCH_PROFILE=production launch:check or live smoke:hosted.
 */
import { spawnSync } from "node:child_process";

const root = process.cwd();
const steps = [
  { name: "db:postgres-ready", cmd: "npm", args: ["run", "db:postgres-ready"] },
  { name: "launch:rehearse-prod", cmd: "npm", args: ["run", "launch:rehearse-prod"] },
  { name: "launch:review", cmd: "npm", args: ["run", "launch:review"] },
  { name: "secrets:check", cmd: "npm", args: ["run", "secrets:check"] },
  { name: "smoke:hosted-ready", cmd: "npm", args: ["run", "smoke:hosted-ready"] },
  { name: "ci:check", cmd: "npm", args: ["run", "ci:check"] },
];

console.log("WealthOS launch:local-a (engineering gates only)");
console.log(`cwd: ${root}`);

let failed = false;
for (const step of steps) {
  console.log(`\n==> ${step.name}`);
  const res = spawnSync(step.cmd, step.args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  if (res.status !== 0) {
    failed = true;
    console.error(`FAILED: ${step.name}`);
    break;
  }
}

if (failed) {
  console.error("\nlaunch:local-a FAILED");
  process.exit(1);
}

console.log("\nlaunch:local-a OK");
console.log(
  "Still run LAUNCH_PROFILE=production npm run launch:check and live smoke:hosted against the host before public pilot.",
);
