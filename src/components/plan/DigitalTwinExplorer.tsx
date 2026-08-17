"use client";

import { useMemo, useState } from "react";
import { runDigitalTwinLite } from "@/engines/goals";
import { formatNaira } from "@/lib/format";

export function DigitalTwinExplorer({
  baseNetWorthNgn,
  currentAge = 38,
}: {
  baseNetWorthNgn: number;
  currentAge?: number;
}) {
  const [retireAge, setRetireAge] = useState(55);
  const [extraMonthly, setExtraMonthly] = useState(0);

  const twin = useMemo(() => {
    const retire = runDigitalTwinLite(baseNetWorthNgn, {
      type: "retire_at",
      age: retireAge,
      currentAge,
    });
    const boost =
      extraMonthly > 0
        ? runDigitalTwinLite(baseNetWorthNgn, {
            type: "increase_contribution",
            monthlyDelta: extraMonthly,
          })
        : null;
    return { retire, boost };
  }, [baseNetWorthNgn, retireAge, currentAge, extraMonthly]);

  return (
    <section className="hero-metric mt-3">
      <p className="eyebrow">My Financial Future</p>
      <h2 className="font-display mt-1 text-xl font-semibold tracking-tight">Digital Twin Lite</h2>
      <p className="muted mt-1 text-sm leading-relaxed">
        Explore retirement timing and contribution shocks. Ranges are illustrative — engines
        calculate; nothing is invented.
      </p>

      <div className="mt-4 rounded-[var(--radius)] border border-line bg-white p-4">
        <p className="eyebrow">Today</p>
        <p className="font-display mt-1 text-2xl">{formatNaira(baseNetWorthNgn, true)}</p>
        <p className="muted text-sm">Estimated net worth starting point</p>
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-semibold">Retire at {retireAge}</span>
        <input
          type="range"
          className="mt-2 w-full accent-[var(--accent)]"
          min={Math.max(currentAge + 1, 45)}
          max={70}
          value={retireAge}
          onChange={(e) => setRetireAge(Number(e.target.value))}
        />
      </label>

      <div className="insight-panel mt-4">
        <p className="font-semibold">{twin.retire.headline}</p>
        <p className="font-display mt-2 text-2xl">
          {formatNaira(twin.retire.rangeLow, true)} – {formatNaira(twin.retire.rangeHigh, true)}
        </p>
        <p className="muted mt-2 text-sm">{twin.retire.caveat}</p>
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-semibold">
          Extra monthly investing · {formatNaira(extraMonthly, true)}
        </span>
        <input
          type="range"
          className="mt-2 w-full accent-[var(--accent)]"
          min={0}
          max={2_000_000}
          step={25_000}
          value={extraMonthly}
          onChange={(e) => setExtraMonthly(Number(e.target.value))}
        />
      </label>

      {twin.boost ? (
        <div className="goal-card mt-3">
          <p className="eyebrow">Contribution shock</p>
          <p className="mt-1 text-sm leading-relaxed">{twin.boost.headline}</p>
          <p className="font-display mt-2 text-xl">
            {formatNaira(twin.boost.rangeLow, true)} – {formatNaira(twin.boost.rangeHigh, true)}
          </p>
        </div>
      ) : null}
    </section>
  );
}
