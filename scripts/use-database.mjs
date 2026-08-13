/**
 * Switch prisma/schema.prisma datasource provider between sqlite and postgresql.
 * Also installs/removes standard migrations folder for Postgres deploy.
 *
 *   node scripts/use-database.mjs sqlite
 *   node scripts/use-database.mjs postgres
 */
import {
  readFileSync,
  writeFileSync,
  cpSync,
  rmSync,
  existsSync,
  mkdirSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";

/** Rewrite text files without UTF-8 BOM (Windows PowerShell Set-Content often adds one). */
function stripBomTree(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) stripBomTree(p);
    else if (/\.(sql|toml|prisma|md)$/i.test(name.name)) {
      let text = readFileSync(p, "utf8");
      if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
      writeFileSync(p, text, { encoding: "utf8" });
    }
  }
}

const target = (process.argv[2] || "").toLowerCase();
if (!["sqlite", "postgres", "postgresql"].includes(target)) {
  console.error("Usage: node scripts/use-database.mjs <sqlite|postgres>");
  process.exit(1);
}

const root = process.cwd();
const schemaPath = join(root, "prisma", "schema.prisma");
let schema = readFileSync(schemaPath, "utf8");
const wantPg = target.startsWith("postgres");

if (wantPg) {
  schema = schema.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
  if (!/provider\s*=\s*"postgresql"/.test(schema)) {
    console.error("Failed to set postgresql provider");
    process.exit(1);
  }
  writeFileSync(schemaPath, schema);

  // Activate committed Postgres migrations for prisma migrate deploy
  const src = join(root, "prisma", "migrations-postgres");
  const dest = join(root, "prisma", "migrations");
  if (!existsSync(src)) {
    console.error("Missing prisma/migrations-postgres — regenerate with npm run db:gen-pg-migration");
    process.exit(1);
  }
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  stripBomTree(dest);
  console.log("schema.prisma -> postgresql");
  console.log("prisma/migrations <- migrations-postgres");
  console.log("Set DATABASE_URL to Postgres, then: npx prisma migrate deploy");
} else {
  schema = schema.replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"');
  if (!/provider\s*=\s*"sqlite"/.test(schema)) {
    console.error("Failed to set sqlite provider");
    process.exit(1);
  }
  writeFileSync(schemaPath, schema);
  const dest = join(root, "prisma", "migrations");
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
  console.log("schema.prisma -> sqlite");
  console.log("Removed prisma/migrations (Postgres migrations stay in migrations-postgres)");
  console.log("Use DATABASE_URL=file:./dev.db and npm run db:setup for local MVP");
}
