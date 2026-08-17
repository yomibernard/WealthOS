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
  careOpen = 0,
  risk,
}: {
  customerName: string;
  netWorth: number;
  health: number;
  attention: string[];
  goals: string[];
  careOpen?: number;
  risk?: string | null;
}) {
  const [output, setOutput] = useState("");

  const prompts = [
    {
      label: "Prepare me for this meeting",
      run: () =>
        [
          `Meeting prep for ${customerName}.`,
          `Estimated net worth ${formatNaira(netWorth, true)}; Wealth Health ${health}/100; risk ${risk ?? "unset"}.`,
          careOpen > 0
            ? `Open care items: ${careOpen} — lead with care before products.`
            : "No open care items on the desk — still confirm confidence and consent.",
          `Primary goals: ${goals.join(", ") || "none recorded"}.`,
          `Suggested agenda: (1) ${attention[0] ?? "data completeness / confidence"}, (2) goal funding for ${goals[0] ?? "priority goals"}, (3) whether a regulated next step is needed.`,
          "Do not invent balances, fees, licences, or returns. Engines calculate; you explain.",
        ].join(" "),
    },
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
    <Panel>
      <p className="eyebrow">Meeting tools</p>
      <p className="muted mt-1 text-sm">
        Grounded on this customer&apos;s Wealth Graph signals — not invented advice.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {prompts.map((p) => (
          <Button key={p.label} type="button" variant="soft" onClick={() => setOutput(p.run())}>
            {p.label}
          </Button>
        ))}
      </div>
      {output ? <p className="mt-4 text-sm leading-relaxed">{output}</p> : null}
    </Panel>
  );
}
