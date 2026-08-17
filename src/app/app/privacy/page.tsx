"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Field, InsightPanel, PageHeader, Panel, TextInput } from "@/components/ui";
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

  const openCount = requests.filter((r) => r.status === "open").length;

  return (
    <main>
      <PageHeader
        title="Privacy Centre"
        subtitle="Your data belongs to you — download, correct, object, or request deletion with clear status."
      />

      <section className="hero-metric">
        <p className="eyebrow">Control</p>
        <h2 className="font-display mt-1 text-3xl font-semibold tracking-tight">
          Your data belongs to you
        </h2>
        <p className="muted mt-2 max-w-2xl text-sm leading-relaxed">
          Retention rules still apply where legally required. Formal privacy queues are never closed
          by care acknowledgments alone.
        </p>
      </section>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Panel className="space-y-2">
          <p className="font-semibold">Download my data</p>
          <p className="muted text-sm leading-relaxed">
            Export a JSON package of your Wealth Graph, goals, consents, inbox, reports, digests,
            adviser shares, notification preferences, and privacy history. Password hashes are never
            included.
          </p>
          <a href="/api/privacy/export" className="btn btn-accent inline-flex">
            Download my data
          </a>
        </Panel>
        <Panel className="space-y-2">
          <p className="font-semibold">Correct my information</p>
          <p className="muted text-sm leading-relaxed">
            Use a rectification request below, or update profile and holdings directly where you can.
          </p>
          <Link href="/app/profile" className="btn btn-soft inline-flex">
            Open profile
          </Link>
        </Panel>
        <Panel className="space-y-2">
          <p className="font-semibold">Request deletion</p>
          <p className="muted text-sm leading-relaxed">
            Submit an erasure request. Ops reviews retention and legal holds before completion.
          </p>
          <button
            type="button"
            className="btn btn-ghost inline-flex"
            onClick={() => setType("erasure")}
          >
            Choose erasure below
          </button>
        </Panel>
        <Panel className="space-y-2">
          <p className="font-semibold">View privacy history</p>
          <p className="muted text-sm leading-relaxed">
            {openCount} open request{openCount === 1 ? "" : "s"} · {requests.length} total on file.
          </p>
          <a href="#privacy-history" className="btn btn-ghost inline-flex">
            Jump to history
          </a>
        </Panel>
      </div>

      <Panel className="mt-4 mb-3 space-y-2">
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

      <InsightPanel eyebrow="Submit a request">
        Access, rectification, objection/restrict, or erasure — status stays visible until ops
        resolves it.
      </InsightPanel>

      <Panel className="mt-3">
        <form className="space-y-3" onSubmit={onSubmit}>
          <Field label="Request type" id="type">
            <select
              id="type"
              className="min-h-12 w-full rounded-xl border border-line bg-white px-3"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="access">Access</option>
              <option value="rectification">Rectification / correct my information</option>
              <option value="objection">Objection / restrict processing</option>
              <option value="erasure">Erasure / request deletion</option>
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

      <section id="privacy-history" className="mt-5">
        <h2 className="font-display text-xl">Privacy history</h2>
        <div className="mt-3 space-y-3">
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
      </section>

      <Link href="/app/consent" className="btn btn-ghost mt-4 w-full">
        Open Consent Centre
      </Link>
    </main>
  );
}
