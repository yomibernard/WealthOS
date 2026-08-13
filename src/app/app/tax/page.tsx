import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { loadFxRates } from "@/services/wealth";
import { convertAmount } from "@/engines/fx";
import { analyseTaxLite } from "@/engines/tax";
import { formatNaira, formatPercent } from "@/lib/format";
import { getFeatureFlags } from "@/lib/feature-flags";

export default async function TaxPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  if (!getFeatureFlags().taxLite) {
    return (
      <main>
        <PageHeader title="Tax lite" subtitle="Temporarily unavailable." />
      </main>
    );
  }

  const [incomes, assets, rates] = await Promise.all([
    prisma.income.findMany({ where: { userId: user.id } }),
    prisma.asset.findMany({ where: { userId: user.id } }),
    loadFxRates(),
  ]);

  const fx = (currency: string, amount: number) => {
    const converted = convertAmount(amount, currency, "NGN", rates);
    return converted?.value ?? 0;
  };

  const hasInvestment = assets.some((a) => a.category === "INVESTMENT");
  const hasRental =
    assets.some((a) => a.category === "PROPERTY" && (a.incomeGenerated ?? 0) > 0) ||
    incomes.some((i) => /rent/i.test(`${i.type} ${i.label}`));

  const tax = analyseTaxLite(incomes, fx, hasInvestment, hasRental);

  return (
    <main>
      <PageHeader
        title="Tax lite"
        subtitle="Nigeria-first awareness for planning conversations — not a tax return."
        action={
          <Link href="/app/adviser-request" className="btn btn-soft">
            Ask an adviser
          </Link>
        }
      />

      <Panel>
        <div className="flex flex-wrap gap-2">
          <Badge>{tax.engineVersion}</Badge>
          <Badge tone="warn">Illustrative</Badge>
        </div>
        <p className="font-display mt-3 text-4xl">{formatNaira(tax.illustrativePitNgn, true)}</p>
        <p className="muted text-sm">Illustrative annual PIT estimate</p>
        <p className="mt-4 leading-relaxed">{tax.narrative}</p>
        <p className="muted mt-3 text-xs">{tax.disclaimer}</p>
      </Panel>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Panel>
          <p className="eyebrow">Employment (ann.)</p>
          <p className="font-display mt-1 text-2xl">
            {formatNaira(tax.annualEmploymentNgn, true)}
          </p>
        </Panel>
        <Panel>
          <p className="eyebrow">Other income (ann.)</p>
          <p className="font-display mt-1 text-2xl">
            {formatNaira(tax.annualOtherIncomeNgn, true)}
          </p>
        </Panel>
        <Panel>
          <p className="eyebrow">Taxable estimate</p>
          <p className="font-display mt-1 text-2xl">
            {formatNaira(tax.annualTaxableEstimateNgn, true)}
          </p>
        </Panel>
        <Panel>
          <p className="eyebrow">Effective rate</p>
          <p className="font-display mt-1 text-2xl">
            {formatPercent(tax.effectiveRate * 100, 1)}
          </p>
        </Panel>
      </div>

      <Panel className="mt-3">
        <p className="eyebrow">Withholding & planning notes</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {tax.withholdingNotes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </Panel>

      {tax.planningFlags.length ? (
        <Panel className="mt-3">
          <p className="eyebrow">Flags</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {tax.planningFlags.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </main>
  );
}
