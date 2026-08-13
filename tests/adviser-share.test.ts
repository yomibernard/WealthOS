import { describe, expect, it } from "vitest";
import { buildAdviserSharePack } from "@/engines/adviser-share";
import { existsSync } from "node:fs";
import { join } from "node:path";

describe("adviser share pack", () => {
  it("builds a full briefing body", () => {
    const pack = buildAdviserSharePack({
      customerName: "Yomi",
      packType: "full",
      netWorthNgn: 100_000_000,
      confidence: 0.8,
      healthScore: 72,
      profileScore: 75,
      behindGoalCount: 1,
      monthlyFundingGapNgn: 40_000,
      staleAssetCount: 1,
      digestHeadline: "One area needs a calm look this week.",
      profileSummary: "Good progress.",
      fundingSummary: "1 goal needs funding.",
      noteFromCustomer: "Please focus on school fees.",
    });
    expect(pack.title).toMatch(/briefing/i);
    expect(pack.body).toContain("Yomi");
    expect(pack.body).toContain("school fees");
    expect(pack.body).toContain("informational");
  });

  it("supports digest-only packs", () => {
    const pack = buildAdviserSharePack({
      customerName: "Amaka",
      packType: "weekly_digest",
      netWorthNgn: 50_000_000,
      confidence: 0.7,
      healthScore: 65,
      profileScore: 50,
      behindGoalCount: 0,
      monthlyFundingGapNgn: 0,
      staleAssetCount: 0,
      digestHeadline: "A quiet week.",
    });
    expect(pack.title).toMatch(/digest/i);
    expect(pack.body).toContain("quiet week");
  });

  it("keeps share API on disk", () => {
    expect(existsSync(join(process.cwd(), "src/app/api/adviser/share/route.ts"))).toBe(true);
    expect(existsSync(join(process.cwd(), "src/engines/adviser-share.ts"))).toBe(true);
  });
});
