import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, HeroMetric, InsightPanel, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { loadFxRates } from "@/services/wealth";
import { convertAmount } from "@/engines/fx";
import { analyseInsurance } from "@/engines/insurance";
import { formatNaira, formatPercent } from "@/lib/format";
import { getFeatureFlags } from "@/lib/feature-flags";

function toAnnual(amount: number, frequency: string): number {
  if (frequency === "annual" || frequency === "yearly") return amount;
  if (frequency === "weekly") return amount * 52;
  return amount * 12;
}

export default async function InsurancePage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  if (!getFeatureFlags().insuranceIntel) {
    return (
      <main>
        <PageHeader title="Insurance" subtitle="Temporarily unavailable." />
      </main>
    );
  }

  const [assets, incomes, household, rates] = await Promise.all([
    prisma.asset.findMany({ where: { userId: user.id, category: "INSURANCE" } }),
    prisma.income.findMany({ where: { userId: user.id } }),
    prisma.householdMember.findMany({ where: { userId: user.id } }),
    loadFxRates(),
  ]);

  const fx = (currency: string, amount: number) => {
    const converted = convertAmount(amount, currency, "NGN", rates);
    return converted?.value ?? 0;
  };

  const annualIncome = incomes.reduce(
    (s, i) => s + fx(i.currency, toAnnual(i.amount, i.frequency)),
    0,
  );
  const hasDependants = household.some((h) => h.dependant);

  const intel = analyseInsurance(assets, annualIncome, fx, hasDependants);
  const life = intel.covers.filter((c) => /life/i.test(c.coverType) || /life/i.test(c.name));
  const other = intel.covers.filter((c) => !life.some((l) => l.id === c.id));

  return (
    <main>
      <PageHeader
        title="Insurance"
        subtitle="Protection-first inventory — what you hold and where records look thin. Not a sales floor."
      />

      <HeroMetric
        label="Sum assured recorded"
        value={formatNaira(intel.totalSumAssuredNgn, true)}
        hint={
          <>
            <Badge>{intel.engineVersion}</Badge>
            <Badge>{intel.covers.length} policies</Badge>
            {intel.lifeMultipleOfIncome != null && intel.lifeMultipleOfIncome > 0 ? (
              <Badge>Life ~{intel.lifeMultipleOfIncome.toFixed(1)}× income</Badge>
            ) : null}
          </>
        }
      />

      <InsightPanel className="mt-4" eyebrow="Protection lens">
        {intel.narrative}
      </InsightPanel>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Panel>
          <p className="eyebrow">Annual income (est.)</p>
          <p className="font-display mt-1 text-2xl">{formatNaira(intel.annualIncomeNgn, true)}</p>
        </Panel>
        <Panel>
          <p className="eyebrow">Dependants on file</p>
          <p className="font-display mt-1 text-2xl">{hasDependants ? "Yes" : "None marked"}</p>
        </Panel>
      </div>

      {intel.gaps.length > 0 ? (
        <Panel className="mt-3">
          <p className="eyebrow">Coverage gaps in your record</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {intel.gaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
          <p className="muted mt-3 text-sm">
            Confirm existing cover before shopping.{" "}
            <Link href="/app/adviser-request" className="font-semibold text-accent">
              Speak with an adviser
            </Link>{" "}
            for product choice — WealthOS will not hard-sell policies here.
          </p>
        </Panel>
      ) : null}

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

      <CoverSection title="Life cover" covers={life} empty="No life policies recorded." />
      <CoverSection title="Other cover" covers={other} empty="No other policies recorded." />

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/app/household" className="btn btn-soft">
          Review beneficiaries / household
        </Link>
        <Link href="/app/documents" className="btn btn-ghost">
          Policy documents
        </Link>
        <Link href="/app/wealth/add" className="btn btn-ghost">
          Add a policy
        </Link>
      </div>

      <p className="muted mt-4 text-xs">{intel.disclaimer}</p>
    </main>
  );
}

function CoverSection({
  title,
  covers,
  empty,
}: {
  title: string;
  covers: {
    id: string;
    name: string;
    coverType: string;
    provider: string | null;
    sumAssuredNgn: number | null;
    notes: string | null;
    confidence: number;
  }[];
  empty: string;
}) {
  return (
    <section className="mt-5">
      <h2 className="font-display text-xl">{title}</h2>
      <div className="mt-3 space-y-3">
        {covers.length === 0 ? (
          <p className="muted text-sm">{empty}</p>
        ) : (
          covers.map((c) => (
            <article key={c.id} className="asset-tile">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="muted text-sm">
                    {c.coverType}
                    {c.provider ? ` · ${c.provider}` : ""}
                  </p>
                </div>
                <p className="font-display text-xl">
                  {c.sumAssuredNgn == null ? "—" : formatNaira(c.sumAssuredNgn, true)}
                </p>
              </div>
              {c.notes ? <p className="muted mt-2 text-sm">{c.notes}</p> : null}
              <p className="muted mt-1 text-xs">
                Premium / renewal detail may sit in notes or documents · confidence{" "}
                {formatPercent(c.confidence * 100, 0)}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
