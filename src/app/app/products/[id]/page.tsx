import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, InsightPanel, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { buildHomeDashboard } from "@/services/wealth";
import { assessSuitability } from "@/engines/suitability";
import { formatCurrency } from "@/lib/format";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const [product, dash, risk] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { provider: true },
    }),
    buildHomeDashboard(user.id),
    prisma.riskProfile.findUnique({ where: { userId: user.id } }),
  ]);
  if (!product || product.approvalStatus !== "approved") redirect("/app/products");

  const suitability =
    dash != null
      ? assessSuitability(
          {
            riskTolerance: (risk?.riskTolerance as "balanced") || "balanced",
            capacityForLoss: (risk?.capacityForLoss as "medium") || "medium",
            investmentHorizonYears: parseInt(risk?.investmentHorizon ?? "5", 10) || 5,
            liquidityNeeds: "medium",
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
          },
          {
            id: product.id,
            name: product.name,
            riskRating: product.riskRating as "LOW",
            liquidity: product.liquidity as "HIGH",
            complexity: "simple",
            currency: product.currency,
            minimumInvestment: product.minimumInvestment,
          },
        )
      : null;

  let feesDisplay = product.feesJson;
  try {
    const parsed = JSON.parse(product.feesJson) as unknown;
    feesDisplay =
      typeof parsed === "object" && parsed != null
        ? Object.entries(parsed as Record<string, unknown>)
            .map(([k, v]) => `${k}: ${String(v)}`)
            .join(" · ")
        : product.feesJson;
  } catch {
    /* keep raw */
  }

  return (
    <main>
      <PageHeader title={product.name} subtitle={product.provider.name} />

      <div className="flex flex-wrap gap-2">
        <Badge>{product.riskRating.replaceAll("_", " ")}</Badge>
        <Badge>{product.liquidity} liquidity</Badge>
        <Badge>{product.currency}</Badge>
        <Badge>{product.assetClass}</Badge>
        {suitability ? (
          <Badge
            tone={
              suitability.outcome === "unsuitable" || suitability.outcome === "escalate"
                ? "warn"
                : "default"
            }
          >
            Suitability · {suitability.outcome.replaceAll("_", " ")}
          </Badge>
        ) : null}
      </div>

      {suitability ? (
        <InsightPanel className="mt-4" eyebrow="Suitability snapshot">
          Outcome: {suitability.outcome.replaceAll("_", " ")}. This is not a purchase instruction —
          finish diagnosis and consent before any material step.
        </InsightPanel>
      ) : null}

      <Panel className="mt-4 space-y-4">
        <section>
          <p className="eyebrow">Provider & licence</p>
          <p className="mt-1 leading-relaxed">
            {product.provider.name} · {product.provider.licenceStatus}
            {product.provider.licenceNumber ? ` (${product.provider.licenceNumber})` : ""}
          </p>
        </section>
        <section>
          <p className="eyebrow">Minimum investment</p>
          <p className="mt-1 font-semibold">
            {formatCurrency(product.minimumInvestment, product.currency)}
          </p>
        </section>
        <section>
          <p className="eyebrow">Objective</p>
          <p className="mt-1 leading-relaxed">
            {product.investmentObjective ?? "See official documents"}
          </p>
        </section>
        <section>
          <p className="eyebrow">Key risks</p>
          <p className="mt-1 leading-relaxed">{product.keyRisks ?? "See official documents"}</p>
        </section>
        <section>
          <p className="eyebrow">Fees</p>
          <p className="mt-1 text-sm leading-relaxed">{feesDisplay}</p>
        </section>
        <p className="muted text-sm">
          Historical performance is not a guide to future results. Suitability must be assessed before
          any recommendation.
        </p>
      </Panel>

      {suitability?.rulesFired?.length ? (
        <Panel className="mt-3">
          <p className="eyebrow">Why this suitability outcome</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {suitability.rulesFired.map((r) => (
              <li key={r.rule + r.detail}>
                <span className="font-medium">{r.result}</span> · {r.detail}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link href="/app/products/compare" className="btn btn-soft flex-1">
          Compare products
        </Link>
        <Link href="/app/actions" className="btn btn-ghost flex-1">
          Back to diagnosis
        </Link>
        <Link href="/app/ai" className="btn btn-ghost flex-1">
          Ask WealthAI
        </Link>
      </div>
    </main>
  );
}
