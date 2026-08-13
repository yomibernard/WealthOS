"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button, Field, TextInput } from "@/components/ui";

export function RemediationActions({
  id,
  kind,
  currentValue,
}: {
  id: string;
  kind: "asset" | "liability";
  currentValue: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(currentValue));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function post(body: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/wealth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Update failed.");
        return;
      }
      setMessage("Saved — confidence will refresh on Home.");
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onConfirm() {
    await post({ kind, id, mode: "confirm" });
  }

  async function onUpdate(e: FormEvent) {
    e.preventDefault();
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      setError("Enter a positive amount.");
      return;
    }
    await post({ kind, id, mode: "update", value: n, verificationStatus: "ESTIMATED" });
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="soft" disabled={loading} onClick={onConfirm}>
          Confirm today’s estimate
        </Button>
        <Button type="button" variant="ghost" disabled={loading} onClick={() => setOpen((v) => !v)}>
          {open ? "Cancel update" : "Enter new value"}
        </Button>
      </div>
      {open ? (
        <form onSubmit={onUpdate} className="space-y-3 rounded-xl border border-line p-3">
          <Field id={`val-${id}`} label="Updated amount" hint="Same currency as the holding.">
            <TextInput
              type="number"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </Field>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save updated value"}
          </Button>
        </form>
      ) : null}
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {message ? <p className="text-sm text-accent">{message}</p> : null}
    </div>
  );
}
