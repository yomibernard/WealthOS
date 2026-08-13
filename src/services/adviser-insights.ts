import { prisma } from "@/lib/db";
import { buildHomeDashboard } from "@/services/wealth";
import { buildDataQualityReport } from "@/engines/data-quality";
import { buildFundingPulse } from "@/engines/goal-funding";
import { buildAdviserInsights, type AdviserInsightsPack } from "@/engines/adviser-insights";
import { loadLatestWeeklyDigest } from "@/services/weekly-digest";

export async function getAdviserInsightsPack(
  customerId: string,
): Promise<AdviserInsightsPack | null> {
  const dash = await buildHomeDashboard(customerId);
  if (!dash) return null;

  const [assets, liabilities, goals, escalations, recs, digestPack] = await Promise.all([
    prisma.asset.findMany({ where: { userId: customerId } }),
    prisma.liability.findMany({ where: { userId: customerId } }),
    prisma.goal.findMany({ where: { userId: customerId } }),
    prisma.escalation.count({ where: { userId: customerId, status: "open" } }),
    prisma.recommendation.count({ where: { userId: customerId, status: "PROPOSED" } }),
    loadLatestWeeklyDigest(customerId),
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

  const latestDigestHeadline =
    digestPack.stored?.headline ?? digestPack.live?.headline ?? null;

  return buildAdviserInsights({
    customerName: dash.name,
    netWorthNgn: dash.netWorth.netWorthNgn,
    confidence: dash.netWorth.confidence,
    healthScore: dash.health.overall,
    emergencyMonths: dash.emergencyMonths,
    staleAssetCount: dash.netWorth.staleAssetIds.length,
    dataQualityHighPriority: quality.highPriorityCount,
    behindGoalCount: funding.behindCount,
    monthlyFundingGapNgn: funding.totalMonthlyGap,
    openEscalations: escalations,
    proposedActions: recs,
    latestDigestHeadline,
    attention: dash.attention,
  });
}
