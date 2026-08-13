import { describe, expect, it } from "vitest";
import { analyseCrypto } from "@/engines/crypto";

describe("crypto lite", () => {
  it("defers trading capabilities and flags concentration", () => {
    const result = analyseCrypto(
      [
        {
          id: "1",
          name: "BTC (self-custody estimate)",
          value: 5_000,
          currency: "USD",
          ownershipPercent: 100,
          confidence: 0.5,
          lastValuationDate: new Date("2026-01-01"),
          verificationStatus: "ESTIMATED",
        },
      ],
      50_000_000,
      (c, a) => (c === "USD" ? a * 1600 : a),
      new Date("2026-08-13"),
    );
    expect(result.totalCryptoNgn).toBe(8_000_000);
    expect(result.concentrationOfAssets).toBeCloseTo(0.16);
    expect(result.staleCount).toBe(1);
    expect(result.deferredCapabilities.some((d) => /Buy|sell|execution/i.test(d))).toBe(true);
    expect(result.disclaimer.toLowerCase()).toContain("does not execute");
  });

  it("handles empty inventory", () => {
    const result = analyseCrypto([], 0, (_c, a) => a);
    expect(result.holdings).toHaveLength(0);
    expect(result.narrative.toLowerCase()).toMatch(/deferred|trading/);
  });
});
