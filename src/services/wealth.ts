import { prisma } from "@/lib/db";
import { calculateNetWorth } from "@/engines/net-worth";
import { calculateWealthHealth } from "@/engines/wealth-health";
import { topActions, type ScoredAction } from "@/engines/nbfa";
import { projectGoal } from "@/engines/goals";
import type { FxRateRow } from "@/engines/fx";
import type { CustomerContext } from "@/ai/orchestrator";
import { loadCareUpdatePulse } from "@/services/adviser-care-ack";

export async function loadFxRates(): Promise<FxRateRow[]> {
  const rows = await prisma.fxRate.findMany({ orderBy: { asOf: "desc" } });
  return rows.map((r) => ({
    from: r.from,
    to: r.to,
    rate: r.rate,
    asOf: r.asOf,
    source: r.source,
  }));
}

export async function loadCustomerContext(userId: string): Promise<CustomerContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      assets: true,
      liabilities: true,
      incomes: true,
      expenses: true,
      goals: true,
      riskProfile: true,
      memories: true,
      householdMembers: true,
      consents: { where: { status: "ACTIVE" } },
    },
  });
  if (!user) return null;

  const products = await prisma.product.findMany({
    where: { approvalStatus: "approved" },
    include: { provider: true },
    take: 10,
  });

  const fxRates = await loadFxRates();
  const careUpdate = await loadCareUpdatePulse(userId);

  return {
    userId: user.id,
    name: user.name.split(" ")[0] ?? user.name,
    vulnerableFlag: user.vulnerableFlag,
    baseCurrency: user.baseCurrency,
    assets: user.assets.map((a) => ({
      id: a.id,
      value: a.value,
      currency: a.currency,
      ownershipPercent: a.ownershipPercent,
      confidence: a.confidence,
      lastValuationDate: a.lastValuationDate,
      verificationStatus: a.verificationStatus,
      category: a.category,
      liquidity: a.liquidity,
      name: a.name,
      assetType: a.assetType,
      incomeGenerated: a.incomeGenerated,
      notes: a.notes,
      provider: a.provider,
    })),
    liabilities: user.liabilities.map((l) => ({
      id: l.id,
      balance: l.balance,
      currency: l.currency,
      ownershipPercent: l.ownershipPercent,
      confidence: l.confidence,
      lastValuationDate: l.lastValuationDate,
      interestRate: l.interestRate,
      monthlyPayment: l.monthlyPayment,
      type: l.type,
      name: l.name,
    })),
    incomes: user.incomes,
    hasDependants: user.householdMembers.some((h) => h.dependant),
    expenses: user.expenses,
    goals: user.goals.map((g) => ({
      id: g.id,
      type: g.type,
      name: g.name,
      targetAmount: g.targetAmount,
      targetDate: g.targetDate,
      existingAllocation: g.existingAllocation,
      monthlyContribution: g.monthlyContribution,
      currency: g.currency,
      priority: g.priority,
    })),
    riskProfile: user.riskProfile,
    memories: user.memories.map((m) => ({ category: m.category, content: m.content })),
    consentsActive: user.consents.map((c) => c.serviceName),
    fxRates,
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      riskRating: p.riskRating,
      liquidity: p.liquidity,
      currency: p.currency,
      minimumInvestment: p.minimumInvestment,
      feesJson: p.feesJson,
      providerName: p.provider.name,
    })),
    careUpdate,
  };
}

function toMonthly(amount: number, frequency: string) {
  if (frequency === "annual" || frequency === "yearly") return amount / 12;
  if (frequency === "weekly") return amount * 4.333;
  return amount;
}

