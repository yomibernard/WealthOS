"use client";

import { FormEvent, useState } from "react";
import { Button, Field, Panel, TextInput } from "@/components/ui";
import { listNudgeTypes } from "@/engines/adviser-nudge";

const types = listNudgeTypes();

export function AdviserNudgePanel({ customerId }: { customerId: string }) {
  const [nudgeType, setNudgeType] = useState(types[0].type);
  const [personalNote, setPersonalNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/api/adviser/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          nudgeType,
          personalNote: personalNote.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string; title?: string };
      if (!res.ok) {
        setError(data.error ?? "Nudge failed.");
        return;
      }
      setMsg(`Sent: ${data.title}`);
      setPersonalNote("");
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel className="mt-4 space-y-3">
      <p className="eyebrow">Request from customer</p>
      <p className="muted text-sm">
        Send a calm nudge into their inbox and shared notes. No products are purchased.
      </p>
      <form className="space-y-3" onSubmit={onSubmit}>
        <Field label="Nudge type" id="nudge-type">
          <select
            id="nudge-type"
            className="min-h-12 w-full rounded-xl border border-line bg-white px-3"
            value={nudgeType}
            onChange={(e) => setNudgeType(e.target.value as typeof nudgeType)}
          >
            {types.map((t) => (
              <option key={t.type} value={t.type}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="nudge-note" label="Optional note" hint="Shown to the customer.">
          <TextInput
            value={personalNote}
            onChange={(e) => setPersonalNote(e.target.value)}
            maxLength={400}
            placeholder="e.g. Let’s refresh the Lagos property estimate before Friday."
          />
        </Field>
        <Button type="submit" variant="soft" disabled={loading}>
          {loading ? "Sending…" : "Send nudge"}
        </Button>
      </form>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {msg ? (
        <p className="text-sm text-accent" role="status">
          {msg}
        </p>
      ) : null}
    </Panel>
  );
}
