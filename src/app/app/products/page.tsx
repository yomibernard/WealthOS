import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/format";

export default async function ProductsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const products = await prisma.product.findMany({
    where: { approvalStatus: "approved" },
    include: { provider: true },
    orderBy: { name: "asc" },
  });

  return (
    <main>
      <PageHeader
        title="Product intelligence"
        subtitle="Compare on suitability, risk, liquidity and cost — not yield leaderboards."
        action={
          <Link href="/app/products/compare" className="btn btn-soft">
            Compare
          </Link>
        }
      />
      <div className="space-y-3">
        {products.map((p) => (
          <Link key={p.id} href={`/app/products/${p.id}`}>
            <Panel>
              <div className="flex flex-wrap gap-2">
                <Badge>{p.riskRating.replaceAll("_", " ")}</Badge>
                <Badge>{p.liquidity} liquidity</Badge>
              </div>
              <p className="font-display mt-2 text-xl">{p.name}</p>
              <p className="muted text-sm">
                {p.provider.name} · {p.provider.licenceStatus}
              </p>
              <p className="mt-2 text-sm">
                Min {formatCurrency(p.minimumInvestment, p.currency)} · {p.assetClass}
              </p>
            </Panel>
          </Link>
        ))}
      </div>
    </main>
  );
}
