import { prisma } from "@/lib/db";
import {
  buildCompletenessReport,
  type CompletenessReport,
} from "@/engines/profile-completeness";

export async function assessProfileCompleteness(
  userId: string,
): Promise<CompletenessReport | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      riskProfile: true,
      incomes: { select: { id: true } },
      expenses: { select: { id: true } },
      assets: { select: { id: true, category: true } },
      liabilities: { select: { id: true } },
      goals: { select: { id: true, type: true } },
      consents: { where: { status: "ACTIVE" } },
      householdMembers: { select: { id: true } },
    },
  });
  if (!user) return null;

  const hasAiConsent = user.consents.some((c) =>
    /wealthai|personalisation|ai/i.test(c.serviceName),
  );
  const hasEmergencyGoalOrCash =
    user.goals.some((g) => /emergency|buffer/i.test(g.type) || /emergency/i.test(g.type)) ||
    user.assets.some((a) => a.category === "CASH") ||
    user.goals.some((g) => g.type === "EMERGENCY");

  return buildCompletenessReport({
    hasName: Boolean(user.name?.trim()),
    hasRiskTolerance: Boolean(user.riskTolerance?.trim()),
    hasInvestmentExperience: Boolean(user.investmentExperience?.trim()),
    hasLiquidityNeeds: Boolean(user.liquidityNeeds?.trim()),
    hasRiskProfile: Boolean(user.riskProfile),
    incomeCount: user.incomes.length,
    expenseCount: user.expenses.length,
    assetCount: user.assets.length,
    liabilityCount: user.liabilities.length,
    goalCount: user.goals.length,
    hasAiConsent,
    householdCount: user.householdMembers.length,
    hasEmergencyGoalOrCash,
  });
}

export async function syncProfileCompleteness(userId: string) {
  const report = await assessProfileCompleteness(userId);
  if (!report) return null;

  await prisma.user.update({
    where: { id: userId },
    data: { profileCompleteness: report.score },
  });

  return report;
}
