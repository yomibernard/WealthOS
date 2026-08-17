import { describe, expect, it } from "vitest";
import {
  buildPortfolioCareRadar,
  derivePortfolioNextAction,
  filterPortfolioCareRadar,
  formatCareAckCue,
  parsePortfolioCareFilter,
} from "@/engines/adviser-portfolio";
import {
  buildOpsRemindCareDeskBanner,
  formatOpsRemindCue,
} from "@/engines/ops-care-remind";

const sample = [
  {
    id: "a",
    name: "Amaka",
    email: "a@demo.wealthos.ng",
    profileCompleteness: 80,
    openEscalations: 0,
    openComplaints: 0,
    openPrivacy: 0,
  },
  {
    id: "y",
    name: "Yomi",
    email: "y@demo.wealthos.ng",
    profileCompleteness: 70,
    openEscalations: 2,
    openComplaints: 1,
    openPrivacy: 1,
    lastCareAckAt: "2026-08-10T10:00:00.000Z",
  },
  {
    id: "c",
    name: "Chioma",
    email: "c@demo.wealthos.ng",
    profileCompleteness: 90,
    openEscalations: 1,
    openComplaints: 0,
    openPrivacy: 0,
  },
];

describe("adviser portfolio care radar", () => {
  it("derives next actions by severity", () => {
    expect(
      derivePortfolioNextAction({
        openComplaints: 1,
        openPrivacy: 1,
        openEscalations: 2,
        needsFirstAck: true,
        awaitingReceipt: true,
        opsReminded: true,
      }),
    ).toBe("Review complaint");
    expect(
      derivePortfolioNextAction({
        openComplaints: 0,
        openPrivacy: 0,
        openEscalations: 0,
        needsFirstAck: false,
        awaitingReceipt: false,
        opsReminded: false,
      }),
    ).toBe("Routine book review");
  });

  it("sorts complaints ahead of clear books", () => {
    const radar = buildPortfolioCareRadar(sample);

    expect(radar.customers[0]?.name).toBe("Yomi");
    expect(radar.customers[0]?.careTone).toBe("danger");
    expect(radar.withCareCount).toBe(2);
    expect(radar.unackedCareCount).toBe(1);
    expect(radar.totalComplaints).toBe(1);
    expect(radar.totalSupport).toBe(2);
    expect(radar.summary).toMatch(/first acknowledgment/i);
  });

  it("reports a clear portfolio", () => {
    const radar = buildPortfolioCareRadar([sample[0]!]);
    expect(radar.withCareCount).toBe(0);
    expect(radar.summary).toMatch(/clear/i);
    expect(radar.customers[0]?.careLabel).toBe("Clear");
  });

  it("filters the book by care slice including unacked, awaiting, and ops_reminded", () => {
    const radar = buildPortfolioCareRadar([
      ...sample,
      {
        id: "r",
        name: "Receipt",
        email: "r@demo.wealthos.ng",
        profileCompleteness: 75,
        openEscalations: 0,
        openComplaints: 0,
        openPrivacy: 0,
        lastCareAckAt: "2026-08-12T10:00:00.000Z",
        unseenCareAckCount: 1,
      },
      {
        id: "o",
        name: "OpsCue",
        email: "o@demo.wealthos.ng",
        profileCompleteness: 60,
        openEscalations: 1,
        openComplaints: 0,
        openPrivacy: 0,
        lastOpsRemindAt: "2026-08-14T09:00:00.000Z",
      },
    ]);
    expect(filterPortfolioCareRadar(radar, "care").customers.map((c) => c.name)).toEqual([
      "Yomi",
      "OpsCue",
      "Chioma",
    ]);
    expect(filterPortfolioCareRadar(radar, "unacked").customers.map((c) => c.name)).toEqual([
      "OpsCue",
      "Chioma",
    ]);
    expect(filterPortfolioCareRadar(radar, "ops_reminded").customers.map((c) => c.name)).toEqual([
      "OpsCue",
    ]);
    expect(filterPortfolioCareRadar(radar, "awaiting").customers.map((c) => c.name)).toEqual([
      "Receipt",
    ]);
    expect(filterPortfolioCareRadar(radar, "complaints").customers.map((c) => c.name)).toEqual([
      "Yomi",
    ]);
    expect(radar.awaitingReceiptCount).toBe(1);
    expect(radar.opsRemindedCount).toBe(1);
    expect(radar.summary).toMatch(/ops-reminded/i);
    expect(parsePortfolioCareFilter("awaiting")).toBe("awaiting");
    expect(parsePortfolioCareFilter("unacked")).toBe("unacked");
    expect(parsePortfolioCareFilter("ops_reminded")).toBe("ops_reminded");
    expect(parsePortfolioCareFilter("bogus")).toBe("all");

    const opsRow = radar.customers.find((c) => c.id === "o");
    expect(opsRow?.opsReminded).toBe(true);
    expect(opsRow?.ackCue).toMatch(/Ops reminded/i);
  });

  it("formats care ack cues with awaiting receipt", () => {
    const now = new Date("2026-08-13T12:00:00.000Z");
    expect(formatCareAckCue(null, now)).toBe("No care ack yet");
    expect(formatCareAckCue("2026-08-13T08:00:00.000Z", now)).toBe("Acked today");
    expect(formatCareAckCue("2026-08-12T08:00:00.000Z", now)).toBe("Acked yesterday");
    expect(formatCareAckCue("2026-08-10T08:00:00.000Z", now)).toBe("Acked 3d ago");
    expect(formatCareAckCue("2026-08-13T08:00:00.000Z", now, true)).toBe(
      "Acked today · awaiting receipt",
    );
  });

  it("formats ops remind cues and Care desk banner", () => {
    const now = new Date("2026-08-14T12:00:00.000Z");
    expect(formatOpsRemindCue("2026-08-14T08:00:00.000Z", now)).toBe("Ops reminded today");
    expect(formatOpsRemindCue("2026-08-13T08:00:00.000Z", now)).toBe("Ops reminded yesterday");
    expect(
      buildOpsRemindCareDeskBanner({
        lastOpsRemindAt: "2026-08-14T08:00:00.000Z",
        adminName: "Admin",
        needsFirstAck: true,
        now,
      }),
    ).toMatch(/Ops reminded today \(Admin\).*Queues stay open/i);
    expect(
      buildOpsRemindCareDeskBanner({
        lastOpsRemindAt: "2026-08-14T08:00:00.000Z",
        needsFirstAck: false,
        now,
      }),
    ).toBeNull();
  });
});
