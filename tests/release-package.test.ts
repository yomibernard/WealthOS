import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("release package", () => {
  const root = process.cwd();

  it("ships version, changelog, and rehearsal script", () => {
    expect(readFileSync(join(root, "VERSION"), "utf8").trim()).toBe("0.1.17");
    expect(readFileSync(join(root, "CHANGELOG.md"), "utf8")).toContain("0.1.17");
    expect(existsSync(join(root, "scripts", "release-check.mjs"))).toBe(true);
    expect(existsSync(join(root, "scripts", "rehearse-postgres.mjs"))).toBe(true);
    expect(existsSync(join(root, "scripts", "pilot-freeze-check.mjs"))).toBe(true);
    const pkg = readFileSync(join(root, "package.json"), "utf8");
    expect(pkg).toContain("release:check");
    expect(pkg).toContain("pilot:freeze");
  });
});
