"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Field, Panel, TextInput } from "@/components/ui";

const MATERIAL_TYPES = new Set([
  "DEPLOY_IDLE_CASH",
  "REPAY_DEBT",
  "INCREASE_FX_EXPOSURE",
  "BUY_PROTECTION",
  "INCREASE_GOAL_CONTRIBUTION",
]);

export function ActionFeedback({
  recommendationId,
  actionType,
  title,
}: {
  recommendationId: string;
  actionType: string;
  title: string;
}) {
  const [reason, setReason] = useState("");
  const [stepUpCode, setStepUpCode] = useState("");
  const [requestExecution, setRequestExecution] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const needsStepUp = MATERIAL_TYPES.has(actionType);

  async function submit(status: "ACCEPTED" | "REJECTED") {
    setError(null);
    const res = await fetch(`/api/recommendations/${recommendationId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        reason,
        stepUpCode: status === "ACCEPTED" && needsStepUp ? stepUpCode : undefined,
        requestExecution: status === "ACCEPTED" && needsStepUp ? requestExecution : false,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "We could not record your response.");
      return;
    }
    if (data.execution?.instructionId) {
      setExecutionId(data.execution.instructionId);
      setDone(data.execution.message);
    } else if (status === "ACCEPTED") {
      setDone(
        needsStepUp
          ? "Accepted. No partner instruction was sent — enable “Send to partner rail” to simulate execution."
          : "Noted — thank you.",
      );
    } else {
      setDone("Feedback captured.");
    }
  }

  if (done) {
    return (
      <Panel className="mt-4 space-y-3">
        <p>{done}</p>
        {executionId ? (
          <Link href={`/app/executions/${executionId}`} className="btn btn-soft w-full">
            View receipt
          </Link>
        ) : null}
      </Panel>
    );
  }

  return (
    <Panel className="mt-4 space-y-3">
      <p className="font-semibold">Your response</p>
      <Field label="If this is not for you, tell us why (optional)" id="reason">
        <TextInput id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>

      {needsStepUp ? (
        <div className="rounded-xl border border-line bg-surface p-3 space-y-3">
          <div>
            <p className="text-sm font-semibold">Step-up confirmation required</p>
            <p className="muted mt-1 text-sm">
              “{title}” is a material action. Confirm with code <strong>123456</strong> (demo MFA).
            </p>
          </div>
          <Field label="Confirmation code" id="stepup">
            <TextInput
              id="stepup"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={stepUpCode}
              onChange={(e) => setStepUpCode(e.target.value)}
              placeholder="6-digit code"
            />
          </Field>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={requestExecution}
              onChange={(e) => setRequestExecution(e.target.checked)}
            />
            <span>
              Send to regulated partner demo rail after confirmation.{" "}
              <span className="muted">No real funds move; a receipt will be issued.</span>
            </span>
          </label>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="accent" onClick={() => void submit("ACCEPTED")}>
          {needsStepUp ? "Confirm & accept" : "Accept"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => void submit("REJECTED")}>
          Not now
        </Button>
        <Button type="button" variant="ghost" onClick={() => void submit("REJECTED")}>
          I disagree
        </Button>
        <Link href="/app/support" className="btn btn-ghost">
          Speak to adviser
        </Link>
      </div>
    </Panel>
  );
}
