import { describe, expect, it } from "vitest";
import { automateLifeEvent } from "@/engines/life-events";

describe("life-event automation", () => {
  it("creates protection checklist for new dependant", () => {
    const result = automateLifeEvent("new_dependant", "Daughter born");
    expect(result.checklist.some((c) => /life cover|Household|education/i.test(c))).toBe(true);
    expect(result.inboxDrafts.length).toBeGreaterThan(0);
    expect(result.disclaimer.toLowerCase()).toContain("consent");
  });

  it("prioritises runway on job loss", () => {
    const result = automateLifeEvent("job_loss", "Contract ended");
    expect(result.inboxDrafts[0].priority).toBe("critical");
    expect(result.narrative.toLowerCase()).toMatch(/liquidity|stability/);
  });
});