export async function buildHomeDashboard(userId: string) {
  const ctx = await loadCustomerContext(userId);
  if (!ctx) return null;

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
    (s, e) =>
      s +
      toMonthly(e.amount, e.frequency) *
        (e.currency === "NGN"
          ? 1
          : ctx.fxRates.find((f) => f.from === e.currency && f.to === "NGN")?.rate ?? 0),
    0,
  );
  const monthlyIncome = ctx.incomes.reduce(
    (s, e) =>
      s +
      toMonthly(e.amount, e.frequency) *
        (e.currency === "NGN"
          ? 1
          : ctx.fxRates.find((f) => f.from === e.currency && f.to === "NGN")?.rate ?? 0),
    0,
  );

  const emergencyMonths = monthlyExpenses > 0 ? liquid / monthlyExpenses : 0;
  const propertyPercent =
    nw.assetBreakdown.find((b) => b.category === "PROPERTY")?.percent ?? 0;

  const health = calculateWealthHealth({
    liquidAssetsNgn: liquid,
    monthlyExpensesNgn: monthlyExpenses,
    monthlySavingsNgn: Math.max(0, monthlyIncome - monthlyExpenses),
    monthlyIncomeNgn: monthlyIncome,
    totalDebtNgn: nw.totalLiabilitiesNgn,
    totalAssetsNgn: nw.totalAssetsNgn,
    largestAssetClassPercent: nw.assetBreakdown[0]?.percent ?? 0,
    goalProgressAvg:
      ctx.goals.length === 0
        ? 40
        : ctx.goals.reduce((s, g) => {
            const f = projectGoal(g);
            return s + f.progressPercent;
          }, 0) / ctx.goals.length,
    hasLifeInsurance: ctx.assets.some((a) => a.category === "INSURANCE"),
    hasHealthInsurance: ctx.memories.some((m) => /health insurance/i.test(m.content)),
    retirementAllocationNgn: ctx.assets
      .filter((a) => a.category === "PENSION")
      .reduce((s, a) => {
        const rate =
          a.currency === "NGN"
            ? 1
            : ctx.fxRates.find((f) => f.from === a.currency && f.to === "NGN")?.rate ?? 0;
        return s + a.value * (a.ownershipPercent / 100) * rate;
      }, 0),
    retirementTargetNgn:
      ctx.goals.find((g) => g.type === "RETIREMENT")?.targetAmount ?? nw.netWorthNgn * 1.5,
    hasBeneficiaryInfo: ctx.memories.some((m) => /beneficiar/i.test(m.content)),
    hasEstateDocs: false,
    dataCoverage: Math.min(1, 0.35 + ctx.assets.length * 0.06 + ctx.liabilities.length * 0.03),
  });

  const actions: ScoredAction[] = topActions({
    emergencyMonths,
    propertyPercent,
    idleCashNgn: Math.max(0, liquid - monthlyExpenses * 3),
    highInterestDebtNgn: ctx.liabilities
      .filter((l) => (l.interestRate ?? 0) >= 0.18)
      .reduce((s, l) => s + l.balance * (l.ownershipPercent / 100), 0),
    staleAssetCount: nw.staleAssetIds.length,
    hasLifeInsurance: ctx.assets.some((a) => a.category === "INSURANCE"),
    goalUnderfundedCount: ctx.goals.filter((g) => projectGoal(g).progressPercent < 50).length,
    ngnExposurePercent: nw.currencyExposure.find((c) => c.currency === "NGN")?.percent ?? 100,
    vulnerableFlag: ctx.vulnerableFlag,
    dataConfidence: nw.confidence,
  });

  const goalCards = ctx.goals.slice(0, 3).map((g) => {
    const forecast = projectGoal(g);
    return {
      id: g.id,
      name: g.name,
      type: g.type,
      progress: forecast.progressPercent,
      currentAmount: g.existingAllocation,
      targetAmount: g.targetAmount,
      targetDateIso: g.targetDate.toISOString(),
      href: `/app/plan/${g.id}`,
    };
  });

  const attention = actions.slice(0, 3).map((a) => a.title);

  // Month change: use latest two snapshots if present
  const snapshots = await prisma.wealthSnapshot.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 2,
  });
  const monthChange =
    snapshots.length === 2 ? snapshots[0].netWorthNgn - snapshots[1].netWorthNgn : null;

  const changePct =
    monthChange != null && snapshots[1]?.netWorthNgn
      ? (monthChange / Math.max(1, Math.abs(snapshots[1].netWorthNgn))) * 100
      : null;

  return {
    name: ctx.name,
    netWorth: nw,
    monthChange,
    changePct,
    health,
    goals: goalCards,
    actions,
    attention,
    emergencyMonths,
    propertyPercent,
  };
}

/** Featured assets for Home dashboard tiles (covers when available). */
export async function loadHomeAssetShowcase(userId: string) {
  const rows = await prisma.asset.findMany({
    where: { userId },
    orderBy: { value: "desc" },
    take: 8,
  });
  const preferred = [
    ...rows.filter((a) => a.category === "PROPERTY"),
    ...rows.filter((a) => a.category !== "PROPERTY"),
  ].slice(0, 4);

  return preferred.map((a) => ({
    id: a.id,
    name: a.name,
    category: a.category,
    assetType: a.assetType,
    value: a.value,
    currency: a.currency,
    country: a.country,
    coverUrl: a.coverStorageKey
      ? `/api/media?key=${encodeURIComponent(a.coverStorageKey)}`
      : null,
    href: a.category === "PROPERTY" ? "/app/property" : "/app/wealth",
  }));
}

export async function loadWealthVisualContext(userId: string) {
  const [snapshots, fxRows] = await Promise.all([
    prisma.wealthSnapshot.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: 48,
    }),
    prisma.fxRate.findMany({ orderBy: { asOf: "desc" } }),
  ]);

  const rates = fxRows.map((r) => ({
    from: r.from,
    to: r.to,
    rate: r.rate,
  }));

  return {
    snapshots: snapshots.map((s) => ({
      at: s.createdAt.toISOString(),
      netWorthNgn: s.netWorthNgn,
    })),
    rates,
  };
}

export async function ensureRecommendations(userId: string) {
  const dash = await buildHomeDashboard(userId);
  if (!dash) return [];

  await prisma.recommendation.updateMany({
    where: { userId, status: "PROPOSED" },
    data: { status: "SUPERSEDED" },
  });

  const created = [];
  for (const a of dash.actions) {
    const rec = await prisma.recommendation.create({
      data: {
        userId,
        actionType: a.actionType,
        title: a.title,
        what: a.what,
        amount: a.amount,
        amountCurrency: a.amountCurrency ?? "NGN",
        why: a.why,
        goalLink: a.goalLink,
        risks: a.risks,
        liquidityNote: a.liquidityNote,
        costsNote: a.costsNote,
        alternativesJson: JSON.stringify(a.alternatives),
        providerNote: a.providerNote,
        regulatoryStatus: a.regulatoryStatus,
        assumptionsJson: JSON.stringify(a.assumptions),
        confidence: a.confidence,
        score: a.score,
        modelVersion: "nbfa-1.0",
        policyVersion: "policy-1.0",
      },
    });
    created.push(rec);

    await prisma.auditEvent.create({
      data: {
        userId,
        eventType: "RECOMMENDATION_CREATED",
        entityType: "Recommendation",
        entityId: rec.id,
        payloadJson: JSON.stringify({
          actionType: a.actionType,
          score: a.score,
          confidence: a.confidence,
          modelVersion: "nbfa-1.0",
          policyVersion: "policy-1.0",
        }),
      },
    });
  }
  return created;
}
