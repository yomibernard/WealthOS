"use client";

import { clsx } from "clsx";
import type { ScenarioOption } from "@/engines/goals";
import { formatNaira } from "@/lib/format";

export function ScenarioCompareCards({
  scenarios,
  highlightId,
}: {
  scenarios: ScenarioOption[];
  highlightId?: string;
}) {
  return (
    <div className="mt-3 grid gap-3 md:grid-cols-3">
      {scenarios.map((s) => {
        const hot = highlightId === s.id;
        return (
          <article
            key={s.id}
            className={clsx(
              "rounded-[var(--radius)] border p-4",
              hot ? "border-accent bg-accent-soft/40" : "border-line bg-white",
            )}
          >
            <p className="eyebrow">Option {s.id}</p>
            <h3 className="font-display mt-1 text-xl font-semibold tracking-tight">{s.label}</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="muted">Liquidity</dt>
                <dd className="font-semibold">{formatNaira(s.liquidityDelta, true)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="muted">Debt</dt>
                <dd className="font-semibold">{formatNaira(s.debtDelta, true)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="muted">Monthly cash flow</dt>
                <dd className="font-semibold">{formatNaira(s.cashFlowMonthlyDelta, true)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="muted">Concentration</dt>
                <dd className="font-semibold">{s.concentrationDelta > 0 ? "+" : ""}
                  {s.concentrationDelta} pts
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-sm leading-relaxed">{s.goalImpact}</p>
            <p className="mt-2 text-sm text-warning">{s.riskNote}</p>
          </article>
        );
      })}
    </div>
  );
}
