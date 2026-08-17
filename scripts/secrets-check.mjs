/**
 * Secrets hygiene gate — no committed .env / private keys; .env.example present.
 *
 *   npm run secrets:check
 *
 * Does not replace owner hygiene on the hosted pilot env.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const failures = [];

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

const tracked = spawnSync("git", ["ls-files", "-z"], {
  cwd: root,
  encoding: "buffer",
  maxBuffer: 32 * 1024 * 1024,
});
if (tracked.status !== 0) {
  failures.push("git ls-files failed — run from a git checkout");
}

const trackedFiles = tracked.status === 0
  ? tracked.stdout
      .toString("utf8")
      .split("\0")
      .filter(Boolean)
  : [];

const forbiddenNames = new Set([
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  "credentials.json",
  "service-account.json",
]);

for (const f of trackedFiles) {
  const base = f.split(/[/\\]/).pop() ?? f;
  if (forbiddenNames.has(base) || base === ".env") {
    failures.push(`tracked secret-like file must not be committed: ${f}`);
  }
  if (/^\.env\./.test(base) && !base.endsWith(".example") && !base.includes("example")) {
    failures.push(`tracked env file must not be committed: ${f}`);
  }
}

if (!existsSync(join(root, ".env.example"))) {
  failures.push("missing .env.example");
} else {
  const example = read(".env.example");
  for (const key of ["DATABASE_URL", "SESSION_SECRET", "DEMO_MODE"]) {
    if (!example.includes(`${key}=`) && !example.includes(`${key} =`)) {
      failures.push(`.env.example missing ${key}`);
    }
  }
  if (!example.includes("wealthos-mvp-dev-secret") && !example.includes("change-in-production")) {
    failures.push(".env.example should document the MVP/default SESSION_SECRET pattern");
  }
}

const gitignore = existsSync(join(root, ".gitignore")) ? read(".gitignore") : "";
if (!gitignore.split(/\r?\n/).some((line) => line.trim() === ".env")) {
  failures.push(".gitignore must ignore .env");
}

const privateKey = /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/;
const openaiLive = /\bsk-[A-Za-z0-9]{20,}\b/;
const awsKey = /\bAKIA[0-9A-Z]{16}\b/;

const skipScan = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
]);

for (const f of trackedFiles) {
  if (skipScan.has(f.split(/[/\\]/).pop() ?? "")) continue;
  if (/\.(png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot|pdf|db|sqlite)$/i.test(f)) continue;
  let text;
  try {
    text = readFileSync(join(root, f), "utf8");
  } catch {
    continue;
  }
  if (privateKey.test(text)) {
    failures.push(`private key material in tracked file: ${f}`);
  }
  if (openaiLive.test(text)) {
    failures.push(`looks like a live OpenAI key in tracked file: ${f}`);
  }
  if (awsKey.test(text)) {
    failures.push(`looks like an AWS access key in tracked file: ${f}`);
  }
}

console.log("WealthOS secrets hygiene check");
console.log(`  scanned ${trackedFiles.length} tracked files`);

if (failures.length) {
  console.error("Secrets check FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("Secrets check OK — .env stays local; .env.example is the template");
console.log("Still keep hosted SESSION_SECRET / DEMO_MODE out of git and out of screenshots.");
