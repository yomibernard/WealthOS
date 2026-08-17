import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("secrets hygiene gate", () => {
  it("ships secrets:check and passes on this checkout", () => {
    const root = process.cwd();
    expect(existsSync(join(root, "scripts", "secrets-check.mjs"))).toBe(true);
    const pkg = readFileSync(join(root, "package.json"), "utf8");
    expect(pkg).toContain("secrets:check");
    const release = readFileSync(join(root, "scripts", "release-check.mjs"), "utf8");
    expect(release).toContain("secrets:check");
    const res = spawnSync("node", [join("scripts", "secrets-check.mjs")], {
      cwd: root,
      encoding: "utf8",
    });
    expect(res.status).toBe(0);
    expect(res.stdout).toMatch(/Secrets check OK/);
  });
});
