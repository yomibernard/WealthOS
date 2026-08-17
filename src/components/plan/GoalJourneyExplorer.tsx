"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { projectGoal } from "@/engines/goals";
import { formatCurrency } from "@/lib/format";
import { ProgressBar } from "@/components/ui";

type GoalSeed = {
  id: string;
  name: string;
  currency: string;
  targetAmount: number;
  existingAllocation: number;
  monthlyContribution: number;
  targetDateIso: string;
};

function addMonths(from: Date, months: number): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function GoalJourneyExplorer({ goal }: { goal: GoalSeed }) {
  const baseMonths = Math.max(
    1,
    Math.round(
      (new Date(goal.targetDateIso).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44),
    ),
  );
  const [monthly, setMonthly] = useState(goal.monthlyContribution);
  const [months, setMonths] = useState(Math.min(360, Math.max(6, baseMonths)));
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const forecast = useMemo(
    () =>
      projectGoal({
        targetAmount: goal.targetAmount,
        existingAllocation: goal.existingAllocation,
        monthlyContribution: monthly,
        targetDate: addMonths(new Date(), months),
      }),
    [goal.targetAmount, goal.existingAllocation, monthly, months],
  );

  const funded = Math.min(goal.targetAmount, goal.existingAllocation);
  const targetLabel = formatCurrency(goal.targetAmount, goal.currency, true);

  async function applyContribution() {
    setSaving(true);
    setSavedMsg(null);
    const res = await fetch(`/api/goals/${goal.id}/funding`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthlyContribution: monthly }),
    });
    setSaving(false);
    if (res.ok) {
      setSavedMsg("Monthly contribution saved. Projection above still uses your explored timeline.");
    } else {
      setSavedMsg("Could not save right now — your exploration still works offline.");
    }
  }

  return (
    <section className="action-card mt-3">
      <p className="eyebrow">Visual goal journey</p>
      <h2 className="font-display mt-1 text-xl font-semibold tracking-tight">{goal.name}</h2>
      <p className="muted mt-1 text-sm leading-relaxed">
        Drag the controls to see how funding and timing change the illustrative range — not a
        guarantee.
      </p>

      <div className="mt-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Central projection</p>
            <p className="font-display mt-1 text-3xl tracking-tight">
              {formatCurrency(forecast.projectedNominal, goal.currency, true)}
            </p>
          </div>
          <p className="font-display text-2xl">{forecast.progressPercent}%</p>
        </div>
        <div className="mt-3">
          <ProgressBar value={forecast.progressPercent} label={`Toward ${targetLabel}`} />
        </div>
        <p className="muted mt-2 text-sm">
          Range {formatCurrency(forecast.projectedLow, goal.currency, true)} –{" "}
          {formatCurrency(forecast.projectedHigh, goal.currency, true)} · already allocated{" "}
          {formatCurrency(funded, goal.currency, true)}
        </p>
        {forecast.shortfall > 0 ? (
          <p className="mt-2 text-sm text-warning">
            Modelled shortfall about {formatCurrency(forecast.shortfall, goal.currency, true)}.
            Suggested monthly near{" "}
            {formatCurrency(forecast.requiredMonthly, goal.currency, true)}.
          </p>
        ) : (
          <p className="mt-2 text-sm text-accent">Central path meets the target under these assumptions.</p>
        )}
        <p className="mt-3 text-sm leading-relaxed">{forecast.narrative}</p>
      </div>

      <label className="mt-5 block">
        <span className="text-sm font-semibold">
          Monthly contribution · {formatCurrency(monthly, goal.currency, true)}
        </span>
        <input
          type="range"
          className="mt-2 w-full accent-[var(--accent)]"
          min={0}
          max={Math.max(2_000_000, Math.round(forecast.requiredMonthly * 2) || 500_000)}
          step={10_000}
          value={monthly}
          onChange={(e) => setMonthly(Number(e.target.value))}
          aria-valuetext={formatCurrency(monthly, goal.currency, true)}
        />
      </label>

      <label className="mt-4 block">
        <span className="text-sm font-semibold">
          Horizon · {months} months (~{Math.round(months / 12)} years)
        </span>
        <input
          type="range"
          className="mt-2 w-full accent-[var(--accent)]"
          min={6}
          max={360}
          step={6}
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
        />
      </label>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className="btn btn-accent flex-1"
          disabled={saving}
          onClick={() => void applyContribution()}
        >
          {saving ? "Saving…" : "Save monthly contribution"}
        </button>
        <Link href="/app/plan/scenarios" className="btn btn-ghost flex-1">
          Affordability simulator
        </Link>
      </div>
      {savedMsg ? (
        <p className="muted mt-2 text-sm" role="status">
          {savedMsg}
        </p>
      ) : null}
      <p className="muted mt-3 text-xs">
        Engine {forecast.engineVersion} · expected return{" "}
        {(forecast.assumptions.expectedReturnAnnual * 100).toFixed(0)}% · inflation{" "}
        {(forecast.assumptions.inflationAnnual * 100).toFixed(0)}%
      </p>
    </section>
  );
}
