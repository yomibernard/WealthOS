import { describe, expect, it } from "vitest";
import {
  buildOpsCareRemindDraft,
  isOpsCareRemindTitle,
} from "@/engines/ops-care-remind";
import { classifyAdviserNotificationKind } from "@/engines/adviser-notifications";

describe("ops care remind", () => {
  it("drafts Care desk Path and never claims queue closure", () => {
    const draft = buildOpsCareRemindDraft({
      customerId: "yomi",
      customerName: "Yomi",
      adminName: "Admin",
    });
    expect(draft.href).toBe("/adviser/customers/yomi");
    expect(draft.title).toMatch(/Ops reminder/i);
    expect(draft.body).toMatch(/Path:\s*\/adviser\/customers\/yomi/);
    expect(draft.body).toMatch(/Queues stay open|formally resolved/i);
    expect(isOpsCareRemindTitle(draft.title)).toBe(true);
  });

  it("classifies as care_handoff in adviser notifications", () => {
    const draft = buildOpsCareRemindDraft({
      customerId: "amaka",
      customerName: "Amaka",
      adminName: "Ops",
    });
    expect(classifyAdviserNotificationKind(draft)).toBe("care_handoff");
  });
});
