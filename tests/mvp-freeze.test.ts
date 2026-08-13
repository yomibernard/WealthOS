import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const routes = [
  "src/app/page.tsx",
  "src/app/demo/page.tsx",
  "src/app/wealth-check/page.tsx",
  "src/app/app/page.tsx",
  "src/app/app/wealth/page.tsx",
  "src/app/app/health/page.tsx",
  "src/app/app/plan/page.tsx",
  "src/app/app/actions/page.tsx",
  "src/app/app/ai/page.tsx",
  "src/app/app/wealthguard/page.tsx",
  "src/app/app/inbox/page.tsx",
  "src/app/app/property/page.tsx",
  "src/app/app/business/page.tsx",
  "src/app/app/insurance/page.tsx",
  "src/app/app/pension/page.tsx",
  "src/app/app/tax/page.tsx",
  "src/app/app/crypto/page.tsx",
  "src/app/app/lending/page.tsx",
  "src/app/app/estate/page.tsx",
  "src/app/app/connections/page.tsx",
  "src/app/app/privacy/page.tsx",
  "src/app/adviser/page.tsx",
  "src/app/admin/page.tsx",
  "src/app/admin/ops/page.tsx",
  "src/app/api/health/route.ts",
];

const engines = [
  "src/engines/net-worth.ts",
  "src/engines/wealth-health.ts",
  "src/engines/nbfa.ts",
  "src/engines/suitability.ts",
  "src/engines/wealthguard.ts",
  "src/engines/cashflow.ts",
  "src/engines/property.ts",
  "src/engines/business.ts",
  "src/engines/insurance.ts",
  "src/engines/pension.ts",
  "src/engines/tax.ts",
  "src/engines/crypto.ts",
  "src/engines/lending.ts",
  "src/engines/estate.ts",
  "src/engines/life-events.ts",
];

describe("MVP freeze inventory", () => {
  it("keeps critical routes and engines on disk", () => {
    for (const rel of [...routes, ...engines]) {
      expect(existsSync(join(process.cwd(), rel)), rel).toBe(true);
    }
  });

  it("documents freeze status and demo password consistently", () => {
    const status = readFileSync(join(process.cwd(), "MVP_STATUS.md"), "utf8");
    const readme = readFileSync(join(process.cwd(), "README.md"), "utf8");
    expect(status).toContain("0.1.0");
    expect(status).toContain("Know what you have");
    expect(readme).toContain("WealthOSdemo1!");
    expect(status).toContain("WealthOSdemo1!");
  });

  it("seed still includes core demo personas", () => {
    const seed = readFileSync(join(process.cwd(), "prisma", "seed.ts"), "utf8");
    for (const email of [
      "yomi@demo.wealthos.ng",
      "amaka@demo.wealthos.ng",
      "chioma@demo.wealthos.ng",
      "adviser@demo.wealthos.ng",
      "admin@demo.wealthos.ng",
      "checker@demo.wealthos.ng",
    ]) {
      expect(seed).toContain(email);
    }
  });
});
