import { describe, expect, it } from "vitest";
import {
  resolvePartner,
  submitToPartner,
  partnerLabel,
} from "@/integrations/execution-partner";

describe("execution partner rail", () => {
  it("routes action types to partners", () => {
    expect(resolvePartner("REPAY_DEBT")).toBe("BANK_DEMO");
    expect(resolvePartner("BUY_PROTECTION")).toBe("INSURE_DEMO");
    expect(resolvePartner("DEPLOY_IDLE_CASH")).toBe("ARM_DEMO");
    expect(partnerLabel("ARM_DEMO")).toMatch(/ARM/);
  });

  it("acknowledges supported instructions without moving funds", async () => {
    const conf = await submitToPartner({
      instructionId: "instr_test_1",
      partnerCode: "ARM_DEMO",
      actionType: "DEPLOY_IDLE_CASH",
      title: "Deploy idle cash",
      amount: 2_000_000,
      currency: "NGN",
      customerRef: "user_1",
    });
    expect(conf.status).toBe("accepted");
    expect(conf.message.toLowerCase()).toContain("no funds");
    expect(conf.partnerRef).toBeTruthy();
  });

  it("queues high-value instructions", async () => {
    const conf = await submitToPartner({
      instructionId: "instr_test_2",
      partnerCode: "ARM_DEMO",
      actionType: "DEPLOY_IDLE_CASH",
      title: "Large deployment",
      amount: 80_000_000,
      currency: "NGN",
      customerRef: "user_1",
    });
    expect(conf.status).toBe("queued");
  });

  it("rejects unsupported action on partner", async () => {
    const conf = await submitToPartner({
      instructionId: "instr_test_3",
      partnerCode: "INSURE_DEMO",
      actionType: "DEPLOY_IDLE_CASH",
      title: "Wrong rail",
      amount: 1000,
      currency: "NGN",
      customerRef: "user_1",
    });
    expect(conf.status).toBe("rejected");
  });
});
