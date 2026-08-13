import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { loadFxRates } from "@/services/wealth";
import { convertAmount } from "@/engines/fx";
import { calculateNetWorth } from "@/engines/net-worth";
import { analyseCrypto } from "@/engines/crypto";
import { formatNaira, formatPercent } from "@/lib/format";
import { getFeatureFlags } from "@/lib/feature-flags";

export default async function CryptoPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  if (!getFeatureFlags().cryptoLite) {
    return (
      <main>
        <PageHeader title="Crypto lite" subtitle="Temporarily unavailable." />
      </main>
    );
  }

  const [assets, liabilities, rates] = await Promise.all([
    prisma.asset.findMany({ where: { userId: user.id } }),
    prisma.liability.findMany({ where: { userId: user.id } }),
    loadFxRates(),
  ]);

  const fx = (currency: string, amount: number) => {
    const converted = convertAmount(amount, currency, "NGN", rates);
    return converted?.value ?? 0;
  };

  const nw = calculateNetWorth(assets, liabilities, rates);
  const cryptoAssets = assets.filter(
    (a) =>
      a.category === "CRYPTO" ||
      /crypto|bitcoin|btc|eth|usdt|token/i.test(`${a.assetType} ${a.name}`),
  );
  const intel = analyseCrypto(cryptoAssets, nw.totalAssetsNgn, fx);

  return (
    <main>
      <PageHeader
        title="Crypto lite"
        subtitle="Record holdings for net-worth awareness. Trading and live prices are deliberately deferred."
        action={
          <Link href="/app/wealthguard" className="btn btn-soft">
            WealthGuard
          </Link>
        }
      />

      <Panel>
        <div className="flex flex-wrap gap-2">
          <Badge>{intel.engineVersion}</Badge>
          <Badge tone="warn">No trading</Badge>
        </div>
        <p className="font-display mt-3 text-4xl">{formatNaira(intel.totalCryptoNgn, true)}</p>
        <p className="muted text-sm">Recorded crypto (NGN estimate)</p>
        <p className="mt-4 leading-relaxed">{intel.narrative}</p>
        <p className="muted mt-3 text-xs">{intel.disclaimer}</p>
      </Panel>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Panel>
          <p className="eyebrow">Share of assets</p>
          <p className="font-display mt-1 text-2xl">
            {formatPercent(intel.concentrationOfAssets * 100, 0)}
          </p>
        </Panel>
        <Panel>
          <p className="eyebrow">Stale marks</p>
          <p className="font-display mt-1 text-2xl">{intel.staleCount}</p>
        </Panel>
      </div>

      <Panel className="mt-3">
        <p className="eyebrow">Deferred on purpose</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {intel.deferredCapabilities.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
        <p className="muted mt-3 text-sm">
          Suspicious offers?{" "}
          <Link href="/app/wealthguard" className="font-semibold text-accent">
            Run WealthGuard
          </Link>{" "}
          before you act.
        </p>
      </Panel>

      {intel.signals.length ? (
        <Panel className="mt-3">
          <p className="eyebrow">Signals</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {intel.signals.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <section className="mt-5" aria-labelledby="crypto-holdings">
        <h2 id="crypto-holdings" className="font-display text-xl">
          Holdings
        </h2>
        <div className="mt-3 space-y-3">
          {intel.holdings.length === 0 ? (
            <Panel>
              <p className="muted text-sm">
                No crypto recorded.{" "}
                <Link href="/app/wealth/add" className="font-semibold text-accent">
                  Add a holding
                </Link>{" "}
                (type: Crypto) for awareness only — not a buy button.
              </p>
            </Panel>
          ) : (
            intel.holdings.map((h) => (
              <Panel key={h.id}>
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-semibold">{h.name}</p>
                    <p className="muted text-sm">
                      {h.provider ?? "Manual"}
                      {h.stale ? " · stale mark" : ""}
                    </p>
                  </div>
                  <p className="font-display text-xl">{formatNaira(h.ownedValueNgn, true)}</p>
                </div>
              </Panel>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
