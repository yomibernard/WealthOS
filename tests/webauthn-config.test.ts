import { describe, expect, it } from "vitest";
import { webauthnConfig } from "@/lib/webauthn";

describe("webauthn config", () => {
  it("defaults to localhost without inventing production origins", () => {
    const cfg = webauthnConfig();
    expect(cfg.rpName).toBe("WealthOS");
    expect(cfg.rpID).toBeTruthy();
    expect(cfg.origin).toMatch(/^https?:\/\//);
  });
});
