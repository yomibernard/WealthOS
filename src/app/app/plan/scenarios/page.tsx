"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { ScenarioCompareCards } from "@/components/plan/ScenarioCompareCards";
import { comparePropertyDecision } from "@/engines/goals";
import { formatNaira } from "@/lib/format";

export default function ScenariosPage() {
  const [price, setPrice] = useState(70_000_000);
  const [cash, setCash] = useState(25_000_000);
  const [rent, setRent] = useState(1_500_000);
  const [ratePct, setRatePct] = useState(22);
  const [termYears, setTermYears] = useState(20);
  const [investPct, setInvestPct] = useState(12);

  const scenarios = useMemo(
    () =>
      comparePropertyDecision({
        propertyPrice: price,
        cashAvailable: cash,
        mortgageRateAnnual: ratePct / 100,
        mortgageTermYears: termYears,
        rentMonthly: rent,
        investReturnAnnual: investPct / 100,
      }),
    [price, cash, rent, ratePct, termYears, investPct],
  );

  const gap = Math.max(0, price - cash);

  return (
    <main>
      <PageHeader
        title="Affordability simulator"
        subtitle="Can I buy? Compare cash purchase, mortgage, and rent+invest — side by side. Illustrative only."
      />

      <section className="action-card space-y-4">
        <p className="eyebrow">If you buy today</p>
        <p className="text-sm leading-relaxed text-ink-soft">
          Asking price {formatNaira(price, true)}. Cash available {formatNaira(cash, true)}
          {gap > 0 ? ` · funding gap ${formatNaira(gap, true)}` : " · fully covered by cash"}.
        </p>

        <label className="block">
          <span className="text-sm font-semibold">Property price · {formatNaira(price, true)}</span>
          <input
            type="range"
            className="mt-2 w-full accent-[var(--accent)]"
            min={10_000_000}
            max={250_000_000}
            step={1_000_000}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold">Cash available · {formatNaira(cash, true)}</span>
          <input
            type="range"
            className="mt-2 w-full accent-[var(--accent)]"
            min={0}
            max={150_000_000}
            step={1_000_000}
            value={cash}
            onChange={(e) => setCash(Number(e.target.value))}
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold">
            Comparable rent · {formatNaira(rent, true)} / mo
          </span>
          <input
            type="range"
            className="mt-2 w-full accent-[var(--accent)]"
            min={200_000}
            max={5_000_000}
            step={50_000}
            value={rent}
            onChange={(e) => setRent(Number(e.target.value))}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold">Mortgage rate · {ratePct}%</span>
            <input
              type="range"
              className="mt-2 w-full accent-[var(--accent)]"
              min={8}
              max={35}
              step={0.5}
              value={ratePct}
              onChange={(e) => setRatePct(Number(e.target.value))}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Term · {termYears} years</span>
            <input
              type="range"
              className="mt-2 w-full accent-[var(--accent)]"
              min={5}
              max={30}
              value={termYears}
              onChange={(e) => setTermYears(Number(e.target.value))}
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold">
            Invest return if renting · {investPct}% p.a.
          </span>
          <input
            type="range"
            className="mt-2 w-full accent-[var(--accent)]"
            min={0}
            max={25}
            step={0.5}
            value={investPct}
            onChange={(e) => setInvestPct(Number(e.target.value))}
          />
        </label>
      </section>

      <ScenarioCompareCards scenarios={scenarios} />

      <p className="muted mt-4 text-sm leading-relaxed">
        Outcomes are assumption-driven. WealthOS does not recommend a specific property purchase or
        move funds.
      </p>

      <Link href="/app/ai" className="btn btn-soft mt-3 w-full">
        Ask WealthAI: can I afford this?
      </Link>
      <Link href="/app/plan" className="btn btn-ghost mt-2 w-full">
        Back to Plan
      </Link>
    </main>
  );
}
