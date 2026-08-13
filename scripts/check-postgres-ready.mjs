/**
 * Static readiness check before Postgres cutover.
 * Does not connect to a remote DB — validates schema portability + checklist presence.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const schema = readFileSync(join(root, "prisma", "schema.prisma"), "utf8");
const failures = [];

if (!existsSync(join(root, "POSTGRES_CUTOVER.md"))) {
  failures.push("POSTGRES_CUTOVER.md missing");
}
if (!existsSync(join(root, "prisma", "migrations-postgres", "20260813000000_init", "migration.sql"))) {
  failures.push("prisma/migrations-postgres init SQL missing");
}
if (!existsSync(join(root, "prisma", "schema.postgresql.prisma"))) {
  failures.push("prisma/schema.postgresql.prisma missing");
}
if (!existsSync(join(root, "docker-compose.yml"))) {
  failures.push("docker-compose.yml missing");
}

if (/Unsupported\(|sqlite_sequence|Datetime\("now"\)/i.test(schema)) {
  failures.push("Schema appears to use SQLite-specific constructs");
}

// WealthOS uses standard Prisma enums/scalars — flag Bytes/@db.TinyInt patterns if added later
if (/@db\.(TinyInt|UnsignedInt)/i.test(schema)) {
  failures.push("MySQL-specific @db attributes found — review for Postgres");
}

const provider = schema.match(/datasource\s+db\s*\{[^}]*provider\s*=\s*"([^"]+)"/s)?.[1];
console.log("WealthOS Postgres readiness (static)");
console.log(`  Current Prisma provider: ${provider ?? "unknown"}`);
console.log(`  Cutover checklist: ${existsSync(join(root, "POSTGRES_CUTOVER.md")) ? "present" : "missing"}`);

if (provider === "postgresql") {
  console.log("  Schema already targets postgresql");
} else if (provider === "sqlite") {
  console.log("  Still on sqlite locally — expected for MVP; follow POSTGRES_CUTOVER.md for prod");
} else {
  failures.push(`Unexpected provider: ${provider}`);
}

if (failures.length) {
  console.error("\nFAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("\nStatic readiness OK — complete POSTGRES_CUTOVER.md before production traffic");
