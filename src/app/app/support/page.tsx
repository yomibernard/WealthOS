"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Field, PageHeader, Panel, TextInput } from "@/components/ui";

type CaseRow = {
  id: string;
  level: string;
  reason: string;
  status: string;
  createdAt: string;
  resolution: string | null;
};

type CareUpdate = {
  id: string;
  title: string;
  preview: string;
  adviserName: string;
  createdAt: string;
  href: string;
};

export default function SupportPage() {
  const [category, setCategory] = useState<"support" | "complaint">("support");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [careUpdates, setCareUpdates] = useState<CareUpdate[]>([]);

  async function load() {
    const [casesRes, careRes] = await Promise.all([
      fetch("/api/escalations"),
      fetch("/api/care-updates"),
    ]);
    if (casesRes.ok) setCases(await casesRes.json());
    if (careRes.ok) {
      const data = (await careRes.json()) as { items?: CareUpdate[] };
      setCareUpdates(
        (data.items ?? []).filter(
          (i) => i.href === "/app/support" || !/privacy/i.test(i.title),
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
    const res = await fetch("/api/escalations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason,
        category,
        level: "L2_SUPPORT",
      }),
    });
    if (!res.ok) {
      setMessage("We could not submit that right now. Please try again.");
      return;
    }
    setReason("");
    setMessage(
      category === "complaint"
        ? "Complaint logged. Operations will review under our complaints process."
        : "Support request received. A specialist can pick this up from the queue.",
    );
    await load();
  }

  return (
    <main>
      <PageHeader
        title="Support & complaints"
        subtitle="Human help when AI confidence is low, something went wrong, or you want a person on the case."
      />

      {careUpdates.length ? (
        <Panel className="mb-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">Recent care updates</p>
            <Badge>{careUpdates.length}</Badge>
          </div>
          <p className="muted text-sm">
            Your adviser sent these acknowledgments. Formal ops resolution still applies when needed.
          </p>
          <ul className="space-y-2">
            {careUpdates.map((u) => (
              <li key={u.id} className="rounded-xl border border-line px-3 py-2">
                <p className="font-semibold text-sm">{u.title}</p>
                <p className="mt-1 text-sm">{u.preview}</p>
                <p className="muted mt-1 text-xs">
                  {u.adviserName} · {new Date(u.createdAt).toLocaleString("en-GB")}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel className="space-y-3">
        <p className="font-semibold">Escalation ladder</p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>L0 Self-service — Privacy Centre, digests, confidence fixes</li>
          <li>L1 WealthAI — in-product guidance with deterministic tools</li>
          <li>L2 Support specialist — this page</li>
          <li>L3 Regulated financial adviser</li>
          <li>L4 Specialist professional</li>
          <li>L5 Private wealth adviser</li>
        </ul>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/app/adviser-request" className="btn btn-soft flex-1 text-center">
            Escalate to an adviser (L3)
          </Link>
          <Link href="/app/privacy" className="btn btn-soft flex-1 text-center">
            Privacy & data export
          </Link>
        </div>
      </Panel>

      <Panel className="mt-3">
        <p className="font-semibold">Open a case</p>
        <p className="muted mt-1 text-sm">
          Complaints are labelled for the ops queue. Support covers product help that is not a formal
          complaint.
        </p>
        <form className="mt-3 space-y-3" onSubmit={onSubmit}>
          <Field label="Type" id="category">
            <select
              id="category"
              className="min-h-12 w-full rounded-xl border border-line bg-white px-3"
              value={category}
              onChange={(e) => setCategory(e.target.value as "support" | "complaint")}
            >
              <option value="support">Support request</option>
              <option value="complaint">Formal complaint</option>
            </select>
          </Field>
          <Field label="What happened?" id="reason">
            <TextInput
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Short description — we attach your Wealth Graph summary"
              required
            />
          </Field>
          <Button type="submit" variant="accent" className="w-full">
            Submit to L2 support
          </Button>
        </form>
        {message ? <p className="mt-2 text-sm">{message}</p> : null}
      </Panel>

      <div className="mt-4 space-y-3">
        <p className="eyebrow">Your cases</p>
        {cases.length === 0 ? (
          <Panel>
            <p className="muted text-sm">No open or recent cases yet.</p>
          </Panel>
        ) : (
          cases.map((c) => (
            <Panel key={c.id}>
              <div className="flex flex-wrap gap-2">
                <Badge>{c.level}</Badge>
                <Badge tone={c.status === "open" ? "warn" : "default"}>{c.status}</Badge>
                {c.reason.startsWith("COMPLAINT:") ? <Badge tone="warn">Complaint</Badge> : null}
              </div>
              <p className="mt-2 text-sm font-medium">{c.reason}</p>
              {c.resolution ? (
                <p className="mt-1 text-sm">
                  <span className="font-medium">Update:</span> {c.resolution}
                </p>
              ) : null}
              <p className="muted mt-1 text-xs">
                {new Date(c.createdAt).toLocaleString("en-GB")} · {c.id.slice(0, 8)}
              </p>
            </Panel>
          ))
        )}
      </div>
    </main>
  );
}
