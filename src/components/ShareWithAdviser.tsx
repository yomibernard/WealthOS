"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button, Field, TextInput } from "@/components/ui";

const packs = [
  { id: "full", label: "Full briefing" },
  { id: "weekly_digest", label: "Weekly digest" },
  { id: "profile", label: "Profile status" },
  { id: "funding", label: "Funding pulse" },
] as const;

export function ShareWithAdviser({
  defaultPack = "full",
  adviserName,
}: {
  defaultPack?: (typeof packs)[number]["id"];
  adviserName?: string | null;
}) {
  const [packType, setPackType] = useState<(typeof packs)[number]["id"]>(defaultPack);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!adviserName) {
    return (
      <div className="space-y-2">
        <p className="muted text-sm">Link an adviser before sharing a briefing pack.</p>
        <Link href="/app/adviser-request" className="btn btn-soft inline-flex">
          Request an adviser
        </Link>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/adviser/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packType,
          noteFromCustomer: note.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        adviserName?: string;
        title?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Share failed.");
        return;
      }
      setSuccess(`Shared with ${data.adviserName}: ${data.title}`);
      setNote("");
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="text-sm">
        Share a calm briefing with <span className="font-semibold">{adviserName}</span>. Nothing is
        executed.
      </p>
      <div className="flex flex-wrap gap-2">
        {packs.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`btn text-sm ${packType === p.id ? "btn-soft" : "btn-ghost"}`}
            onClick={() => setPackType(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <Field id="share-note" label="Optional note" hint="Max 500 characters.">
        <TextInput
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          placeholder="What should your adviser focus on?"
        />
      </Field>
      <Button type="submit" disabled={loading}>
        {loading ? "Sharing…" : "Share with adviser"}
      </Button>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {success ? <p className="text-sm text-accent">{success}</p> : null}
    </form>
  );
}
