/**
 * Post-build performance budget check for WealthOS (App Router).
 * Shared JS = build-manifest rootMainFiles sizes on disk.
 * Largest client page = largest page.js under .next/static/chunks/app.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const budget = JSON.parse(readFileSync(join(root, "perf-budget.json"), "utf8"));
const nextDir = join(root, ".next");
const buildManifestPath = join(nextDir, "build-manifest.json");

if (!existsSync(nextDir) || !existsSync(buildManifestPath)) {
  console.error("No complete Next build found. Run npm run build first.");
  process.exit(1);
}

function fileKb(absOrRel) {
  const p = absOrRel.startsWith(nextDir) ? absOrRel : join(nextDir, absOrRel.replace(/^\//, ""));
  if (!existsSync(p)) return 0;
  return statSync(p).size / 1024;
}

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const buildManifest = JSON.parse(readFileSync(buildManifestPath, "utf8"));
const sharedFiles = (buildManifest.rootMainFiles ?? []).filter((f) => f.endsWith(".js"));
const sharedFirstLoadKb = sharedFiles.reduce((s, f) => s + fileKb(f), 0);

const appChunkFiles = walk(join(nextDir, "static", "chunks", "app")).filter((p) =>
  /page[-.].*\.js$/i.test(p) || p.endsWith(`${join("page")}.js`) || /[\\/]page-[^\\/]+\.js$/i.test(p),
);

let largestClientPageKb = 0;
let largestRoute = "";
for (const p of appChunkFiles) {
  const kb = fileKb(p);
  if (kb > largestClientPageKb) {
    largestClientPageKb = kb;
    largestRoute = p.split(`${join("static", "chunks", "app")}${join("")}`)[1] ?? p;
  }
}

const staticJs = walk(join(nextDir, "static", "chunks")).filter((p) => p.endsWith(".js"));
const totalKb = staticJs.reduce((s, p) => s + fileKb(p), 0);

const failures = [];
if (sharedFirstLoadKb > budget.maxSharedFirstLoadKb) {
  failures.push(
    `Shared first-load ${sharedFirstLoadKb.toFixed(1)}KB exceeds ${budget.maxSharedFirstLoadKb}KB`,
  );
}
if (largestClientPageKb > budget.maxLargestClientPageKb) {
  failures.push(
    `Largest client page ${largestClientPageKb.toFixed(1)}KB (${largestRoute}) exceeds ${budget.maxLargestClientPageKb}KB`,
  );
}
if (totalKb > budget.maxTotalStaticChunksKb) {
  failures.push(`Total static chunks ${totalKb.toFixed(0)}KB exceeds ${budget.maxTotalStaticChunksKb}KB`);
}

console.log("WealthOS performance budget check");
console.log(
  `  Shared first-load: ${sharedFirstLoadKb.toFixed(1)} KB (max ${budget.maxSharedFirstLoadKb})`,
);
console.log(
  `  Largest client page: ${largestClientPageKb.toFixed(1)} KB [${largestRoute || "n/a"}] (max ${budget.maxLargestClientPageKb})`,
);
console.log(`  Total static chunks JS: ${totalKb.toFixed(0)} KB (max ${budget.maxTotalStaticChunksKb})`);

if (failures.length) {
  console.error("\nBudget FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("\nBudget OK");
