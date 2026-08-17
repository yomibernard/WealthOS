"use client";

import { FormEvent, useState } from "react";
import { Button, Field, PageHeader, Panel } from "@/components/ui";
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

export default function WealthGuardPage() {
  const [mode, setMode] = useState<SourceMode>("text");
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

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

    const res = await fetch("/api/wealthguard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: payloadText, sourceType }),
    });
    const data = await res.json();
    setLoading(false);
    setResult(data);
  }

  return (
    <main>
      <PageHeader
        title="WealthGuard"
        subtitle="Drop an investment offer here — text, link note, or document reference. We extract claims and flag warning indicators without calling something a scam or safe."
      />

      <div className="mb-3 flex flex-wrap gap-2" role="tablist" aria-label="WealthGuard input type">
        {(
          [
            ["text", "Paste text"],
            ["link", "Link / WhatsApp"],
            ["file", "PDF / image note"],
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

      <Panel className="border-dashed">
        <form className="space-y-4" onSubmit={onSubmit}>
          <p className="font-display text-lg font-semibold tracking-tight">
            Drop an investment offer here
          </p>
          <p className="muted text-sm leading-relaxed">
            Support: pasted text, link notes, screenshots/PDFs as references. Binary OCR remains
            limited — paste key claims for the strongest analysis.
          </p>
          {mode === "link" ? (
            <Field label="Link or channel note" id="link" hint="We do not auto-fetch arbitrary URLs in MVP.">
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
              hint="Binary OCR pipeline is Phase 2. Paste the important text for analysis now."
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
            label={
              mode === "text"
                ? "Investment offer text"
                : "Offer details / extracted text"
            }
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

      {result?.error ? (
        <Panel className="mt-4">
          <p className="text-danger" role="alert">
            {result.error}
          </p>
        </Panel>
      ) : null}

      {result && !result.error ? (
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
      ) : null}
    </main>
  );
}
