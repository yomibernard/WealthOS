"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  InsightPanel,
  PageHeader,
  Panel,
  TextInput,
} from "@/components/ui";

type AuditRow = {
  id: string;
  eventType: string;
  category: string;
  entityType: string | null;
  entityId: string | null;
  userId: string | null;
  createdAt: string;
  payload: unknown;
};

const CATEGORIES = [
  "all",
  "auth",
  "privacy",
  "escalation",
  "consent",
  "ai",
  "wealth",
  "adviser",
  "care",
  "cadence",
  "execution",
  "admin",
  "other",
] as const;

function payloadPreview(payload: unknown): string {
  if (payload == null) return "No payload";
  if (typeof payload === "string") return payload.slice(0, 160);
  if (typeof payload === "object") {
    const o = payload as Record<string, unknown>;
    const bits = Object.entries(o)
      .slice(0, 4)
      .map(([k, v]) => `${k}: ${typeof v === "string" ? v.slice(0, 40) : String(v)}`);
    return bits.join(" · ") || "Structured payload";
  }
  return String(payload);
}

export default function AdminAuditPage() {
  const [events, setEvents] = useState<AuditRow[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("all");
  const [eventType, setEventType] = useState("");
  const [q, setQ] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("category", category);
    params.set("take", "100");
    if (eventType) params.set("eventType", eventType);
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/admin/audit?${params.toString()}`);
    if (!res.ok) {
      setMessage("Could not load audit events.");
      return;
    }
    const data = await res.json();
    setEvents(data.events ?? []);
    setEventTypes(data.eventTypes ?? []);
    setMessage(null);
  }, [category, eventType, q]);

  useEffect(() => {
    void load();
  }, [load]);

  function onFilter(e: FormEvent) {
    e.preventDefault();
    void load();
  }

  function downloadHref() {
    const params = new URLSearchParams();
    params.set("category", category);
    params.set("take", "500");
    params.set("download", "1");
    if (eventType) params.set("eventType", eventType);
    if (q.trim()) params.set("q", q.trim());
    return `/api/admin/audit?${params.toString()}`;
  }

  return (
    <main className="page-wide">
      <PageHeader
        title="Audit timeline"
        subtitle="Readable events first. JSON download stays secondary for pilot compliance packs."
      />

      <InsightPanel eyebrow="How to read this">
        Filter by category (care, consent, AI, execution…). Expand a row only when you need raw
        payload detail.
      </InsightPanel>

      <Panel className="mb-4 mt-4">
        <form className="grid gap-3 md:grid-cols-4" onSubmit={onFilter}>
          <Field label="Category" id="category">
            <select
              id="category"
              className="min-h-12 w-full rounded-xl border border-line bg-white px-3"
              value={category}
              onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Event type" id="eventType">
            <select
              id="eventType"
              className="min-h-12 w-full rounded-xl border border-line bg-white px-3"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            >
              <option value="">All types</option>
              {eventTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Search" id="q">
            <TextInput
              id="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="entity id, user, payload…"
            />
          </Field>
          <div className="flex flex-wrap items-end gap-2">
            <Button type="submit" variant="soft">
              Apply
            </Button>
            <a href={downloadHref()} className="btn btn-ghost">
              Download JSON
            </a>
          </div>
        </form>
        {message ? <p className="mt-2 text-sm">{message}</p> : null}
        <p className="muted mt-2 text-xs">
          Showing {events.length} event(s). Exports redact password/secret/token fields and log
          AUDIT_EXPORT_DOWNLOADED.
        </p>
      </Panel>

      <div className="space-y-2">
        {events.length === 0 ? (
          <EmptyState title="No events" body="No events match this filter." />
        ) : (
          events.map((e) => {
            const open = Boolean(expanded[e.id]);
            return (
              <Panel key={e.id} className="py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <Badge>{e.category}</Badge>
                      <Badge tone="default">{e.eventType}</Badge>
                    </div>
                    <p className="mt-2 text-sm font-semibold">
                      {new Date(e.createdAt).toLocaleString("en-GB")}
                      {e.userId ? ` · user ${e.userId.slice(0, 8)}` : ""}
                      {e.entityType ? ` · ${e.entityType}` : ""}
                      {e.entityId ? ` ${e.entityId.slice(0, 8)}` : ""}
                    </p>
                    <p className="muted mt-1 text-sm">{payloadPreview(e.payload)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-sm"
                    onClick={() => setExpanded((s) => ({ ...s, [e.id]: !open }))}
                  >
                    {open ? "Hide JSON" : "Show JSON"}
                  </Button>
                </div>
                {open ? (
                  <pre className="muted mt-2 overflow-auto rounded-xl bg-white p-3 text-xs">
                    {JSON.stringify(e.payload, null, 2)}
                  </pre>
                ) : null}
              </Panel>
            );
          })
        )}
      </div>
    </main>
  );
}
