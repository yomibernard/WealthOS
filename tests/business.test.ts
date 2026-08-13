import { describe, expect, it } from "vitest";
import { analyseBusiness } from "@/engines/business";

describe("business intelligence", () => {
  const now = new Date("2026-08-12");

  it("nets equity and flags concentration", () => {
    const result = analyseBusiness(
      [
        {
          id: "b1",
          name: "Logistics Co",
          value: 200_000_000,
          currency: "NGN",
          ownershipPercent: 60,
          lastValuationDate: new Date("2025-10-01"),
          verificationStatus: "ESTIMATED",
          confidence: 0.55,
        },
      ],
      [
        {
          id: "l1",
          name: "WC facility",
          balance: 45_000_000,
          currency: "NGN",
          ownershipPercent: 100,
          interestRate: 0.28,
        },
      ],
      250_000_000,
      5_000_000,
      3_500_000,
      (_c, a) => a,
      now,
    );

    expect(result.businessValueOwnedNgn).toBe(120_000_000);
    expect(result.businessDebtNgn).toBe(45_000_000);
    expect(result.netBusinessEquityNgn).toBe(75_000_000);
    expect(result.concentrationOfAssets).toBeCloseTo(0.48);
    expect(result.highInterestDebtNgn).toBe(45_000_000);
    expect(result.incomeDependencyShare).toBeCloseTo(0.7);
    expect(result.staleCount).toBe(1);
  });
});
