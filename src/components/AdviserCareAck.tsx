"use client";

import { FormEvent, useState } from "react";
import { Button, Field, Panel, TextInput } from "@/components/ui";
import type { CareDeskItem } from "@/engines/adviser-care";

export function AdviserCareAck({
  customerId,
  items,
}: {
  customerId: string;
  items: CareDeskItem[];
}) {
  const [itemKey, setItemKey] = useState(
    items[0] ? `${items[0].kind}:${items[0].id}` : "",
  );
  const [message, setMessage] = useState(
    "I've seen this and I'm with you — ops will keep working the formal queue.",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  if (!items.length) return null;

  const selected = items.find((i) => `${i.kind}:${i.id}` === itemKey) ?? items[0];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/api/adviser/care-ack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          kind: selected.kind,
          itemId: selected.id,
          itemTitle: selected.title,
          message: message.trim(),
        }),
      });
      const data = (await res.json()) as { error?: string; title?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not send.");
        return;
      }
      setMsg(`Sent: ${data.title}`);
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel className="mt-3 space-y-3">
      <p className="eyebrow">Acknowledge care item</p>
      <p className="muted text-sm">
        Reassure the customer in Inbox and notifications. Does not close the admin queue.
      </p>
      <form className="space-y-3" onSubmit={onSubmit}>
        <Field label="Care item" id="care-item">
          <select
            id="care-item"
            className="min-h-12 w-full rounded-xl border border-line bg-white px-3"
            value={`${selected.kind}:${selected.id}`}
            onChange={(e) => setItemKey(e.target.value)}
          >
            {items.map((i) => (
              <option key={`${i.kind}:${i.id}`} value={`${i.kind}:${i.id}`}>
                {i.kind} · {i.title}
              </option>
            ))}
          </select>
        </Field>
        <Field id="care-message" label="Message to customer">
          <TextInput
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            required
          />
        </Field>
        <Button type="submit" variant="soft" disabled={loading}>
          {loading ? "Sending…" : "Send acknowledgment"}
        </Button>
      </form>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {msg ? (
        <p className="text-sm" role="status">
          {msg}
        </p>
      ) : null}
    </Panel>
  );
}
