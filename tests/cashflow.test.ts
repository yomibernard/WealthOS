import { describe, expect, it } from "vitest";
import { analyseCashflow } from "@/engines/cashflow";

describe("cash-flow engine", () => {
  it("computes surplus and savings rate", () => {
    const result = analyseCashflow(
      [{ amount: 4_000_000, currency: "NGN", frequency: "monthly" }],
      [
        { amount: 2_000_000, currency: "NGN", frequency: "monthly", category: "housing" },
        { amount: 500_000, currency: "NGN", frequency: "monthly", category: "education" },
      ],
      (_c, a) => a,
    );
    expect(result.monthlySurplusNgn).toBe(1_500_000);
    expect(result.status).toBe("surplus");
    expect(result.largestExpenseCategory).toBe("housing");
    expect(result.savingsRate).toBeCloseTo(0.375);
  });

  it("flags deficit", () => {
    const result = analyseCashflow(
      [{ amount: 1_000_000, currency: "NGN", frequency: "monthly" }],
      [{ amount: 1_500_000, currency: "NGN", frequency: "monthly", category: "living" }],
      (_c, a) => a,
    );
    expect(result.status).toBe("deficit");
  });
});
