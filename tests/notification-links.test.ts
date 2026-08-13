import { describe, expect, it } from "vitest";
import { extractPathFromBody, resolveNotificationLink } from "@/lib/notification-links";

describe("notification deep links", () => {
  it("extracts Path: lines from WealthAI-style bodies", () => {
    expect(extractPathFromBody("See details. Path: /app/privacy")).toBe("/app/privacy");
    expect(extractPathFromBody("no path here")).toBeNull();
  });

  it("maps support and privacy titles to the right routes", () => {
    expect(
      resolveNotificationLink({
        title: "Complaint update",
        body: "Your case is now resolved.",
      })?.href,
    ).toBe("/app/support");

    expect(
      resolveNotificationLink({
        title: "Privacy request received",
        body: "Your access request is logged.",
      })?.href,
    ).toBe("/app/privacy");
  });

  it("maps cadence and adviser notifications", () => {
    expect(
      resolveNotificationLink({ title: "Weekly wealth digest", body: "…" })?.href,
    ).toBe("/app/digest");
    expect(
      resolveNotificationLink({ title: "Monthly wealth report", body: "…" })?.href,
    ).toBe("/app/reports");
    expect(
      resolveNotificationLink({
        title: "Please refresh your Wealth Graph data",
        body: "Your adviser asked…",
      })?.href,
    ).toBe("/app/inbox");
  });

  it("prefers explicit Path over title heuristics", () => {
    expect(
      resolveNotificationLink({
        title: "Complaint update",
        body: "Also see Path: /app/privacy",
      })?.href,
    ).toBe("/app/privacy");
  });

  it("resolves adviser care-receipt Path to customer 360", () => {
    expect(
      resolveNotificationLink({
        title: "Yomi marked your care update as seen",
        body: "Yomi sent a care receipt: Thanks. This does not close the ops queue. Path: /adviser/customers/cust1",
      })?.href,
    ).toBe("/adviser/customers/cust1");
  });
});
