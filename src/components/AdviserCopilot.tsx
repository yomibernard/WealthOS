"use client";

import { useState } from "react";
import { Button, Panel } from "@/components/ui";
import { formatNaira } from "@/lib/format";

export function AdviserCopilot({
  customerName,
  netWorth,
  health,
  attention,
  goals,
}: {
  customerName: string;
  netWorth: number;
  health: number;
  attention: string[];
  goals: string[];
}) {
  const [output, setOutput] = useState("");

  const prompts = [
    {
      label: "Summarise this customer",
      run: () =>
        `${customerName} has estimated net worth ${formatNaira(netWorth, true)} and Wealth Health ${health}/100. Active goals: ${goals.join(", ") || "none"}. Priority attention: ${attention.join("; ") || "none recorded"}.`,
    },
    {
      label: "What should I discuss in the next call?",
      run: () =>
        `Discuss: (1) ${attention[0] ?? "data completeness"}, (2) goal funding progress for ${goals[0] ?? "priority goals"}, (3) whether human advice is needed for concentration or liquidity.`,
    },
    {
      label: "What risks require attention?",
      run: () =>
        attention.length
          ? attention.map((a, i) => `${i + 1}. ${a}`).join(" ")
          : "No open priority actions — still verify stale valuations and consent state.",
    },
  ];

  return (
    <Panel className="mt-4">
      <p className="eyebrow">Adviser Copilot</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {prompts.map((p) => (
          <Button key={p.label} type="button" variant="soft" onClick={() => setOutput(p.run())}>
            {p.label}
          </Button>
        ))}
      </div>
      {output ? <p className="mt-4 leading-relaxed">{output}</p> : null}
    </Panel>
  );
}
