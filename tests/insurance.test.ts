import { describe, expect, it } from "vitest";
import { analyseInsurance, parseSumAssured } from "@/engines/insurance";

describe("insurance inventory", () => {
  it("parses sum assured from notes", () => {
    expect(parseSumAssured("Sum assured ₦50m — protective", 0)).toBe(50_000_000);
    expect(parseSumAssured(null, 10_000_000)).toBe(10_000_000);
  });

  it("flags life and health gaps", () => {
    const result = analyseInsurance(
      [],
      24_000_000,
      (_c, a) => a,
      true,
    );
    expect(result.gaps.some((g) => /life/i.test(g))).toBe(true);
    expect(result.gaps.some((g) => /health/i.test(g))).toBe(true);
  });

  it("computes life multiple when cover exists", () => {
    const result = analyseInsurance(
      [
        {
          id: "1",
          name: "Life cover",
          assetType: "life",
          value: 0,
          currency: "NGN",
          notes: "Sum assured ₦50m",
          verificationStatus: "VERIFIED",
          confidence: 0.9,
        },
      ],
      10_000_000,
      (_c, a) => a,
    );
    expect(result.lifeMultipleOfIncome).toBeCloseTo(5);
    expect(result.coverTypesPresent).toContain("life");
  });
});
