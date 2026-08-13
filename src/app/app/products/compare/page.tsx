import { redirect } from "next/navigation";
import { PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { assessSuitability } from "@/engines/suitability";
import { buildHomeDashboard } from "@/services/wealth";

export default async function ProductComparePage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const products = await prisma.product.findMany({
    where: { approvalStatus: "approved" },
    include: { provider: true },
    take: 2,
  });
  const dash = await buildHomeDashboard(user.id);
  if (!dash || products.length < 2) {
    return (
      <main>
        <PageHeader title="Product comparison" subtitle="Need at least two approved products." />
      </main>
    );
  }

  const risk = await prisma.riskProfile.findUnique({ where: { userId: user.id } });
  const customer = {
    riskTolerance: (risk?.riskTolerance as "balanced") || "balanced",
    capacityForLoss: (risk?.capacityForLoss as "medium") || "medium",
    investmentHorizonYears: parseInt(risk?.investmentHorizon ?? "5", 10) || 5,
    liquidityNeeds: "medium" as const,
    knowledgeLevel: (risk?.knowledgeLevel as "intermediate") || "intermediate",
    hasDependants: true,
    emergencyMonths: dash.emergencyMonths,
    debtToAssetRatio:
      dash.netWorth.totalAssetsNgn > 0
        ? dash.netWorth.totalLiabilitiesNgn / dash.netWorth.totalAssetsNgn
        : 0,
    concentrationPercent: dash.netWorth.assetBreakdown[0]?.percent ?? 0,
    currencyExposureNgnPercent:
      dash.netWorth.currencyExposure.find((c) => c.currency === "NGN")?.percent ?? 100,
    vulnerableFlag: user.vulnerableFlag,
  };

  const results = products.map((p) => ({
    product: p,
    suitability: assessSuitability(customer, {
      id: p.id,
      name: p.name,
      riskRating: p.riskRating as "LOW",
      liquidity: p.liquidity as "HIGH",
      complexity: "simple",
      currency: p.currency,
      minimumInvestment: p.minimumInvestment,
    }),
  }));

  const preferred = [...results].sort((a, b) => {
    const rank = { suitable: 3, suitable_with_warnings: 2, unsuitable: 1, escalate: 0 };
    return rank[b.suitability.outcome] - rank[a.suitability.outcome];
  })[0];

  return (
    <main>
      <PageHeader
        title="Product comparison"
        subtitle="Why one product over another — suitability first, not yield."
      />
      <div className="space-y-3">
        {results.map(({ product, suitability }) => (
          <Panel key={product.id}>
            <p className="font-display text-xl">{product.name}</p>
            <p className="muted text-sm">{product.provider.name}</p>
            <ul className="mt-3 space-y-1 text-sm">
              <li>Risk: {product.riskRating}</li>
              <li>Liquidity: {product.liquidity}</li>
              <li>Fees: {product.feesJson}</li>
              <li>Suitability: {suitability.outcome.replaceAll("_", " ")}</li>
            </ul>
          </Panel>
        ))}
      </div>
      <Panel className="mt-3">
        <p className="eyebrow">Why {preferred.product.name}?</p>
        <p className="mt-2 leading-relaxed">
          Based on your emergency liquidity, concentration, risk tolerance and knowledge level,{" "}
          {preferred.product.name} currently has the stronger suitability outcome (
          {preferred.suitability.outcome.replaceAll("_", " ")}). This is not a purchase instruction
          and does not consider undisclosed preferences.
        </p>
      </Panel>
    </main>
  );
}
