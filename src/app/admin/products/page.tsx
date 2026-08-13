import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ProductStatusControls } from "@/components/ProductStatusControls";

export default async function AdminProductsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/auth/sign-in");
  const products = await prisma.product.findMany({ include: { provider: true } });

  return (
    <main className="page-wide">
      <PageHeader
        title="Product catalogue"
        subtitle="High-risk status changes should use maker-checker in production. Demo applies immediately with audit."
      />
      <div className="space-y-3">
        {products.map((p) => (
          <Panel key={p.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="muted text-sm">
                  {p.provider.name} · {p.provider.licenceStatus}
                </p>
              </div>
              <Badge tone={p.approvalStatus === "approved" ? "default" : "warn"}>
                {p.approvalStatus}
              </Badge>
            </div>
            <ProductStatusControls productId={p.id} status={p.approvalStatus} />
          </Panel>
        ))}
      </div>
    </main>
  );
}
