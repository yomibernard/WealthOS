import { describe, expect, it } from "vitest";
import { analyseEstate } from "@/engines/estate";

describe("estate lite", () => {
  it("scores thin when core docs missing", () => {
    const result = analyseEstate([], {
      dependantCount: 2,
      hasLifeCover: true,
      hasProperty: true,
      hasBusiness: false,
      hasPension: true,
    });
    expect(result.grade).toBe("thin");
    expect(result.missingKinds).toContain("will");
    expect(result.signals.some((s) => /will/i.test(s))).toBe(true);
  });

  it("improves when will and beneficiaries documented", () => {
    const result = analyseEstate(
      [
        { id: "1", kind: "will", label: "Will", status: "documented" },
        { id: "2", kind: "beneficiaries", label: "RSA beneficiaries", status: "reviewed" },
        { id: "3", kind: "power_of_attorney", label: "POA", status: "draft" },
        { id: "4", kind: "letter_of_wishes", label: "Letter", status: "draft" },
      ],
      {
        dependantCount: 1,
        hasLifeCover: true,
        hasProperty: false,
        hasBusiness: false,
        hasPension: true,
      },
    );
    expect(result.score).toBeGreaterThan(50);
    expect(["emerging", "structured"]).toContain(result.grade);
  });
});
