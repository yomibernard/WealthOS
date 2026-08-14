"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function OpsCareRemindButton({
  unackedCount,
  customerId,
}: {
  /** Bulk Care handoff remind on /admin/ops. */
  unackedCount?: number;
  /** Per-customer remind from escalations / privacy queues. */
  customerId?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const perCustomer = Boolean(customerId);
  if (!perCustomer && (unackedCount ?? 0) <= 0) return null;

  async function onRemind() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/care-remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerId ? { customerId } : {}),
      });
      const data = (await res.json()) as {
        error?: string;
        reminded?: number;
        skipped?: number;
        note?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not send reminders.");
        return;
      }
      if (perCustomer) {
        setMessage(
          (data.reminded ?? 0) > 0
            ? "Adviser reminded. Queues stay open."
            : `No new reminder sent${data.skipped ? ` (skipped ${data.skipped})` : ""}. Queues stay open.`,
        );
      } else {
        setMessage(
          `Reminded ${data.reminded ?? 0} adviser(s)` +
            (data.skipped ? ` · skipped ${data.skipped}` : "") +
            ". Queues stay open.",
        );
      }
    } catch {
      setError("Could not send reminders.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={perCustomer ? "space-y-1" : "mt-3 space-y-2"}>
      <Button type="button" variant="soft" disabled={loading} onClick={() => void onRemind()}>
        {loading
          ? "Sending…"
          : perCustomer
            ? "Remind adviser"
            : `Remind linked advisers (${unackedCount} unacked)`}
      </Button>
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
