"use client";

import Link from "next/link";
import { clsx } from "clsx";

export type AiRichCard = {
  type: "scenario" | "metric" | "cta" | "alert";
  title: string;
  body?: string;
  rows?: { label: string; value: string }[];
  href?: string;
  ctaLabel?: string;
};

export function WealthAiAnswer({
  content,
  agent,
  confidence,
  escalate,
  assumptions,
  missingInformation,
  toolsUsed,
  cards,
}: {
  content: string;
  agent?: string;
  confidence?: number;
  escalate?: boolean;
  assumptions?: string[];
  missingInformation?: string[];
  toolsUsed?: string[];
  cards?: AiRichCard[];
}) {
  return (
    <div className="space-y-3">
      {agent ? <p className="eyebrow">{agent}</p> : null}
      <p className="whitespace-pre-wrap leading-relaxed">{content}</p>

      {cards?.length ? (
        <div className="space-y-2">
          {cards.map((card, i) => (
            <div
              key={`${card.type}-${card.title}-${i}`}
              className={clsx(
                "rounded-[var(--radius-sm)] border p-3",
                card.type === "alert"
                  ? "border-[color-mix(in_srgb,var(--warning)_30%,var(--line))] bg-[var(--warning-soft)]"
                  : "border-line bg-white",
              )}
            >
              <p className="font-semibold">{card.title}</p>
              {card.body ? <p className="muted mt-1 text-sm leading-relaxed">{card.body}</p> : null}
              {card.rows?.length ? (
                <dl className="mt-2 space-y-1 text-sm">
                  {card.rows.map((r) => (
                    <div key={r.label} className="flex justify-between gap-2">
                      <dt className="muted">{r.label}</dt>
                      <dd className="font-semibold">{r.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {card.href ? (
                <Link href={card.href} className="mt-2 inline-flex text-sm font-semibold text-accent">
                  {card.ctaLabel ?? "Open details"}
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {assumptions?.length ? (
        <details className="rounded-[var(--radius-sm)] border border-line bg-white p-3 text-sm">
          <summary className="cursor-pointer font-semibold">Assumptions</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            {assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </details>
      ) : null}

      {missingInformation?.length ? (
        <div className="rounded-[var(--radius-sm)] border border-line bg-white p-3 text-sm">
          <p className="font-semibold">Data gaps</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            {missingInformation.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 text-xs opacity-80">
        {confidence != null ? <span>Confidence {Math.round(confidence * 100)}%</span> : null}
        {escalate ? <span>· Escalation available</span> : null}
        {toolsUsed?.length ? <span>· Engines: {toolsUsed.join(", ")}</span> : null}
      </div>

      {escalate ? (
        <Link href="/app/adviser-request" className="btn btn-soft w-full text-sm">
          Request adviser review
        </Link>
      ) : null}
    </div>
  );
}
