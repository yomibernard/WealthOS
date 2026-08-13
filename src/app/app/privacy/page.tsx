"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge, Button, Field, PageHeader, Panel, TextInput } from "@/components/ui";
import {
  CareUpdateReceiptList,
  type CareUpdateRow,
} from "@/components/CareUpdateReceiptList";

type PrivacyReq = {
  id: string;
  type: string;
  status: string;
  details: string | null;
  createdAt: string;
  resolution: string | null;
};

export default function PrivacyPage() {
  const [requests, setRequests] = useState<PrivacyReq[]>([]);
  const [careUpdates, setCareUpdates] = useState<CareUpdateRow[]>([]);
  const [type, setType] = useState("access");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const [reqRes, careRes] = await Promise.all([
      fetch("/api/privacy/requests"),
      fetch("/api/care-updates?list=1"),
    ]);
    if (reqRes.ok) setRequests(await reqRes.json());
    if (careRes.ok) {
      const data = (await careRes.json()) as { items?: CareUpdateRow[] };
      setCareUpdates(
        (data.items ?? []).filter(
          (i) => i.href === "/app/privacy" || /privacy/i.test(i.title),
        ),
      );
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await fetch("/api/privacy/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, details }),
    });
    if (!res.ok) {
      setMessage("We could not submit that request right now.");
      return;
    }
    setDetails("");
    setMessage("Privacy request submitted.");
    await load();
  }

  return (
    <main>
      <PageHeader
        title="Privacy Centre"
        subtitle="Download your data or request access, correction, objection or erasure. Retention rules still apply where legally required."
      />

      <Panel className="mb-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold">Recent care updates</p>
          {careUpdates.length ? <Badge>{careUpdates.length}</Badge> : null}
        </div>
        <p className="muted text-sm">
          Your adviser acknowledged a privacy-related item. Mark as seen when read — ops still
          handles formal completion.
        </p>
        <CareUpdateReceiptList
          items={careUpdates}
          onChanged={load}
          emptyHint="No recent privacy care updates."
        />
      </Panel>

      <Panel className="space-y-3">
        <p className="font-semibold">Data portability</p>
        <p className="muted text-sm">
          Export a JSON package of your Wealth Graph, goals, consents, inbox, monthly reports, weekly
          digests, adviser shares/nudges, notification preferences, and privacy/escalation history.
          Password hashes are never included.
        </p>
        <a href="/api/privacy/export" className="btn btn-accent">
          Download my data
        </a>
      </Panel>

      <Panel className="mt-3">
        <p className="font-semibold">Submit a privacy request</p>
        <form className="mt-3 space-y-3" onSubmit={onSubmit}>
          <Field label="Request type" id="type">
            <select
              id="type"
              className="min-h-12 rounded-xl border border-line bg-white px-3"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="access">Access</option>
              <option value="rectification">Rectification</option>
              <option value="objection">Objection / restrict processing</option>
              <option value="erasure">Erasure</option>
            </select>
          </Field>
          <Field label="Details" id="details">
            <TextInput
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="What should we review?"
            />
          </Field>
          <Button type="submit" variant="soft">
            Submit request
          </Button>
        </form>
        {message ? <p className="mt-2 text-sm">{message}</p> : null}
      </Panel>

      <div className="mt-4 space-y-3">
        {requests.length === 0 ? (
          <Panel>
            <p className="muted text-sm">No privacy requests yet.</p>
          </Panel>
        ) : (
          requests.map((r) => (
            <Panel key={r.id}>
              <div className="flex flex-wrap gap-2">
                <Badge>{r.type}</Badge>
                <Badge tone={r.status === "open" ? "warn" : "default"}>{r.status}</Badge>
              </div>
              <p className="muted mt-2 text-sm">
                {new Date(r.createdAt).toLocaleString("en-GB")}
              </p>
              {r.details ? <p className="mt-1 text-sm">{r.details}</p> : null}
              {r.resolution ? <p className="mt-2 text-sm">{r.resolution}</p> : null}
            </Panel>
          ))
        )}
      </div>
    </main>
  );
}
