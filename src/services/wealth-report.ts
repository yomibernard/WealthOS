import { prisma } from "@/lib/db";
import { buildHomeDashboard } from "@/services/wealth";
import { formatNaira } from "@/lib/format";

export async function generateMonthlyWealthReport(userId: string) {
  const dash = await buildHomeDashboard(userId);
  if (!dash) throw new Error("Customer wealth context unavailable");

  const prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
  if (prefs && !prefs.informational) {
    return { skipped: true as const, reason: "Informational notifications disabled" };
  }

  const body = [
    `Estimated net worth ${formatNaira(dash.netWorth.netWorthNgn, true)} (confidence ${Math.round(dash.netWorth.confidence * 100)}%).`,
    `Wealth Health ${dash.health.overall}/100.`,
    dash.attention.length
      ? `Priorities: ${dash.attention.slice(0, 3).join("; ")}.`
      : "No urgent priorities this cycle.",
    "This is an informational summary — not a solicitation to buy products.",
  ].join(" ");

  const note = await prisma.notification.create({
    data: {
      userId,
      category: "Informational",
      title: "Monthly wealth report",
      body,
    },
  });

  await prisma.wealthSnapshot.create({
    data: {
      userId,
      netWorthNgn: dash.netWorth.netWorthNgn,
      confidence: dash.netWorth.confidence,
      healthScore: dash.health.overall,
      payloadJson: JSON.stringify({
        type: "monthly_report",
        attention: dash.attention,
      }),
    },
  });

  await prisma.auditEvent.create({
    data: {
      userId,
      eventType: "MONTHLY_WEALTH_REPORT",
      entityType: "Notification",
      entityId: note.id,
      payloadJson: JSON.stringify({
        netWorthNgn: dash.netWorth.netWorthNgn,
        health: dash.health.overall,
      }),
    },
  });

  return { skipped: false as const, notificationId: note.id, body };
}
