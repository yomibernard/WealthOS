import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("launch review evidence gate", () => {
  it("ships launch:review and passes engineering evidence checks", () => {
    const root = process.cwd();
    expect(existsSync(join(root, "scripts", "launch-review-check.mjs"))).toBe(true);
    const pkg = readFileSync(join(root, "package.json"), "utf8");
    expect(pkg).toContain("launch:review");
    const release = readFileSync(join(root, "scripts", "release-check.mjs"), "utf8");
    expect(release).toContain("launch:review");
    const res = spawnSync("node", [join("scripts", "launch-review-check.mjs")], {
      cwd: root,
      encoding: "utf8",
    });
    expect(res.status).toBe(0);
    expect(res.stdout).toMatch(/Launch review evidence check OK/);
  });
});
