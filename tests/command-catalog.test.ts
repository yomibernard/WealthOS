import { describe, expect, it } from "vitest";
import {
  CUSTOMER_COMMANDS,
  filterCommands,
  resolveCommandIntent,
} from "@/lib/command-catalog";

describe("command catalog", () => {
  it("indexes primary destinations", () => {
    const hrefs = CUSTOMER_COMMANDS.map((c) => c.href);
    expect(hrefs).toContain("/app");
    expect(hrefs).toContain("/app/wealth");
    expect(hrefs).toContain("/app/ai");
    expect(hrefs).toContain("/app/consent");
    expect(hrefs).toContain("/app/reports");
  });

  it("filters by label and keywords", () => {
    const property = filterCommands("property");
    expect(property.some((c) => c.href === "/app/property")).toBe(true);

    const consent = filterCommands("consent");
    expect(consent.some((c) => c.href === "/app/consent")).toBe(true);

    const empty = filterCommands("zzzz-not-a-route");
    expect(empty).toHaveLength(0);
  });

  it("routes natural questions to WealthAI", () => {
    const intent = resolveCommandIntent("What should I review today?");
    expect(intent?.href).toMatch(/^\/app\/ai\?q=/);
    expect(intent?.href).toContain(encodeURIComponent("What should I review today?"));
    expect(resolveCommandIntent("property")).toBeNull();
  });
});
