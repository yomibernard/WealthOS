import { describe, expect, it } from "vitest";
import { analyseProperty } from "@/engines/property";

describe("property intelligence", () => {
  const now = new Date("2026-08-12");

  it("computes equity, LTV and concentration", () => {
    const result = analyseProperty(
      [
        {
          id: "1",
          name: "Lekki home",
          value: 100_000_000,
          currency: "NGN",
          ownershipPercent: 50,
          incomeGenerated: 0,
          lastValuationDate: new Date("2026-07-01"),
          verificationStatus: "ESTIMATED",
          confidence: 0.7,
        },
        {
          id: "2",
          name: "Rental",
          value: 60_000_000,
          currency: "NGN",
          ownershipPercent: 100,
          incomeGenerated: 400_000,
          lastValuationDate: new Date("2025-01-01"),
          verificationStatus: "ESTIMATED",
          confidence: 0.6,
        },
      ],
      [
        {
          id: "m1",
          name: "Mortgage",
          balance: 20_000_000,
          currency: "NGN",
          ownershipPercent: 100,
        },
      ],
      200_000_000,
      (_c, a) => a,
      now,
    );

    expect(result.propertyValueOwnedNgn).toBe(110_000_000);
    expect(result.mortgageBalanceNgn).toBe(20_000_000);
    expect(result.equityNgn).toBe(90_000_000);
    expect(result.ltv).toBeCloseTo(20 / 110);
    expect(result.concentrationOfAssets).toBeCloseTo(0.55);
    expect(result.staleCount).toBe(1);
    expect(result.holdings[1].grossYield).toBeCloseTo((400_000 * 12) / 60_000_000);
  });

  it("handles empty portfolio", () => {
    const result = analyseProperty([], [], 0, (_c, a) => a, now);
    expect(result.holdings).toHaveLength(0);
    expect(result.signals[0]).toMatch(/No property/);
  });
});
