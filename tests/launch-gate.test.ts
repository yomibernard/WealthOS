import { describe, expect, it } from "vitest";
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
});
