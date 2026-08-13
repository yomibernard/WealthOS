import { describe, expect, it } from "vitest";
import {
  canDeliver,
  displayCategory,
  normalizeCategory,
} from "@/lib/notification-prefs";
import { existsSync } from "node:fs";
import { join } from "node:path";

describe("notification preferences policy", () => {
  it("normalises category casing", () => {
    expect(normalizeCategory("Important")).toBe("important");
    expect(displayCategory("informational")).toBe("Informational");
  });

  it("never suppresses critical", () => {
    expect(
      canDeliver(
        { critical: false, important: false, advisory: false, informational: false },
        "Critical",
      ),
    ).toBe(true);
  });

  it("respects informational and important toggles", () => {
    const prefs = {
      critical: true,
      important: false,
      advisory: true,
      informational: false,
    };
    expect(canDeliver(prefs, "Informational")).toBe(false);
    expect(canDeliver(prefs, "important")).toBe(false);
    expect(canDeliver(prefs, "Advisory")).toBe(true);
  });

  it("keeps notifications helpers on disk", () => {
    expect(existsSync(join(process.cwd(), "src/lib/notification-prefs.ts"))).toBe(true);
    expect(existsSync(join(process.cwd(), "src/services/notifications.ts"))).toBe(true);
  });
});
