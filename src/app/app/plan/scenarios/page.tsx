"use client";

import { useMemo, useState } from "react";
import { Field, PageHeader, Panel, TextInput } from "@/components/ui";
import { comparePropertyDecision } from "@/engines/goals";
import { formatNaira } from "@/lib/format";

export default function ScenariosPage() {
  const [price, setPrice] = useState("70000000");
  const [cash, setCash] = useState("25000000");
  const scenarios = useMemo(
    () =>
      comparePropertyDecision({
        propertyPrice: Number(price) || 0,
        cashAvailable: Number(cash) || 0,
        mortgageRateAnnual: 0.22,
        mortgageTermYears: 20,
        rentMonthly: 1500000,
        investReturnAnnual: 0.12,
      }),
    [price, cash],
  );

  return (
    <main>
      <PageHeader
        title="Decision simulator"
        subtitle="Should I buy a property? Compare cash, mortgage and rent+invest — without false certainty."
      />
      <Panel className="space-y-3">
        <Field label="Property price (₦)" id="price">
          <TextInput id="price" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field label="Cash available (₦)" id="cash">
          <TextInput id="cash" value={cash} onChange={(e) => setCash(e.target.value)} />
        </Field>
      </Panel>
      <div className="mt-3 space-y-3">
        {scenarios.map((s) => (
          <Panel key={s.id}>
            <p className="eyebrow">Option {s.id}</p>
            <p className="font-display mt-1 text-2xl">{s.label}</p>
            <ul className="muted mt-3 space-y-1 text-sm">
              <li>Liquidity impact: {formatNaira(s.liquidityDelta, true)}</li>
              <li>Debt impact: {formatNaira(s.debtDelta, true)}</li>
              <li>Monthly cash-flow delta: {formatNaira(s.cashFlowMonthlyDelta, true)}</li>
              <li>Concentration delta: {s.concentrationDelta} pts</li>
            </ul>
            <p className="mt-3 text-sm">{s.goalImpact}</p>
            <p className="mt-2 text-sm text-warning">{s.riskNote}</p>
          </Panel>
        ))}
      </div>
    </main>
  );
}
