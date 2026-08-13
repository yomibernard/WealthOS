import { describe, expect, it } from "vitest";
import { analyseLending } from "@/engines/lending";

describe("lending awareness", () => {
  it("computes debt service ratio and high-cost debt", () => {
    const result = analyseLending(
      [
        {
          id: "1",
          type: "BUSINESS_LOAN",
          name: "WC facility",
          balance: 45_000_000,
          currency: "NGN",
          ownershipPercent: 100,
          interestRate: 0.28,
          monthlyPayment: 1_500_000,
        },
        {
          id: "2",
          type: "CREDIT",
          name: "Card",
          balance: 800_000,
          currency: "NGN",
          ownershipPercent: 100,
          interestRate: 0.36,
          monthlyPayment: 80_000,
        },
      ],
      4_000_000,
      (_c, a) => a,
    );
    expect(result.totalDebtNgn).toBe(45_800_000);
    expect(result.monthlyDebtServiceNgn).toBe(1_580_000);
    expect(result.debtServiceRatio).toBeCloseTo(1_580_000 / 4_000_000);
    expect(result.highCostDebtNgn).toBe(45_800_000);
    expect(result.deferredCapabilities.some((d) => /origination|offers/i.test(d))).toBe(true);
  });
});
