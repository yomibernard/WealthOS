import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("ci workflow evidence gate", () => {
  it(
    "ships ci:check and passes workflow package evidence",
    () => {
      const root = process.cwd();
      expect(existsSync(join(root, "scripts", "ci-check.mjs"))).toBe(true);
      expect(existsSync(join(root, ".github", "workflows", "ci.yml"))).toBe(true);
      const pkg = readFileSync(join(root, "package.json"), "utf8");
      expect(pkg).toContain("ci:check");
      const release = readFileSync(join(root, "scripts", "release-check.mjs"), "utf8");
      expect(release).toContain("ci:check");
      const res = spawnSync("node", [join("scripts", "ci-check.mjs")], {
        cwd: root,
        encoding: "utf8",
      });
      expect(res.status).toBe(0);
      expect(res.stdout).toMatch(/CI check OK/);
    },
    60_000,
  );
});
