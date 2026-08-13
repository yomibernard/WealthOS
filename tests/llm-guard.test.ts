import { describe, expect, it } from "vitest";
import { polishGroundedAnswer } from "@/ai/llm";

describe("LLM polish guard", () => {
  it("returns null without API key (safe default)", async () => {
    const prev = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const result = await polishGroundedAnswer({
      draft: "Your estimated net worth is ₦10,000,000.",
      facts: ["Net worth ₦10,000,000"],
      intent: "net_worth",
      agent: "ConciergeAI",
      missingInformation: [],
      assumptions: [],
    });
    expect(result).toBeNull();
    if (prev) process.env.OPENAI_API_KEY = prev;
  });
});
