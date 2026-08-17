import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, EmptyState, InsightPanel, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { assessSuitability } from "@/engines/suitability";
import { buildHomeDashboard } from "@/services/wealth";
import { formatCurrency } from "@/lib/format";

export default async function ProductComparePage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const products = await prisma.product.findMany({
    where: { approvalStatus: "approved" },
    include: { provider: true },
    take: 3,
    orderBy: { name: "asc" },
  });
  const dash = await buildHomeDashboard(user.id);
  if (!dash || products.length < 2) {
    return (
      <main>
        <PageHeader title="Product comparison" subtitle="Need at least two approved products." />
        <EmptyState
          title="Not enough products to compare"
          body="Approved catalogue entries appear after maker-checker. Meanwhile, stay with diagnosis."
          action={
            <Link href="/app/actions" className="btn btn-accent">
              Open recommendations
            </Link>
          }
        />
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

      <InsightPanel eyebrow="Diagnosis reminder">
        Comparison does not replace Wealth Health or next-best actions. Prefer the stronger
        suitability outcome only if it still fits your goals and liquidity.
      </InsightPanel>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">Product suitability comparison</caption>
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-2 pr-3 font-semibold">Dimension</th>
              {results.map(({ product }) => (
                <th key={product.id} className="py-2 px-2 font-semibold">
                  {product.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line/70">
              <td className="py-2 pr-3 muted">Provider</td>
              {results.map(({ product }) => (
                <td key={product.id} className="py-2 px-2">
                  {product.provider.name}
                </td>
              ))}
            </tr>
            <tr className="border-b border-line/70">
              <td className="py-2 pr-3 muted">Risk</td>
              {results.map(({ product }) => (
                <td key={product.id} className="py-2 px-2">
                  {product.riskRating.replaceAll("_", " ")}
                </td>
              ))}
            </tr>
            <tr className="border-b border-line/70">
              <td className="py-2 pr-3 muted">Liquidity</td>
              {results.map(({ product }) => (
                <td key={product.id} className="py-2 px-2">
                  {product.liquidity}
                </td>
              ))}
            </tr>
            <tr className="border-b border-line/70">
              <td className="py-2 pr-3 muted">Minimum</td>
              {results.map(({ product }) => (
                <td key={product.id} className="py-2 px-2">
                  {formatCurrency(product.minimumInvestment, product.currency)}
                </td>
              ))}
            </tr>
            <tr className="border-b border-line/70">
              <td className="py-2 pr-3 muted">Suitability</td>
              {results.map(({ product, suitability }) => (
                <td key={product.id} className="py-2 px-2">
                  <Badge
                    tone={
                      suitability.outcome === "unsuitable" || suitability.outcome === "escalate"
                        ? "warn"
                        : "default"
                    }
                  >
                    {suitability.outcome.replaceAll("_", " ")}
                  </Badge>
                </td>
              ))}
            </tr>
            <tr className="border-b border-line/70">
              <td className="py-2 pr-3 muted">Fees</td>
              {results.map(({ product }) => (
                <td key={product.id} className="py-2 px-2 text-xs">
                  {product.feesJson}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 space-y-3">
        {results.map(({ product, suitability }) => (
          <Panel key={product.id}>
            <div className="flex flex-wrap items-center gap-2">
              {preferred.product.id === product.id ? <Badge>Stronger fit</Badge> : null}
              <p className="font-display text-xl">{product.name}</p>
            </div>
            <p className="muted mt-1 text-sm">
              {suitability.rulesFired[0]?.detail ??
                `Suitability outcome: ${suitability.outcome.replaceAll("_", " ")}.`}
            </p>
            <Link
              href={`/app/products/${product.id}`}
              className="mt-2 inline-block text-sm font-semibold text-accent"
            >
              Open detail
            </Link>
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

      <Link href="/app/products" className="btn btn-ghost mt-4 w-full">
        Back to products
      </Link>
    </main>
  );
}
