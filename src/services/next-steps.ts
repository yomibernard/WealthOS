import { calculateNetWorth } from "@/engines/net-worth";
import { topActions } from "@/engines/nbfa";
import { buildNextStepsPulse } from "@/engines/next-steps";
import { loadCustomerCasesPulse } from "@/services/customer-cases";
import { loadPrivacyRequestsPulse } from "@/services/privacy";
import { syncProfileCompleteness } from "@/services/profile-completeness";
import { loadCustomerContext } from "@/services/wealth";

function toMonthly(amount: number, frequency: string) {
  if (frequency === "annual" || frequency === "yearly") return amount / 12;
  if (frequency === "weekly") return amount * 4.333;
  return amount;
}

export async function loadNextStepsPulse(userId: string) {
  const [ctx, cases, privacy, profile] = await Promise.all([
    loadCustomerContext(userId),
    loadCustomerCasesPulse(userId),
    loadPrivacyRequestsPulse(userId),
    syncProfileCompleteness(userId),
  ]);

  if (!ctx) {
    return buildNextStepsPulse({});
  }

  const nw = calculateNetWorth(ctx.assets, ctx.liabilities, ctx.fxRates);
  const liquid = ctx.assets
    .filter((a) => a.liquidity === "HIGH" || a.category === "CASH")
    .reduce((s, a) => {
      const rate =
        a.currency === "NGN"
          ? 1
          : ctx.fxRates.find((f) => f.from === a.currency && f.to === "NGN")?.rate ?? 0;
      return s + a.value * (a.ownershipPercent / 100) * rate;
    }, 0);
  const monthlyExpenses = ctx.expenses.reduce(
    (s, e) => s + toMonthly(e.amount, e.frequency),
    0,
  );
  const emergencyMonths = monthlyExpenses > 0 ? liquid / monthlyExpenses : 12;
  const propertyPercent =
    nw.assetBreakdown.find((b) => b.category === "PROPERTY")?.percent ?? 0;

  const actions = topActions({
    emergencyMonths,
    propertyPercent,
    idleCashNgn: Math.max(0, liquid - monthlyExpenses * 3),
    highInterestDebtNgn: ctx.liabilities
      .filter((l) => (l.interestRate ?? 0) >= 0.18)
      .reduce((s, l) => s + l.balance * (l.ownershipPercent / 100), 0),
    staleAssetCount: nw.staleAssetIds.length,
    hasLifeInsurance: ctx.assets.some((a) => a.category === "INSURANCE"),
    goalUnderfundedCount: ctx.goals.filter((g) => g.existingAllocation / g.targetAmount < 0.5)
      .length,
    ngnExposurePercent: nw.currencyExposure.find((c) => c.currency === "NGN")?.percent ?? 100,
    vulnerableFlag: ctx.vulnerableFlag,
    dataConfidence: nw.confidence,
  });

  return buildNextStepsPulse({
    careHeadline: ctx.careUpdate?.headline ?? null,
    careHref: ctx.careUpdate?.primaryHref ?? null,
    supportHeadline: cases.headline,
    supportHref: cases.primaryHref,
    complaintCount: cases.complaintCount,
    privacyHeadline: privacy.headline,
    privacyHref: privacy.primaryHref,
    erasureOpen: privacy.erasureOpen,
    staleAssetCount: nw.staleAssetIds.length,
    dataConfidence: nw.confidence,
    profileScore: profile?.score ?? null,
    profileSummary: profile?.summary ?? null,
    actions,
  });
}
