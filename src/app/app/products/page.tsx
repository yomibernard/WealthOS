import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, EmptyState, InsightPanel, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { buildHomeDashboard } from "@/services/wealth";
import { assessSuitability } from "@/engines/suitability";
import { formatCurrency } from "@/lib/format";

export default async function ProductsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const [products, dash, risk] = await Promise.all([
    prisma.product.findMany({
      where: { approvalStatus: "approved" },
      include: { provider: true },
      orderBy: { name: "asc" },
    }),
    buildHomeDashboard(user.id),
    prisma.riskProfile.findUnique({ where: { userId: user.id } }),
  ]);

  const customer = dash
    ? {
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
      }
    : null;

  return (
    <main>
      <PageHeader
        title="Products"
        subtitle="Intelligence after diagnosis — suitability, risk, liquidity and cost, not yield leaderboards."
        action={
          <Link href="/app/products/compare" className="btn btn-soft">
            Compare
          </Link>
        }
      />

      <InsightPanel eyebrow="Diagnosis before products">
        Review{" "}
        <Link href="/app/health" className="font-semibold text-accent">
          Wealth Health
        </Link>{" "}
        and{" "}
        <Link href="/app/actions" className="font-semibold text-accent">
          next-best actions
        </Link>{" "}
        before browsing. Products here are approved catalogue entries — not a purchase instruction.
      </InsightPanel>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/app/actions" className="btn btn-ghost text-sm">
          Open recommendations first
        </Link>
        <Link href="/app/wealthguard" className="btn btn-ghost text-sm">
          Check an offer in WealthGuard
        </Link>
      </div>

      <div className="mt-5 space-y-3">
        {products.length ? (
          products.map((p) => {
            const suitability =
              customer != null
                ? assessSuitability(customer, {
                    id: p.id,
                    name: p.name,
                    riskRating: p.riskRating as "LOW",
                    liquidity: p.liquidity as "HIGH",
                    complexity: "simple",
                    currency: p.currency,
                    minimumInvestment: p.minimumInvestment,
                  })
                : null;

            return (
              <Link key={p.id} href={`/app/products/${p.id}`} className="block">
                <article className="action-card transition hover:border-accent">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{p.riskRating.replaceAll("_", " ")}</Badge>
                    <Badge>{p.liquidity} liquidity</Badge>
                    <Badge>{p.assetClass}</Badge>
                    {suitability ? (
                      <Badge
                        tone={
                          suitability.outcome === "unsuitable" || suitability.outcome === "escalate"
                            ? "warn"
                            : "default"
                        }
                      >
                        {suitability.outcome.replaceAll("_", " ")}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="font-display mt-2 text-xl">{p.name}</p>
                  <p className="muted text-sm">
                    {p.provider.name} · licence {p.provider.licenceStatus}
                    {p.provider.licenceNumber ? ` (${p.provider.licenceNumber})` : ""}
                  </p>
                  <p className="mt-2 text-sm">
                    Min {formatCurrency(p.minimumInvestment, p.currency)} · compare on suitability,
                    not yield banners
                  </p>
                </article>
              </Link>
            );
          })
        ) : (
          <EmptyState
            title="No approved products yet"
            body="Catalogue entries appear after maker-checker approval. Diagnosis and WealthGuard still work without a shelf."
            action={
              <Link href="/app/actions" className="btn btn-accent">
                Review actions
              </Link>
            }
          />
        )}
      </div>
    </main>
  );
}
