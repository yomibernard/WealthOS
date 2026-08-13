import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { buildHomeDashboard } from "@/services/wealth";
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
          <Link href="/app/cashflow" className="text-sm font-semibold text-accent">
            Cash flow
          </Link>
          <Link href="/app/property" className="text-sm font-semibold text-accent">
            Property
          </Link>
          <Link href="/app/business" className="text-sm font-semibold text-accent">
            Business
          </Link>
          <Link href="/app/insurance" className="text-sm font-semibold text-accent">
            Insurance
          </Link>
          <Link href="/app/pension" className="text-sm font-semibold text-accent">
            Pension
          </Link>
          <Link href="/app/connections" className="text-sm font-semibold text-accent">
            Connections
          </Link>
          <Link href="/app/crypto" className="text-sm font-semibold text-accent">
            Crypto
          </Link>
          <Link href="/app/lending" className="text-sm font-semibold text-accent">
            Lending
          </Link>
        </div>
      </Panel>

      <Panel className="mt-3">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Allocation</p>
          <Link href="/app/wealth/allocation" className="text-sm font-semibold text-accent">
            View
          </Link>
        </div>
        <ul className="mt-3 space-y-2">
          {dash.netWorth.assetBreakdown.map((b) => (
            <li key={b.category} className="flex justify-between text-sm">
              <span>{b.category}</span>
              <span>
                {b.percent.toFixed(0)}% · {formatNaira(b.valueNgn, true)}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <section className="mt-5">
        <h2 className="font-display text-xl">Assets</h2>
        <div className="mt-3 space-y-3">
          {assets.map((a) => (
            <Panel key={a.id}>
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
            </Panel>
          ))}
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
            <Panel>
              <p className="muted">No liabilities recorded.</p>
            </Panel>
          )}
        </div>
      </section>
    </main>
  );
}
