import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("launch:local-a umbrella", () => {
  it(
    "ships and passes engineering local-A gates",
    () => {
      const root = process.cwd();
      expect(existsSync(join(root, "scripts", "launch-local-a.mjs"))).toBe(true);
      const pkg = readFileSync(join(root, "package.json"), "utf8");
      expect(pkg).toContain("launch:local-a");
      const script = readFileSync(join(root, "scripts", "launch-local-a.mjs"), "utf8");
      expect(script).toContain("secrets:check");
      expect(script).toContain("launch:rehearse-prod");
      expect(script).toContain("smoke:hosted-ready");
      const res = spawnSync("node", [join("scripts", "launch-local-a.mjs")], {
        cwd: root,
        encoding: "utf8",
      });
      expect(res.status).toBe(0);
      expect(res.stdout).toMatch(/launch:local-a OK/);
    },
    60_000,
  );
});
