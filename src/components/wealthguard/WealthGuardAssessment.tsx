"use client";

import Link from "next/link";
import { Badge } from "@/components/ui";

type Extracted = Record<string, string | undefined>;

const EXTRACT_LABELS: { key: string; label: string }[] = [
  { key: "provider", label: "Provider" },
  { key: "product", label: "Product" },
  { key: "promisedReturn", label: "Return claim" },
  { key: "liquidity", label: "Liquidity" },
  { key: "fees", label: "Fees" },
  { key: "custody", label: "Custody" },
  { key: "minimum", label: "Minimum" },
  { key: "regulatoryClaims", label: "Regulatory claims" },
  { key: "terms", label: "Terms" },
  { key: "risks", label: "Stated risks" },
];

export function WealthGuardAssessment({
  overallOutcome,
  providerVerification,
  transparency,
  returnClaim,
  explanation,
  warningIndicators,
  extracted,
  version,
}: {
  overallOutcome: string;
  providerVerification: string;
  transparency: string;
  returnClaim: string;
  explanation: string;
  warningIndicators: string[];
  extracted: Extracted;
  version?: string;
}) {
  const tone =
    overallOutcome.includes("Significant")
      ? "danger"
      : overallOutcome.includes("Further")
        ? "warn"
        : "default";

  const detailRows = EXTRACT_LABELS.map(({ key, label }) => ({
    label,
    value: extracted[key]?.trim() || "Not stated in the submitted text",
  }));

  return (
    <section className="hero-metric mt-4 space-y-4 animate-rise">
      <div>
        <p className="eyebrow">WealthGuard assessment</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone={tone}>{overallOutcome}</Badge>
          {version ? <Badge>Engine {version}</Badge> : null}
        </div>
        <p className="mt-3 leading-relaxed text-ink-soft">{explanation}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {[
          { label: "Provider verification", value: providerVerification },
          { label: "Transparency", value: transparency },
          { label: "Return claim", value: returnClaim },
        ].map((row) => (
          <div key={row.label} className="rounded-[var(--radius-sm)] border border-line bg-white p-3">
            <p className="text-xs font-semibold text-muted">{row.label}</p>
            <p className="mt-1 font-semibold">{row.value}</p>
          </div>
        ))}
      </div>

      {warningIndicators?.length ? (
        <div className="risk-alert">
          <p className="font-semibold">Warning indicators</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {warningIndicators.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="action-card">
        <p className="eyebrow">Extracted offer details</p>
        <dl className="mt-3 space-y-2 text-sm">
          {detailRows.map((r) => (
            <div
              key={r.label}
              className="flex flex-col gap-0.5 border-b border-line/70 py-2 last:border-0 sm:flex-row sm:justify-between sm:gap-3"
            >
              <dt className="muted font-semibold">{r.label}</dt>
              <dd className="sm:text-right">{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href="/app/ai" className="btn btn-accent flex-1">
          Ask WealthAI about this offer
        </Link>
        <Link href="/app/adviser-request" className="btn btn-ghost flex-1">
          Request adviser review
        </Link>
      </div>

      <p className="muted text-xs leading-relaxed">
        WealthGuard never auto-labels an offer as scam, safe, or guaranteed. Outcomes reflect
        verification signals and claim unusualness only.
      </p>
    </section>
  );
}
