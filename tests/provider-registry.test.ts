import { describe, expect, it } from "vitest";
import { lookupProvider } from "@/integrations/provider-registry";
import { analyseOfferWithRegistry } from "@/engines/wealthguard-async";

describe("provider registry adapter", () => {
  it("verifies known providers", async () => {
    const result = await lookupProvider("ARM Investment Managers");
    expect(result.status).toBe("Verified");
    expect(result.licenceNumber).toBeTruthy();
  });

  it("returns not found for unknown providers", async () => {
    const result = await lookupProvider("Horizon Yield Partners");
    expect(result.status).toBe("Not found");
  });

  it("feeds WealthGuard without scam/fraud labels", async () => {
    const result = await analyseOfferWithRegistry(
      "ARM Money Market Fund. Fees 1% p.a. Custody with trustee. Capital at risk. Flexible T+1.",
    );
    expect(result.providerVerification).toBe("Verified");
    expect(JSON.stringify(result).toLowerCase().includes('"scam"')).toBe(false);
  });
});
