"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge, Button, Field, Panel, TextInput } from "@/components/ui";

type Note = {
  id: string;
  kind: string;
  title: string;
  body: string;
  sharedWithCustomer: boolean;
  status: string;
  createdAt: string;
  adviser?: { name: string };
};

export function AdviserNotesPanel({ customerId }: { customerId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState("note");
  const [shared, setShared] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/adviser/notes?customerId=${customerId}`);
      if (cancelled) return;
      if (res.status === 503) {
        setError("Adviser collaboration is disabled.");
        return;
      }
      if (res.ok) setNotes(await res.json());
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    const res = await fetch("/api/adviser/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId,
        kind,
        title,
        body,
        sharedWithCustomer: shared,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Save failed.");
      return;
    }
    setTitle("");
    setBody("");
    setShared(false);
    setMsg(shared ? "Note saved and shared with customer." : "Internal note saved.");
    const list = await fetch(`/api/adviser/notes?customerId=${customerId}`);
    if (list.ok) setNotes(await list.json());
  }

  return (
    <Panel className="mt-4">
      <p className="eyebrow">Collaboration notes</p>
      <p className="muted mt-1 text-sm">
        Plan actions and call summaries. Share only when the customer should see them.
      </p>
      {error ? (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {msg ? (
        <p className="mt-2 text-sm text-accent" role="status">
          {msg}
        </p>
      ) : null}

      <form className="mt-3 space-y-3" onSubmit={onSubmit}>
        <Field label="Kind" id="note-kind">
          <select
            id="note-kind"
            className="min-h-12 w-full rounded-xl border border-line bg-white px-3"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="note">Note</option>
            <option value="plan_action">Plan action</option>
            <option value="call_summary">Call summary</option>
          </select>
        </Field>
        <Field label="Title" id="note-title">
          <TextInput
            id="note-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field label="Body" id="note-body">
          <TextInput id="note-body" required value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={shared}
            onChange={(e) => setShared(e.target.checked)}
          />
          Share with customer (inbox + notification)
        </label>
        <Button type="submit" variant="soft">
          Save note
        </Button>
      </form>

      <ul className="mt-4 space-y-3">
        {notes.map((n) => (
          <li key={n.id} className="rounded-xl border border-line p-3">
            <div className="flex flex-wrap gap-2">
              <Badge>{n.kind.replaceAll("_", " ")}</Badge>
              {n.kind === "customer_share" ? (
                <Badge tone="warn">from customer</Badge>
              ) : n.kind === "adviser_nudge" ? (
                <Badge tone="warn">nudge sent</Badge>
              ) : (
                <Badge tone={n.sharedWithCustomer ? "default" : "warn"}>
                  {n.sharedWithCustomer ? "shared" : "internal"}
                </Badge>
              )}
            </div>
            <p className="mt-2 font-semibold">{n.title}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{n.body}</p>
            <p className="muted mt-1 text-xs">
              {new Date(n.createdAt).toLocaleString("en-GB")}
            </p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
