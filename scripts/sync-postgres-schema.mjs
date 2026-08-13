/**
 * Writes prisma/schema.postgresql.prisma from prisma/schema.prisma
 * with datasource provider forced to postgresql.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const src = readFileSync(join(root, "prisma", "schema.prisma"), "utf8");
const out = src.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
if (out === src && !/provider\s*=\s*"postgresql"/.test(src)) {
  console.error("Could not find sqlite/postgresql datasource provider in schema.prisma");
  process.exit(1);
}
writeFileSync(join(root, "prisma", "schema.postgresql.prisma"), out);
console.log("Wrote prisma/schema.postgresql.prisma");
