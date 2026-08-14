import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

describe("pilot freeze check", () => {
  it("passes for the 0.1.16 Adviser WealthAI book next-steps pack", () => {
    const res = spawnSync("node", [join("scripts", "pilot-freeze-check.mjs")], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    expect(res.status).toBe(0);
    expect(res.stdout).toMatch(/0\.1\.16/);
  });
});
