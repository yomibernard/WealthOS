/**
 * CI workflow evidence gate — verifies the GitHub Actions package ships test/build/release.
 *
 *   npm run ci:check
 *
 * Does not call the GitHub API; owner still confirms the latest run is green on main.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];
const workflowRel = ".github/workflows/ci.yml";
const workflowPath = join(root, workflowRel);

if (!existsSync(workflowPath)) {
  failures.push(`missing ${workflowRel}`);
} else {
  const yml = readFileSync(workflowPath, "utf8");
  for (const needle of [
    "npm run test",
    "npm run build",
    "npm run release:check",
    "ubuntu-latest",
    "actions/checkout",
  ]) {
    if (!yml.includes(needle)) {
      failures.push(`${workflowRel} missing ${JSON.stringify(needle)}`);
    }
  }
  if (!yml.includes("push:") || !yml.includes("branches: [main]")) {
    failures.push(`${workflowRel} should run on push to main`);
  }
}

const pkg = readFileSync(join(root, "package.json"), "utf8");
if (!pkg.includes("release:check") || !pkg.includes("secrets:check")) {
  failures.push("package.json missing release:check / secrets:check for CI umbrella");
}

const release = readFileSync(join(root, "scripts", "release-check.mjs"), "utf8");
if (!release.includes("secrets:check") || !release.includes("launch:review")) {
  failures.push("release-check must include secrets:check and launch:review (CI runs it)");
}

const launch = readFileSync(join(root, "LAUNCH_REVIEW.md"), "utf8");
if (!launch.includes("ci:check") && !launch.includes("GitHub Actions")) {
  failures.push("LAUNCH_REVIEW.md should mention GitHub Actions / ci:check");
}

console.log("WealthOS CI workflow evidence check");
console.log(`  workflow: ${workflowRel}`);

if (failures.length) {
  console.error("CI check FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("CI check OK — workflow ships test · build · release:check");
console.log("Still confirm the latest GitHub Actions run is green on main before public pilot.");
