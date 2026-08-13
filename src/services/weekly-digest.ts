import { prisma } from "@/lib/db";
import { buildHomeDashboard } from "@/services/wealth";
import { buildDataQualityReport } from "@/engines/data-quality";
import { buildFundingPulse } from "@/engines/goal-funding";
import { buildWeeklyDigest, type WeeklyDigest } from "@/engines/weekly-digest";
import { refreshInbox } from "@/services/inbox";
import { formatNaira } from "@/lib/format";

export async function composeWeeklyDigest(userId: string): Promise<{
  digest: WeeklyDigest;
  netWorthNgn: number;
  confidence: number;
  healthScore: number;
} | null> {
  const dash = await buildHomeDashboard(userId);
  if (!dash) return null;

  const [assets, liabilities, goals, inboxUnread, inboxTop] = await Promise.all([
    prisma.asset.findMany({ where: { userId } }),
    prisma.liability.findMany({ where: { userId } }),
    prisma.goal.findMany({ where: { userId } }),
    prisma.inboxItem.count({ where: { userId, status: "unread" } }),
    prisma.inboxItem.findMany({
      where: { userId, status: "unread" },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const quality = buildDataQualityReport(
    [
      ...assets.map((a) => ({
        id: a.id,
        kind: "asset" as const,
        name: a.name,
        source: a.source,
        verificationStatus: a.verificationStatus,
        confidence: a.confidence,
        lastValuationDate: a.lastValuationDate,
        currency: a.currency,
      })),
      ...liabilities.map((l) => ({
        id: l.id,
        kind: "liability" as const,
        name: l.name,
        source: l.source,
        verificationStatus: l.verificationStatus,
        confidence: l.confidence,
        lastValuationDate: l.lastValuationDate,
        currency: l.currency,
      })),
    ],
    dash.netWorth.confidence,
  );

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

  const digest = buildWeeklyDigest({
    name: dash.name,
    netWorthNgn: dash.netWorth.netWorthNgn,
    confidence: dash.netWorth.confidence,
    healthScore: dash.health.overall,
    emergencyMonths: dash.emergencyMonths,
    staleAssetCount: dash.netWorth.staleAssetIds.length,
    dataQualityHighPriority: quality.highPriorityCount,
    behindGoalCount: funding.behindCount,
    monthlyFundingGapNgn: funding.totalMonthlyGap,
    unreadInbox: inboxUnread,
    topInboxTitles: inboxTop.map((i) => i.title),
    monthChangeNgn: dash.monthChange,
  });

  return {
    digest,
    netWorthNgn: dash.netWorth.netWorthNgn,
    confidence: dash.netWorth.confidence,
    healthScore: dash.health.overall,
  };
}

export async function generateWeeklyDigest(userId: string) {
  const prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
  if (prefs && !prefs.informational) {
    return { skipped: true as const, reason: "Informational notifications disabled" };
  }

  await refreshInbox(userId);
  const composed = await composeWeeklyDigest(userId);
  if (!composed) throw new Error("Customer wealth context unavailable");

  const { digest, netWorthNgn, confidence, healthScore } = composed;
  const body = [
    digest.headline,
    ...digest.sections.map((s) => `${s.title}: ${s.body}`),
    digest.disclaimer,
  ].join(" ");

  const note = await prisma.notification.create({
    data: {
      userId,
      category: "Informational",
      title: "Weekly wealth digest",
      body: body.slice(0, 1800),
    },
  });

  const snapshot = await prisma.wealthSnapshot.create({
    data: {
      userId,
      netWorthNgn,
      confidence,
      healthScore,
      payloadJson: JSON.stringify({
        type: "weekly_digest",
        digest,
        notificationId: note.id,
      }),
    },
  });

  await prisma.auditEvent.create({
    data: {
      userId,
      eventType: "WEEKLY_WEALTH_DIGEST",
      entityType: "WealthSnapshot",
      entityId: snapshot.id,
      payloadJson: JSON.stringify({
        notificationId: note.id,
        headline: digest.headline,
        watchSections: digest.sections.filter((s) => s.tone === "watch").map((s) => s.id),
      }),
    },
  });

  return {
    skipped: false as const,
    notificationId: note.id,
    snapshotId: snapshot.id,
    digest,
    summaryLine: `${digest.headline} Net worth ${formatNaira(netWorthNgn, true)}.`,
  };
}

export async function loadLatestWeeklyDigest(userId: string): Promise<{
  stored: WeeklyDigest | null;
  generatedAt: string | null;
  live: WeeklyDigest | null;
}> {
  const row = await prisma.wealthSnapshot.findFirst({
    where: { userId, payloadJson: { contains: "weekly_digest" } },
    orderBy: { createdAt: "desc" },
  });

  let stored: WeeklyDigest | null = null;
  if (row) {
    try {
      const payload = JSON.parse(row.payloadJson || "{}") as { digest?: WeeklyDigest };
      stored = payload.digest ?? null;
    } catch {
      stored = null;
    }
  }

  const live = (await composeWeeklyDigest(userId))?.digest ?? null;
  return {
    stored,
    generatedAt: row?.createdAt.toISOString() ?? null,
    live,
  };
}
