import { describe, expect, it } from "vitest";
import { analyseTaxLite, illustrativePit } from "@/engines/tax";

describe("tax lite", () => {
  it("computes progressive illustrative PIT", () => {
    expect(illustrativePit(0)).toBe(0);
    expect(illustrativePit(300_000)).toBeCloseTo(21_000);
    expect(illustrativePit(500_000)).toBeCloseTo(300_000 * 0.07 + 200_000 * 0.11);
  });

  it("flags mixed income profiles", () => {
    const result = analyseTaxLite(
      [
        { type: "salary", amount: 2_000_000, currency: "NGN", frequency: "monthly" },
        { type: "rental", label: "Abuja rent", amount: 450_000, currency: "NGN", frequency: "monthly" },
      ],
      (_c, a) => a,
      true,
      true,
    );
    expect(result.annualEmploymentNgn).toBe(24_000_000);
    expect(result.illustrativePitNgn).toBeGreaterThan(0);
    expect(result.planningFlags.some((f) => /non-salary|investment|Property/i.test(f))).toBe(true);
    expect(result.disclaimer.toLowerCase()).toContain("not tax advice");
  });
});
