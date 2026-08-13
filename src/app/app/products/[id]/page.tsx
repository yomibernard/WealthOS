import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/format";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const product = await prisma.product.findUnique({
    where: { id },
    include: { provider: true },
  });
  if (!product || product.approvalStatus !== "approved") redirect("/app/products");

  return (
    <main>
      <PageHeader title={product.name} subtitle={product.provider.name} />
      <Panel className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge>{product.riskRating.replaceAll("_", " ")}</Badge>
          <Badge>{product.liquidity}</Badge>
          <Badge>{product.currency}</Badge>
        </div>
        <p>
          <strong>Licence:</strong> {product.provider.licenceStatus}
          {product.provider.licenceNumber ? ` (${product.provider.licenceNumber})` : ""}
        </p>
        <p>
          <strong>Minimum:</strong> {formatCurrency(product.minimumInvestment, product.currency)}
        </p>
        <p>
          <strong>Objective:</strong> {product.investmentObjective ?? "See official documents"}
        </p>
        <p>
          <strong>Key risks:</strong> {product.keyRisks ?? "See official documents"}
        </p>
        <p>
          <strong>Fees:</strong> {product.feesJson}
        </p>
        <p className="muted text-sm">
          Historical performance is not a guide to future results. Suitability must be assessed before
          any recommendation.
        </p>
      </Panel>
    </main>
  );
}
