"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge, Button, Field, PageHeader, Panel, TextInput } from "@/components/ui";
import { formatPercent } from "@/lib/format";

type EstateItem = {
  id: string;
  kind: string;
  label: string;
  status: string;
  notes: string | null;
};

type Intel = {
  score: number;
  grade: string;
  narrative: string;
  signals: string[];
  checklist: string[];
  missingKinds: string[];
  engineVersion: string;
  disclaimer: string;
};

const KINDS = [
  "will",
  "power_of_attorney",
  "beneficiaries",
  "letter_of_wishes",
  "succession",
  "other",
];

export default function EstatePage() {
  const [items, setItems] = useState<EstateItem[]>([]);
  const [intel, setIntel] = useState<Intel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState("will");
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState("draft");
  const [notes, setNotes] = useState("");

  async function load() {
    const res = await fetch("/api/estate");
    if (res.status === 503) {
      setError("Estate lite is currently disabled.");
      return;
    }
    if (!res.ok) {
      setError("Could not load estate inventory.");
      return;
    }
    const data = await res.json();
    setItems(data.items);
    setIntel(data.intel);
    setError(null);
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/estate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, label, status, notes }),
    });
    setLabel("");
    setNotes("");
    await load();
  }

  async function updateStatus(id: string, next: string) {
    await fetch(`/api/estate/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    await load();
  }

  return (
    <main>
      <PageHeader
        title="Estate & will lite"
        subtitle="Inventory of wills, beneficiaries and succession notes — not legal drafting."
      />

      {error ? (
        <p className="mb-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {intel ? (
        <>
          <Panel>
            <div className="flex flex-wrap gap-2">
              <Badge>{intel.engineVersion}</Badge>
              <Badge tone={intel.grade === "thin" ? "danger" : intel.grade === "emerging" ? "warn" : "default"}>
                {intel.grade}
              </Badge>
            </div>
            <p className="font-display mt-3 text-4xl">{formatPercent(intel.score, 0)}</p>
            <p className="muted text-sm">Readiness score (illustrative)</p>
            <p className="mt-4 leading-relaxed">{intel.narrative}</p>
            <p className="muted mt-3 text-xs">{intel.disclaimer}</p>
          </Panel>

          {intel.signals.length ? (
            <Panel className="mt-3">
              <p className="eyebrow">Signals</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {intel.signals.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <Panel className="mt-3">
            <p className="eyebrow">Suggested checklist</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {intel.checklist.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Panel>
        </>
      ) : null}

      <Panel className="mt-4">
        <p className="eyebrow">Add estate record</p>
        <form className="mt-3 space-y-3" onSubmit={onSubmit}>
          <Field label="Kind" id="kind">
            <select
              id="kind"
              className="min-h-12 w-full rounded-xl border border-line bg-white px-3"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k.replaceAll("_", " ")}
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
              placeholder="e.g. Will with family solicitor"
            />
          </Field>
          <Field label="Status" id="status">
            <select
              id="status"
              className="min-h-12 w-full rounded-xl border border-line bg-white px-3"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {["missing", "draft", "documented", "reviewed"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notes" id="notes" hint="Location of originals, solicitor name — not legal text.">
            <TextInput id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <Button type="submit" className="w-full">
            Save record
          </Button>
        </form>
      </Panel>

      <section className="mt-5" aria-labelledby="estate-items">
        <h2 id="estate-items" className="font-display text-xl">
          Records
        </h2>
        <div className="mt-3 space-y-3">
          {items.length === 0 ? (
            <Panel>
              <p className="muted text-sm">No estate records yet.</p>
            </Panel>
          ) : (
            items.map((item) => (
              <Panel key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.label}</p>
                    <p className="muted text-sm">
                      {item.kind.replaceAll("_", " ")} · {item.status}
                    </p>
                    {item.notes ? <p className="muted mt-2 text-sm">{item.notes}</p> : null}
                  </div>
                  <Badge
                    tone={
                      item.status === "missing"
                        ? "danger"
                        : item.status === "draft"
                          ? "warn"
                          : "default"
                    }
                  >
                    {item.status}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.status !== "documented" ? (
                    <Button
                      type="button"
                      variant="soft"
                      onClick={() => void updateStatus(item.id, "documented")}
                    >
                      Mark documented
                    </Button>
                  ) : null}
                  {item.status !== "reviewed" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => void updateStatus(item.id, "reviewed")}
                    >
                      Mark reviewed
                    </Button>
                  ) : null}
                </div>
              </Panel>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
