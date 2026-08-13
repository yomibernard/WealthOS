import { describe, expect, it } from "vitest";
import { buildWeeklyDigest } from "@/engines/weekly-digest";
import { classifyIntent } from "@/ai/orchestrator";
import { existsSync } from "node:fs";
import { join } from "node:path";

describe("weekly digest engine", () => {
  it("marks quiet weeks when nothing needs attention", () => {
    const dig = buildWeeklyDigest({
      name: "Yomi",
      netWorthNgn: 100_000_000,
      confidence: 0.85,
      healthScore: 78,
      emergencyMonths: 4,
      staleAssetCount: 0,
      dataQualityHighPriority: 0,
      behindGoalCount: 0,
      monthlyFundingGapNgn: 0,
      unreadInbox: 0,
      topInboxTitles: [],
      monthChangeNgn: 1_000_000,
    });
    expect(dig.headline.toLowerCase()).toContain("quiet");
    expect(dig.sections.every((s) => s.tone !== "watch")).toBe(true);
    expect(dig.disclaimer).toMatch(/informational/i);
  });

  it("surfaces watch items for stale data and funding gaps", () => {
    const dig = buildWeeklyDigest({
      name: "Amaka",
      netWorthNgn: 40_000_000,
      confidence: 0.55,
      healthScore: 60,
      emergencyMonths: 1.2,
      staleAssetCount: 2,
      dataQualityHighPriority: 2,
      behindGoalCount: 1,
      monthlyFundingGapNgn: 50_000,
      unreadInbox: 3,
      topInboxTitles: ["Stale valuations"],
      monthChangeNgn: null,
    });
    expect(dig.sections.filter((s) => s.tone === "watch").length).toBeGreaterThanOrEqual(2);
    expect(dig.nextSteps.length).toBeGreaterThan(0);
  });

  it("keeps digest routes on disk", () => {
    expect(existsSync(join(process.cwd(), "src/app/app/digest/page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "src/app/api/digest/weekly/route.ts"))).toBe(true);
  });
});

describe("weekly digest AI intent", () => {
  it("classifies digest questions", () => {
    expect(classifyIntent("Show my weekly wealth digest")).toBe("weekly_digest");
    expect(classifyIntent("Give me this week's summary")).toBe("weekly_digest");
  });
});
