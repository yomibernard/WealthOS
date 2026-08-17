import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, EmptyState, PageHeader, Panel } from "@/components/ui";
import { WealthMap } from "@/components/charts/WealthMap";
import { AssetCoverEditor } from "@/components/wealth/AssetCoverEditor";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { buildHomeDashboard } from "@/services/wealth";
import { buildWealthMapSegments } from "@/engines/wealth-visuals";
import { formatCurrency, formatNaira, provenanceLabel } from "@/lib/format";

export default async function WealthPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const dash = await buildHomeDashboard(user.id);
  if (!dash) redirect("/auth/sign-in");

  const assets = await prisma.asset.findMany({
    where: { userId: user.id },
    orderBy: { value: "desc" },
  });
  const liabilities = await prisma.liability.findMany({
    where: { userId: user.id },
    orderBy: { balance: "desc" },
  });

  const mapSegments = buildWealthMapSegments(
    dash.netWorth.assetBreakdown,
    dash.netWorth.totalLiabilitiesNgn,
  );

  return (
    <main>
      <PageHeader
        title="Wealth"
        subtitle="Your structured financial position — with provenance, not false precision."
        action={
          <Link href="/app/wealth/add" className="btn btn-soft">
            Add
          </Link>
        }
      />

      <Panel>
        <p className="eyebrow">Estimated net worth</p>
        <p className="font-display mt-1 text-4xl">
          {formatNaira(dash.netWorth.netWorthNgn, true)}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge>Confidence {Math.round(dash.netWorth.confidence * 100)}%</Badge>
          <Link href="/app/wealth/net-worth" className="text-sm font-semibold text-accent">
            Net worth detail
          </Link>
          <Link href="/app/wealth/confidence" className="text-sm font-semibold text-accent">
            Data confidence
          </Link>
        </div>
      </Panel>

      <div className="mt-3">
        <WealthMap
          segments={mapSegments}
          totalAssetsNgn={dash.netWorth.totalAssetsNgn}
        />
      </div>

      <section className="mt-5">
        <h2 className="font-display text-xl">Assets</h2>
        <div className="mt-3 space-y-3">
          {assets.length ? (
            assets.map((a) => (
              <article key={a.id} className="asset-tile">
                {a.coverStorageKey ? (
                  <div className="mb-3 overflow-hidden rounded-[var(--radius-sm)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/media?key=${encodeURIComponent(a.coverStorageKey)}`}
                      alt=""
                      className="h-32 w-full object-cover"
                    />
                  </div>
                ) : null}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{a.name}</p>
                    <p className="muted text-sm">
                      {a.provider ?? a.assetType} · {a.ownershipPercent}% ownership
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatCurrency(a.value, a.currency, true)}
                  </p>
                </div>
                <p className="muted mt-2 text-sm">
                  {provenanceLabel(a.source, a.verificationStatus, a.lastValuationDate)}
                </p>
                {a.category === "PROPERTY" ? (
                  <AssetCoverEditor
                    assetId={a.id}
                    initialSrc={
                      a.coverStorageKey
                        ? `/api/media?key=${encodeURIComponent(a.coverStorageKey)}`
                        : null
                    }
                  />
                ) : null}
              </article>
            ))
          ) : (
            <EmptyState
              title="No assets added yet"
              body="Add what you own so WealthOS can build your Wealth Map and estimated net worth."
              action={
                <Link href="/app/wealth/add" className="btn btn-accent">
                  Add to my wealth
                </Link>
              }
            />
          )}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="font-display text-xl">Liabilities</h2>
        <div className="mt-3 space-y-3">
          {liabilities.length ? (
            liabilities.map((l) => (
              <Panel key={l.id}>
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-semibold">{l.name}</p>
                    <p className="muted text-sm">{l.type}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(l.balance, l.currency, true)}</p>
                </div>
              </Panel>
            ))
          ) : (
            <EmptyState
              title="No liabilities recorded"
              body="If you have loans or credit, add them so net worth and debt health stay honest."
              action={
                <Link href="/app/lending" className="btn btn-ghost">
                  Review lending awareness
                </Link>
              }
            />
          )}
        </div>
      </section>
    </main>
  );
}
