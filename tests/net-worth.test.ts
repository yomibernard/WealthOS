import { describe, expect, it } from "vitest";
import { calculateNetWorth } from "@/engines/net-worth";

const rates = [
  { from: "USD", to: "NGN", rate: 1600, asOf: new Date("2026-08-01"), source: "test" },
  { from: "GBP", to: "NGN", rate: 2050, asOf: new Date("2026-08-01"), source: "test" },
];

describe("net worth engine", () => {
  it("calculates attributable assets minus liabilities", () => {
    const result = calculateNetWorth(
      [
        {
          id: "a1",
          value: 10_000_000,
          currency: "NGN",
          ownershipPercent: 50,
          confidence: 1,
          lastValuationDate: new Date(),
          verificationStatus: "VERIFIED",
          category: "PROPERTY",
        },
        {
          id: "a2",
          value: 10_000,
          currency: "USD",
          ownershipPercent: 100,
          confidence: 1,
          lastValuationDate: new Date(),
          verificationStatus: "VERIFIED",
          category: "CASH",
        },
      ],
      [
        {
          id: "l1",
          balance: 2_000_000,
          currency: "NGN",
          ownershipPercent: 100,
          confidence: 1,
          lastValuationDate: new Date(),
        },
      ],
      rates,
    );

    // 5m + 16m - 2m = 19m
    expect(result.totalAssetsNgn).toBe(21_000_000);
    expect(result.totalLiabilitiesNgn).toBe(2_000_000);
    expect(result.netWorthNgn).toBe(19_000_000);
  });

  it("flags missing FX", () => {
    const result = calculateNetWorth(
      [
        {
          id: "eur",
          value: 1000,
          currency: "CHF",
          ownershipPercent: 100,
          confidence: 1,
          lastValuationDate: new Date(),
          verificationStatus: "ESTIMATED",
          category: "CASH",
        },
      ],
      [],
      rates,
    );
    expect(result.missingFx.length).toBe(1);
    expect(result.netWorthNgn).toBe(0);
  });

  it("handles joint ownership and stale valuations", () => {
    const stale = new Date();
    stale.setMonth(stale.getMonth() - 10);
    const result = calculateNetWorth(
      [
        {
          id: "p",
          value: 100,
          currency: "NGN",
          ownershipPercent: 25,
          confidence: 1,
          lastValuationDate: stale,
          verificationStatus: "ESTIMATED",
          category: "PROPERTY",
        },
      ],
      [],
      rates,
    );
    expect(result.netWorthNgn).toBe(25);
    expect(result.staleAssetIds).toContain("p");
    expect(result.confidence).toBeLessThan(1);
  });
});
