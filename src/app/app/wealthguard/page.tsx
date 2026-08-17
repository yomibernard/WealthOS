"use client";

import { FormEvent, useState } from "react";
import { Button, Field, InsightPanel, PageHeader, Panel } from "@/components/ui";
import { WealthGuardAssessment } from "@/components/wealthguard/WealthGuardAssessment";

type Result = {
  providerVerification: string;
  transparency: string;
  returnClaim: string;
  overallOutcome: string;
  explanation: string;
  warningIndicators: string[];
  extracted: Record<string, string | undefined>;
  version?: string;
  error?: string;
};

type SourceMode = "text" | "link" | "file";

const PIPELINE = [
  "Provider",
  "Return",
  "Liquidity",
  "Custody",
  "Fees",
  "Risk disclosure",
] as const;

export default function WealthGuardPage() {
  const [mode, setMode] = useState<SourceMode>("text");
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setPipelineStep(0);

    const tick = window.setInterval(() => {
      setPipelineStep((s) => Math.min(PIPELINE.length - 1, s + 1));
    }, 280);

    let payloadText = text.trim();
    let sourceType: string = mode;

    if (mode === "link") {
      payloadText = [
        `Source link: ${link.trim()}`,
        text.trim() || "User submitted a link for verification. Page body not fetched in MVP for safety.",
      ].join("\n");
      sourceType = "link";
    } else if (mode === "file") {
      payloadText = [
        `Uploaded document reference: ${fileName || "untitled"}`,
        text.trim() ||
          "Document stored as a reference. Paste key extracted text below for analysis in this MVP.",
      ].join("\n");
      sourceType = "upload";
      if (fileName) {
        await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `WealthGuard: ${fileName}`,
            mimeType: "application/octet-stream",
          }),
        });
      }
    }

    try {
      const res = await fetch("/api/wealthguard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: payloadText, sourceType }),
      });
      const data = await res.json();
      setResult(data);
    } finally {
      window.clearInterval(tick);
      setPipelineStep(PIPELINE.length - 1);
      setLoading(false);
    }
  }

  return (
    <main>
      <PageHeader
        title="WealthGuard"
        subtitle="Check before you invest — flags gaps and unusual claims without auto-labelling scam or safe."
      />

      <section className="hero-metric">
        <p className="eyebrow">Protect the decision</p>
        <h2 className="font-display mt-1 text-3xl font-semibold tracking-tight">
          Check before you invest
        </h2>
        <p className="muted mt-2 max-w-2xl text-sm leading-relaxed">
          Paste text, note a link or WhatsApp forward, or reference a PDF/screenshot. WealthGuard
          extracts claims and warning indicators — it never auto-labels an offer as a scam or as safe.
        </p>
      </section>

      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="WealthGuard input type">
        {(
          [
            ["text", "Paste text"],
            ["link", "Link / WhatsApp"],
            ["file", "PDF / screenshot"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            className={`rounded-full border px-3 py-2 text-sm font-semibold ${
              mode === id ? "border-accent bg-accent-soft text-accent" : "border-line bg-white"
            }`}
            onClick={() => setMode(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <Panel className="mt-3 border-dashed">
        <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
          <p className="font-display text-lg font-semibold tracking-tight">
            Drop an investment offer here
          </p>
          <p className="muted text-sm leading-relaxed">
            Binary OCR remains limited — paste key claims for the strongest analysis. Demo rails stay
            labelled simulated where applicable.
          </p>
          {mode === "link" ? (
            <Field
              label="Link or channel note"
              id="link"
              hint="We do not auto-fetch arbitrary URLs in MVP."
            >
              <input
                id="link"
                className="min-h-12 w-full rounded-xl border border-line bg-white px-3"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://… or WhatsApp forward summary"
                required
              />
            </Field>
          ) : null}

          {mode === "file" ? (
            <Field
              label="Document name"
              id="fileName"
              hint="Paste the important text for analysis now."
            >
              <input
                id="fileName"
                className="min-h-12 w-full rounded-xl border border-line bg-white px-3"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. Horizon_offer.pdf"
                required
              />
            </Field>
          ) : null}

          <Field
            label={mode === "text" ? "Investment offer text" : "Offer details / extracted text"}
            id="offer"
          >
            <textarea
              id="offer"
              className="min-h-40 w-full rounded-xl border border-line bg-white p-3"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                mode === "text"
                  ? "Paste the WhatsApp advert, email or factsheet text…"
                  : "Paste key claims, promised return, fees, custody language…"
              }
              required={mode === "text"}
            />
          </Field>

          <Button type="submit" variant="accent" className="w-full" disabled={loading}>
            {loading ? "Analysing…" : "Analyse offer"}
          </Button>
        </form>
      </Panel>

      {loading ? (
        <section className="action-card mt-4" aria-live="polite">
          <p className="eyebrow">Analysis pipeline</p>
          <ol className="mt-3 grid gap-2 sm:grid-cols-3">
            {PIPELINE.map((step, i) => (
              <li
                key={step}
                className={`rounded-[var(--radius-sm)] border px-3 py-2 text-sm font-semibold ${
                  i <= pipelineStep
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-line bg-white text-muted"
                }`}
              >
                {step}
              </li>
            ))}
          </ol>
          <p className="muted mt-3 text-sm">
            Checking provider, return claims, liquidity, custody, fees, and risk disclosure…
          </p>
        </section>
      ) : null}

      {result?.error ? (
        <Panel className="mt-4">
          <p className="text-danger" role="alert">
            {result.error}
          </p>
        </Panel>
      ) : null}

      {result && !result.error ? (
        <>
          <InsightPanel className="mt-4" eyebrow="Outcomes you will see">
            Lower concern · Further checks required · Significant warning indicators — never “scam”
            or “safe”.
          </InsightPanel>
          <WealthGuardAssessment
            overallOutcome={result.overallOutcome}
            providerVerification={result.providerVerification}
            transparency={result.transparency}
            returnClaim={result.returnClaim}
            explanation={result.explanation}
            warningIndicators={result.warningIndicators ?? []}
            extracted={result.extracted ?? {}}
            version={result.version}
          />
        </>
      ) : null}
    </main>
  );
}
