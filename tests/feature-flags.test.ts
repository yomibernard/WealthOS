import { describe, expect, it } from "vitest";
import { getFeatureFlags, requireFlag } from "@/lib/feature-flags";

describe("feature flags", () => {
  it("exposes boolean flags", () => {
    const flags = getFeatureFlags();
    expect(typeof flags.partnerExecution).toBe("boolean");
    expect(typeof flags.household).toBe("boolean");
    expect(typeof flags.weeklyDigest).toBe("boolean");
  });

  it("requireFlag fails closed when disabled", () => {
    const prev = process.env.FF_HOUSEHOLD;
    process.env.FF_HOUSEHOLD = "false";
    const result = requireFlag("household");
    expect(result.ok).toBe(false);
    if (prev == null) delete process.env.FF_HOUSEHOLD;
    else process.env.FF_HOUSEHOLD = prev;
  });
});
