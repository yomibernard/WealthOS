"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Button, Field, PageHeader, Panel, TextInput } from "@/components/ui";

type LifeEvent = {
  id: string;
  type: string;
  label: string;
  date: string;
  notes: string | null;
};

const TYPES = [
  "job_change",
  "job_loss",
  "new_dependant",
  "marriage",
  "property_purchase",
  "relocation",
  "inheritance",
  "business_event",
  "other",
];

export default function LifeEventsPage() {
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [type, setType] = useState("job_change");
  const [label, setLabel] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [automationNote, setAutomationNote] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/life-events");
    if (res.ok) setEvents(await res.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/life-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, label, date, notes }),
    });
    const data = await res.json();
    if (res.ok && data.automation) {
      setAutomationNote(
        `${data.automation.narrative} Checklist: ${data.automation.checklist.slice(0, 3).join("; ")}.`,
      );
    }
    setLabel("");
    setNotes("");
    await load();
  }

  return (
    <main>
      <PageHeader
        title="Life events"
        subtitle="Material changes trigger planning checklists and Wealth Inbox follow-ups — never auto-execution."
        action={
          <Link href="/app/inbox" className="btn btn-soft">
            Inbox
          </Link>
        }
      />
      {automationNote ? (
        <p className="mb-3 rounded-xl bg-accent-soft px-3 py-2 text-sm" role="status">
          {automationNote}{" "}
          <Link href="/app/inbox" className="font-semibold text-accent">
            Open inbox
          </Link>
        </p>
      ) : null}
      <Panel>
        <form className="space-y-3" onSubmit={onSubmit}>
          <Field label="Event type" id="type">
            <select
              id="type"
              className="min-h-12 rounded-xl border border-line bg-white px-3"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Label" id="label">
            <TextInput
              id="label"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Promoted to MD"
            />
          </Field>
          <Field label="Date" id="date">
            <TextInput
              id="date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="Notes" id="notes">
            <TextInput id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <Button type="submit" variant="accent" className="w-full">
            Save life event
          </Button>
        </form>
      </Panel>
      <div className="mt-3 space-y-3">
        {events.map((ev) => (
          <Panel key={ev.id}>
            <p className="font-semibold">{ev.label}</p>
            <p className="muted text-sm">
              {ev.type.replaceAll("_", " ")} ·{" "}
              {new Date(ev.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
            {ev.notes ? <p className="mt-2 text-sm">{ev.notes}</p> : null}
          </Panel>
        ))}
      </div>
    </main>
  );
}
