/**
 * CLI launch gate. Use LAUNCH_PROFILE=production to enforce prod blockers.
 */
import { evaluateLaunchEnv } from "./lib/launch-evaluate.mjs";

// Load .env lightly
try {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m || process.env[m[1]] != null) continue;
      process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  }
} catch {
  /* ignore */
}

const report = evaluateLaunchEnv(process.env);
console.log(`WealthOS launch check (${report.profile})`);
for (const c of report.checks) {
  const mark = c.ok ? "OK" : "FAIL";
  console.log(`  [${mark}] ${c.id}: ${c.message}`);
}
if (!report.ok) {
  console.error("\nLaunch gate FAILED — see LAUNCH_REVIEW.md");
  process.exit(1);
}
console.log("\nLaunch gate OK for this profile");
