import { describe, expect, it } from "vitest";
import { analyseOffer } from "@/engines/wealthguard";

describe("WealthGuard language and analysis", () => {
  it("never auto-labels scam/fraud/safe/guaranteed", () => {
    const result = analyseOffer(
      "Guaranteed 45% monthly returns! Risk-free WhatsApp investment from Horizon Yield Partners. Send money today only.",
    );
    const blob = JSON.stringify(result).toLowerCase();
    expect(blob.includes('"scam"')).toBe(false);
    expect(blob.includes('"fraud"')).toBe(false);
    expect(result.overallOutcome).toBe("Significant warning indicators");
    expect(result.returnClaim).toBe("Very unusual");
    expect(result.providerVerification).toBe("Not found");
  });

  it("recognises known provider with clearer terms", () => {
    const result = analyseOffer(
      "ARM Money Market Fund. Indicative yield varies. Fees: 1% p.a. Custody with trustee. Capital at risk. Flexible withdrawals T+1. Minimum ₦10,000.",
    );
    expect(result.providerVerification).toBe("Verified");
    expect(["Lower concern", "Further checks required"]).toContain(result.overallOutcome);
  });
});
