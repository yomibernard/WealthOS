import { prisma } from "@/lib/db";
import { buildHomeDashboard } from "@/services/wealth";
import { syncProfileCompleteness } from "@/services/profile-completeness";
import { buildFundingPulse } from "@/engines/goal-funding";
import { loadLatestWeeklyDigest } from "@/services/weekly-digest";
import {
  buildAdviserSharePack,
  type SharePackType,
} from "@/engines/adviser-share";
import { createUserNotification } from "@/services/notifications";

export async function sharePackWithAdviser(input: {
  customerId: string;
  packType: SharePackType;
  noteFromCustomer?: string;
}) {
  const link = await prisma.adviserCustomer.findFirst({
    where: { customerId: input.customerId },
    include: { adviser: { select: { id: true, name: true, email: true } } },
  });
  if (!link) {
    return {
      ok: false as const,
      error: "No adviser is linked yet. Request an adviser first.",
    };
  }

  const dash = await buildHomeDashboard(input.customerId);
  if (!dash) {
    return { ok: false as const, error: "Wealth context unavailable." };
  }

  const [profile, goals, digestPack] = await Promise.all([
    syncProfileCompleteness(input.customerId),
    prisma.goal.findMany({ where: { userId: input.customerId } }),
    loadLatestWeeklyDigest(input.customerId),
  ]);

  const funding = buildFundingPulse(
    goals.map((g) => ({
      id: g.id,
      name: g.name,
      type: g.type,
      currency: g.currency,
      priority: g.priority,
      targetAmount: g.targetAmount,
      targetDate: g.targetDate,
      existingAllocation: g.existingAllocation,
      monthlyContribution: g.monthlyContribution,
    })),
  );

  const pack = buildAdviserSharePack({
    customerName: dash.name,
    packType: input.packType,
    netWorthNgn: dash.netWorth.netWorthNgn,
    confidence: dash.netWorth.confidence,
    healthScore: dash.health.overall,
    profileScore: profile?.score ?? 0,
    behindGoalCount: funding.behindCount,
    monthlyFundingGapNgn: funding.totalMonthlyGap,
    staleAssetCount: dash.netWorth.staleAssetIds.length,
    digestHeadline: digestPack.stored?.headline ?? digestPack.live?.headline,
    profileSummary: profile?.summary ?? null,
    fundingSummary: funding.summary,
    noteFromCustomer: input.noteFromCustomer,
  });

  const note = await prisma.adviserNote.create({
    data: {
      adviserId: link.adviserId,
      customerId: input.customerId,
      kind: "customer_share",
      title: pack.title,
      body: pack.body,
      sharedWithCustomer: true,
      status: "open",
    },
  });

  await createUserNotification({
    userId: link.adviserId,
    category: "important",
    title: pack.title,
    body: `${dash.name} shared a briefing. Open their customer 360 to review. Path: /adviser/customers/${input.customerId}`,
  });

  await createUserNotification({
    userId: input.customerId,
    category: "informational",
    title: "Shared with your adviser",
    body: `Sent to ${link.adviser.name}: ${pack.title}`,
  });

  await prisma.auditEvent.create({
    data: {
      userId: input.customerId,
      eventType: "CUSTOMER_SHARED_WITH_ADVISER",
      entityType: "AdviserNote",
      entityId: note.id,
      payloadJson: JSON.stringify({
        adviserId: link.adviserId,
        packType: input.packType,
        version: pack.version,
      }),
    },
  });

  return {
    ok: true as const,
    noteId: note.id,
    adviserName: link.adviser.name,
    title: pack.title,
  };
}

export async function listLinkedAdviser(customerId: string) {
  return prisma.adviserCustomer.findFirst({
    where: { customerId },
    include: { adviser: { select: { id: true, name: true, email: true } } },
  });
}
