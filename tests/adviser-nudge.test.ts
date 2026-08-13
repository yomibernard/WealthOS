import { describe, expect, it } from "vitest";
import { buildAdviserNudge, listNudgeTypes } from "@/engines/adviser-nudge";
import { existsSync } from "node:fs";
import { join } from "node:path";

describe("adviser nudge", () => {
  it("builds actionable nudge templates", () => {
    const nudge = buildAdviserNudge("refresh_data", "Ada Adviser", "Focus on property.");
    expect(nudge.href).toBe("/app/wealth/confidence");
    expect(nudge.noteBody).toContain("Ada Adviser");
    expect(nudge.noteBody).toContain("property");
    expect(nudge.priority).toBe("important");
  });

  it("lists all nudge types", () => {
    expect(listNudgeTypes().length).toBe(5);
  });

  it("keeps nudge API on disk", () => {
    expect(existsSync(join(process.cwd(), "src/app/api/adviser/nudge/route.ts"))).toBe(true);
    expect(existsSync(join(process.cwd(), "src/engines/adviser-nudge.ts"))).toBe(true);
  });
});
