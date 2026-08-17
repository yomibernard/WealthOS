import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { evaluateLaunchGate } from "@/lib/launch-gate";

describe("launch gate", () => {
  it("blocks weak secrets in production profile", () => {
    const prev = process.env.NODE_ENV;
    const prevLaunch = process.env.LAUNCH_PROFILE;
    process.env.LAUNCH_PROFILE = "production";
    process.env.NODE_ENV = "production";

    const report = evaluateLaunchGate({
      ...process.env,
      NODE_ENV: "production",
      LAUNCH_PROFILE: "production",
      SESSION_SECRET: "wealthos-mvp-dev-secret-change-in-production",
      DEMO_MODE: "true",
      DATABASE_URL: "file:./dev.db",
    });

    expect(report.ok).toBe(false);
    expect(report.checks.some((c) => c.id === "session_secret" && !c.ok)).toBe(true);
    expect(report.checks.some((c) => c.id === "demo_mode" && !c.ok)).toBe(true);
    expect(report.checks.some((c) => c.id === "sqlite_in_prod" && !c.ok)).toBe(true);

    process.env.NODE_ENV = prev;
    if (prevLaunch == null) delete process.env.LAUNCH_PROFILE;
    else process.env.LAUNCH_PROFILE = prevLaunch;
  });

  it("passes a hardened production profile", () => {
    const report = evaluateLaunchGate({
      NODE_ENV: "production",
      LAUNCH_PROFILE: "production",
      SESSION_SECRET: "a-sufficiently-long-production-secret-key",
      DEMO_MODE: "false",
      DATABASE_URL: "postgresql://user:pass@host:5432/wealthos",
      FF_PARTNER_EXECUTION: "false",
    });
    expect(report.ok).toBe(true);
    expect(report.profile).toBe("production");
  });

  it(
    "ships launch:rehearse-prod and passes fixture rehearsal",
    () => {
      const root = process.cwd();
      expect(existsSync(join(root, "scripts", "launch-rehearse-prod.mjs"))).toBe(true);
      expect(existsSync(join(root, "scripts", "lib", "launch-evaluate.mjs"))).toBe(true);
      const res = spawnSync("node", [join("scripts", "launch-rehearse-prod.mjs")], {
        cwd: root,
        encoding: "utf8",
      });
      expect(res.status).toBe(0);
      expect(res.stdout).toMatch(/Prod launch rehearsal OK/);
    },
    60_000,
  );
});
