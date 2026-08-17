import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, HeroMetric, InsightPanel, PageHeader, Panel } from "@/components/ui";
import { PropertyPortfolio } from "@/components/wealth/PropertyPortfolio";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { loadFxRates } from "@/services/wealth";
import { convertAmount } from "@/engines/fx";
import { calculateNetWorth } from "@/engines/net-worth";
import { analyseProperty } from "@/engines/property";
import { formatNaira, formatPercent } from "@/lib/format";
import { getFeatureFlags } from "@/lib/feature-flags";

function regionHintFromNotes(notes: string | null | undefined, name: string) {
  const blob = `${notes ?? ""} ${name}`.toLowerCase();
  if (/lagos|lekki|ikoyi|victoria island|vi\b/.test(blob)) return "Lagos area";
  if (/abuja|asokoro|maitama|wuse/.test(blob)) return "Abuja area";
  if (/port harcourt|ph\b|rivers/.test(blob)) return "Rivers area";
  if (/ibadan|oyo/.test(blob)) return "Oyo area";
  return null;
}

export default async function PropertyPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  if (!getFeatureFlags().propertyIntel) {
    return (
      <main>
        <PageHeader title="Property" subtitle="Temporarily unavailable." />
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
  const properties = assets.filter((a) => a.category === "PROPERTY");
  const mortgages = liabilities.filter((l) => l.type === "MORTGAGE");
  const intel = analyseProperty(properties, mortgages, nw.totalAssetsNgn, fx);
  const byId = new Map(properties.map((p) => [p.id, p]));

  const cards = intel.holdings.map((h) => {
    const raw = byId.get(h.id);
    return {
      id: h.id,
      name: h.name,
      assetType: h.assetType,
      ownedValueNgn: h.ownedValueNgn,
      ownershipPercent: raw?.ownershipPercent ?? 100,
      grossYield: h.grossYield,
      monthsSinceValuation: h.monthsSinceValuation,
      stale: h.stale,
      confidence: h.confidence,
      verificationStatus: h.verificationStatus,
      coverSrc: raw?.coverStorageKey
        ? `/api/media?key=${encodeURIComponent(raw.coverStorageKey)}`
        : null,
      regionHint: regionHintFromNotes(raw?.notes, h.name),
    };
  });

  return (
    <main>
      <PageHeader
        title="Property"
        subtitle="Portfolio view of equity, leverage and yield — estimates, not appraisals. Precise street addresses stay optional."
        action={
          <Link href="/app/plan/scenarios" className="btn btn-soft">
            Buy vs rent
          </Link>
        }
      />

      <HeroMetric
        label="Estimated property equity"
        value={formatNaira(intel.equityNgn, true)}
        hint={
          <>
            <Badge>{intel.engineVersion}</Badge>
            <Badge tone={intel.concentrationOfAssets >= 0.5 ? "warn" : "default"}>
              {formatPercent(intel.concentrationOfAssets * 100, 0)} of assets
            </Badge>
          </>
        }
      />

      <InsightPanel className="mt-4" eyebrow="At a glance">
        {intel.narrative}
      </InsightPanel>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Panel>
          <p className="eyebrow">Owned value</p>
          <p className="font-display mt-1 text-2xl">
            {formatNaira(intel.propertyValueOwnedNgn, true)}
          </p>
        </Panel>
        <Panel>
          <p className="eyebrow">Mortgage / debt</p>
          <p className="font-display mt-1 text-2xl">
            {formatNaira(intel.mortgageBalanceNgn, true)}
          </p>
        </Panel>
        <Panel>
          <p className="eyebrow">LTV</p>
          <p className="font-display mt-1 text-2xl">
            {intel.ltv == null ? "—" : formatPercent(intel.ltv * 100, 0)}
          </p>
        </Panel>
        <Panel>
          <p className="eyebrow">Data confidence</p>
          <p className="font-display mt-1 text-2xl">
            {formatPercent(intel.weightedConfidence * 100, 0)}
          </p>
        </Panel>
      </div>

      {intel.signals.length > 0 ? (
        <Panel className="mt-3">
          <p className="eyebrow">Signals</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {intel.signals.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <section className="mt-5">
        <h2 className="font-display text-xl">Portfolio</h2>
        <p className="muted mt-1 text-sm">
          Value · ownership · income/yield · last valuation · confidence.
        </p>
        <div className="mt-3">
          <PropertyPortfolio holdings={cards} />
        </div>
      </section>

      <p className="muted mt-4 text-xs">{intel.disclaimer}</p>
    </main>
  );
}
