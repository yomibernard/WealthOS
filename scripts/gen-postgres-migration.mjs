/**
 * Regenerates prisma/migrations-postgres init SQL from current schema.
 * Requires network-free local prisma CLI.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();

// Sync postgres schema file first
spawnSync(process.execPath, [join(root, "scripts", "sync-postgres-schema.mjs")], {
  stdio: "inherit",
});

const result = spawnSync(
  "npx",
  [
    "prisma",
    "migrate",
    "diff",
    "--from-empty",
    "--to-schema-datamodel",
    "prisma/schema.postgresql.prisma",
    "--script",
  ],
  { encoding: "utf8", shell: true, cwd: root },
);

if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}

let sql = result.stdout || "";
// Strip any leading non-SQL noise
const idx = sql.indexOf("-- CreateSchema");
if (idx >= 0) sql = sql.slice(idx);
if (!sql.includes("CREATE TYPE") && !sql.includes("CREATE TABLE")) {
  console.error("Migration SQL looks empty or invalid");
  process.exit(1);
}

const dir = join(root, "prisma", "migrations-postgres", "20260813000000_init");
mkdirSync(dir, { recursive: true });
const sqlOut = sql.endsWith("\n") ? sql : sql + "\n";
// Write UTF-8 without BOM — Prisma migrate fails on FEFF
writeFileSync(join(dir, "migration.sql"), sqlOut, { encoding: "utf8" });
writeFileSync(
  join(root, "prisma", "migrations-postgres", "migration_lock.toml"),
  'provider = "postgresql"\n',
  { encoding: "utf8" },
);
console.log("Updated prisma/migrations-postgres/20260813000000_init/migration.sql");
