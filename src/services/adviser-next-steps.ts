import { buildAdviserNextStepsPulse } from "@/engines/adviser-next-steps";
import { loadAdviserPortfolioCareRadar } from "@/services/adviser-portfolio";
import { loadAdviserNotificationPulse } from "@/services/notifications";

export async function loadAdviserNextStepsPulse(input: {
  adviserId: string;
  role: string;
}) {
  const [radar, notify] = await Promise.all([
    loadAdviserPortfolioCareRadar({
      adviserId: input.adviserId,
      role: input.role,
    }),
    loadAdviserNotificationPulse(input.adviserId),
  ]);

  return buildAdviserNextStepsPulse({
    totalComplaints: radar.totalComplaints,
    totalPrivacy: radar.totalPrivacy,
    totalSupport: radar.totalSupport,
    unackedCareCount: radar.unackedCareCount,
    awaitingReceiptCount: radar.awaitingReceiptCount,
    opsRemindedCount: radar.opsRemindedCount,
    customers: radar.customers.map((c) => ({
      id: c.id,
      name: c.name,
      openComplaints: c.openComplaints,
      openPrivacy: c.openPrivacy,
      openSupport: c.openSupport,
      needsFirstAck: c.needsFirstAck,
      awaitingReceipt: c.awaitingReceipt,
      opsReminded: c.opsReminded,
      sortScore: c.sortScore,
    })),
    notifyUnreadCount: notify.unreadCount,
    notifyHeadline: notify.headline,
    notifyHref: notify.primaryHref,
  });
}
