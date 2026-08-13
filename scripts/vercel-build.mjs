/**
 * Vercel / serverless build: Postgres schema + migrate + next build.
 * Local SQLite MVP is unchanged; this only runs in the deploy environment.
 *
 * Required env: DATABASE_URL (postgresql://...)
 * Optional: SKIP_MIGRATE_ON_BUILD=true to skip prisma migrate deploy
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: true, env: process.env });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const db = process.env.DATABASE_URL ?? "";
if (!db) {
  console.error("DATABASE_URL is required for build:vercel");
  process.exit(1);
}
if (db.startsWith("file:")) {
  console.error(
    "build:vercel requires a Postgres DATABASE_URL (got SQLite file:). See DEPLOY.md.",
  );
  process.exit(1);
}
if (!/^postgres(ql)?:\/\//i.test(db)) {
  console.warn("DATABASE_URL does not look like postgres:// — continuing anyway.");
}

console.log("==> activate Postgres schema + migrations");
run("node", ["scripts/use-database.mjs", "postgres"]);

console.log("==> prisma generate");
run("npx", ["prisma", "generate"]);

const skipMigrate = ["1", "true", "yes", "on"].includes(
  (process.env.SKIP_MIGRATE_ON_BUILD ?? "").toLowerCase(),
);
if (skipMigrate) {
  console.log("==> skip migrate (SKIP_MIGRATE_ON_BUILD)");
} else {
  if (!existsSync("prisma/migrations")) {
    console.error("prisma/migrations missing after postgres switch");
    process.exit(1);
  }
  console.log("==> prisma migrate deploy");
  run("npx", ["prisma", "migrate", "deploy"]);
}

console.log("==> next build");
run("npx", ["next", "build"]);
console.log("Vercel build OK");
