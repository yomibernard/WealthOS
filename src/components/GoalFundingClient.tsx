"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button, Field, TextInput } from "@/components/ui";

export function GoalFundingControls({
  goalId,
  currentMonthly,
  suggestedMonthly,
  currency,
}: {
  goalId: string;
  currentMonthly: number;
  suggestedMonthly: number;
  currency: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(Math.round(currentMonthly)));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function post(body: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/goals/${goalId}/funding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string; monthlyContribution?: number };
      if (!res.ok) {
        setError(data.error ?? "Update failed.");
        return;
      }
      setMessage(
        `Saved · ${currency} ${Math.round(data.monthlyContribution ?? 0).toLocaleString("en-NG")}/mo`,
      );
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onApplySuggested() {
    await post({ monthlyContribution: suggestedMonthly, applySuggested: true });
  }

  async function onCustom(e: FormEvent) {
    e.preventDefault();
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
      setError("Enter a valid monthly amount.");
      return;
    }
    await post({ monthlyContribution: n });
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="soft" disabled={loading} onClick={onApplySuggested}>
          Apply suggested monthly
        </Button>
        <Button type="button" variant="ghost" disabled={loading} onClick={() => setOpen((v) => !v)}>
          {open ? "Cancel" : "Set custom monthly"}
        </Button>
      </div>
      {open ? (
        <form onSubmit={onCustom} className="space-y-3 rounded-xl border border-line p-3">
          <Field id={`fund-${goalId}`} label="Monthly contribution" hint={`Currency: ${currency}`}>
            <TextInput
              type="number"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </Field>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save funding"}
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
