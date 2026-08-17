import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("launch:local-a umbrella", () => {
  it("ships engineering local-A umbrella wiring", () => {
    const root = process.cwd();
    expect(existsSync(join(root, "scripts", "launch-local-a.mjs"))).toBe(true);
    const pkg = readFileSync(join(root, "package.json"), "utf8");
    expect(pkg).toContain("launch:local-a");
    const script = readFileSync(join(root, "scripts", "launch-local-a.mjs"), "utf8");
    expect(script).toContain("db:postgres-ready");
    expect(script).toContain("secrets:check");
    expect(script).toContain("launch:rehearse-prod");
    expect(script).toContain("launch:review");
    expect(script).toContain("smoke:hosted-ready");
    expect(script).toContain("ci:check");
    const deploy = readFileSync(join(root, "DEPLOY.md"), "utf8");
    expect(deploy).toContain("launch:local-a");
  });
});
