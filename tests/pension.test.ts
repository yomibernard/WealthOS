import { describe, expect, it } from "vitest";
import { analysePension } from "@/engines/pension";

describe("pension aggregation", () => {
  const now = new Date("2026-08-12");

  it("aggregates RSA and foreign pots", () => {
    const result = analysePension(
      [
        {
          id: "1",
          name: "RSA — Stanbic",
          assetType: "rsa",
          value: 28_500_000,
          currency: "NGN",
          ownershipPercent: 100,
          lastValuationDate: new Date("2026-06-01"),
          verificationStatus: "ESTIMATED",
          confidence: 0.8,
        },
        {
          id: "2",
          name: "UK workplace pension",
          assetType: "uk_pension",
          value: 40_000,
          currency: "GBP",
          ownershipPercent: 100,
          lastValuationDate: new Date("2025-01-01"),
          verificationStatus: "ESTIMATED",
          confidence: 0.7,
        },
      ],
      200_000_000,
      {
        targetAmount: 200_000_000,
        targetDate: new Date("2040-01-01"),
        existingAllocation: 28_500_000,
        monthlyContribution: 200_000,
      },
      (c, a) => (c === "GBP" ? a * 2000 : a),
      now,
    );

    expect(result.rsaNgn).toBe(28_500_000);
    expect(result.foreignNgn).toBe(80_000_000);
    expect(result.totalPensionNgn).toBe(108_500_000);
    expect(result.staleCount).toBe(1);
    expect(result.currencies).toEqual(expect.arrayContaining(["NGN", "GBP"]));
    expect(result.signals.some((s) => /RSA and foreign/i.test(s))).toBe(true);
  });

  it("handles empty pension graph", () => {
    const result = analysePension([], 0, null, (_c, a) => a, now);
    expect(result.pots).toHaveLength(0);
    expect(result.signals[0]).toMatch(/No pension/);
  });
});
