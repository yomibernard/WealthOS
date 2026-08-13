import { describe, expect, it } from "vitest";
import type { FeatureFlags } from "@/lib/feature-flags";
import {
  FLAG_PROFILES,
  bestMatchingProfile,
  envSnippetForProfile,
  evaluateFlagProfile,
  riskyFlagsOn,
} from "@/engines/flag-profiles";

function flags(partial: Partial<FeatureFlags>): FeatureFlags {
  return {
    partnerExecution: true,
    wealthGuardUploads: true,
    monthlyReports: true,
    llmPolish: true,
    openBankingDemo: true,
    household: true,
    propertyIntel: true,
    businessIntel: true,
    insuranceIntel: true,
    pensionIntel: true,
    wealthInbox: true,
    lifeEventAuto: true,
    estateLite: true,
    adviserCollab: true,
    taxLite: true,
    cryptoLite: true,
    lendingLite: true,
    weeklyDigest: true,
    ...partial,
  };
}

describe("flag profiles", () => {
  it("matches safe_pilot when partner and LLM are off", () => {
    const current = flags({ partnerExecution: false, llmPolish: false });
    const safe = FLAG_PROFILES.find((p) => p.id === "safe_pilot")!;
    const evaluation = evaluateFlagProfile(current, safe);
    expect(evaluation.match).toBe(true);
    expect(bestMatchingProfile(current).profileId).toBe("safe_pilot");
  });

  it("reports mismatches for incident lockdown", () => {
    const current = flags({ partnerExecution: true, llmPolish: true });
    const lockdown = FLAG_PROFILES.find((p) => p.id === "incident_lockdown")!;
    const evaluation = evaluateFlagProfile(current, lockdown);
    expect(evaluation.match).toBe(false);
    expect(evaluation.mismatches.some((m) => m.key === "partnerExecution")).toBe(true);
  });

  it("builds env snippets and lists risky flags", () => {
    const safe = FLAG_PROFILES.find((p) => p.id === "safe_pilot")!;
    const snippet = envSnippetForProfile(safe);
    expect(snippet).toContain("FF_PARTNER_EXECUTION=false");
    expect(snippet).toContain("FF_LLM_POLISH=false");
    expect(riskyFlagsOn(flags({ partnerExecution: true, llmPolish: false }))).toEqual([
      "partnerExecution",
    ]);
  });
});
