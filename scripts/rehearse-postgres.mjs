/**
 * End-to-end local Postgres rehearsal.
 * Requires Docker Desktop running.
 *
 *   npm run db:rehearse-postgres
 *
 * Steps: compose up → wait healthy → use-postgres → migrate deploy → optional seed → use-sqlite
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const pgUrl =
  process.env.POSTGRES_REHEARSAL_URL ||
  "postgresql://wealthos:wealthos_dev_only@localhost:5434/wealthos?schema=public";
const doSeed = process.env.REHEARSAL_SEED !== "false";

function run(cmd, args, env = {}) {
  console.log(`\n$ ${cmd} ${args.join(" ")}`);
  const res = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...env },
  });
  if (res.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(" ")}`);
  }
}

function dockerAvailable() {
  const res = spawnSync("docker", ["info"], { shell: true, encoding: "utf8" });
  return res.status === 0;
}

function sleep(ms) {
  spawnSync(process.execPath, ["-e", `Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,${ms})`], {
    shell: true,
    stdio: "ignore",
  });
}

function waitForPostgres(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const res = spawnSync(
      "docker",
      ["compose", "exec", "-T", "postgres", "pg_isready", "-U", "wealthos", "-d", "wealthos"],
      { shell: true, encoding: "utf8" },
    );
    if (res.status === 0) return;
    console.log(`Waiting for Postgres… (${i + 1}/${maxAttempts})`);
    sleep(2000);
  }
  throw new Error("Postgres did not become ready");
}

const envPath = join(root, ".env");
let originalEnv = null;
if (existsSync(envPath)) originalEnv = readFileSync(envPath, "utf8");

try {
  if (!dockerAvailable()) {
    console.error(
      "Docker daemon is not running. Start Docker Desktop, then re-run: npm run db:rehearse-postgres",
    );
    process.exit(2);
  }

  run("npm", ["run", "db:up"]);
  waitForPostgres();

  // Point .env DATABASE_URL at local compose Postgres for migrate/seed
  if (originalEnv != null) {
    let next = originalEnv;
    if (/^DATABASE_URL=/m.test(next)) {
      next = next.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL="${pgUrl}"`);
    } else {
      next += `\nDATABASE_URL="${pgUrl}"\n`;
    }
    writeFileSync(envPath, next);
  }

  run("npm", ["run", "db:use-postgres"]);
  run("npx", ["prisma", "generate"]);
  run("npx", ["prisma", "migrate", "deploy"]);
  if (doSeed) {
    console.log("\nSeeding demo data into Postgres (staging only)…");
    run("npm", ["run", "db:seed"]);
  }

  console.log("\nPostgres rehearsal SUCCEEDED");
  console.log("Restoring SQLite MVP provider…");
} catch (err) {
  console.error("\nPostgres rehearsal FAILED:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  try {
    run("npm", ["run", "db:use-sqlite"]);
  } catch {
    console.error("Could not restore sqlite provider — run npm run db:use-sqlite manually");
  }
  if (originalEnv != null) {
    writeFileSync(envPath, originalEnv);
    console.log("Restored original .env");
  }
  console.log("Docker Postgres left running (npm run db:down to stop)");
}
