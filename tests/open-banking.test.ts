import { describe, expect, it } from "vitest";
import { simulateOpenBankingSync, bankFromCode } from "@/integrations/open-banking";

describe("open-banking demo adapter", () => {
  it("blocks sync without consent", () => {
    const out = simulateOpenBankingSync({
      providerName: "GTBank Open Banking (demo)",
      previousStatus: "healthy",
      consentActive: false,
    });
    expect(out.status).toBe("error");
    expect(out.balancesTouched).toBe(false);
  });

  it("refreshes healthy open-banking connections", () => {
    const out = simulateOpenBankingSync({
      providerName: "GTBank Open Banking (demo)",
      previousStatus: "healthy",
      consentActive: true,
    });
    expect(out.status).toBe("healthy");
    expect(out.balancesTouched).toBe(true);
  });

  it("keeps flaky providers degraded", () => {
    const out = simulateOpenBankingSync({
      providerName: "ARM fund positions (demo)",
      previousStatus: "degraded",
      consentActive: true,
    });
    expect(out.status).toBe("degraded");
  });

  it("resolves demo bank codes", () => {
    expect(bankFromCode("gtb")?.name).toBe("GTBank");
  });
});
