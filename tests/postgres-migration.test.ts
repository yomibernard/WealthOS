import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("postgres migration package", () => {
  const root = process.cwd();
  const sqlPath = join(
    root,
    "prisma",
    "migrations-postgres",
    "20260813000000_init",
    "migration.sql",
  );
  const lockPath = join(root, "prisma", "migrations-postgres", "migration_lock.toml");
  const pgSchema = join(root, "prisma", "schema.postgresql.prisma");

  it("ships init migration SQL and lock", () => {
    expect(existsSync(sqlPath)).toBe(true);
    expect(existsSync(lockPath)).toBe(true);
    const sql = readFileSync(sqlPath, "utf8");
    expect(sql).toContain("CREATE TYPE");
    expect(sql).toContain('CREATE TABLE "User"');
    expect(sql).toContain('CREATE TABLE "InboxItem"');
    expect(sql).toContain('CREATE TABLE "AdviserNote"');
    expect(sql).toContain("CRYPTO");
    expect(readFileSync(lockPath, "utf8")).toContain("postgresql");
  });

  it("keeps a postgresql schema mirror", () => {
    expect(existsSync(pgSchema)).toBe(true);
    expect(readFileSync(pgSchema, "utf8")).toContain('provider = "postgresql"');
    expect(readFileSync(join(root, "prisma", "schema.prisma"), "utf8")).toContain(
      'provider = "sqlite"',
    );
  });
});
