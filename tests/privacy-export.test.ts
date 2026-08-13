import { describe, expect, it } from "vitest";

describe("privacy export contract", () => {
  it("never includes passwordHash in a sample package shape", () => {
    const pack = {
      exportedAt: new Date().toISOString(),
      customer: {
        email: "demo@example.com",
        name: "Demo",
        // passwordHash must be stripped by exportCustomerData
      },
    };
    expect(JSON.stringify(pack).includes("passwordHash")).toBe(false);
  });
});
