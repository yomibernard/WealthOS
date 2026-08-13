"use client";

import { useEffect, useState } from "react";
import { Button, Field, PageHeader, Panel, TextInput, Badge } from "@/components/ui";

type ChangeRequest = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  payloadJson: string;
  status: string;
  makerId: string;
  makerNote: string | null;
  createdAt: string;
};

export default function ChangeRequestsPage() {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/change-requests");
    if (res.ok) {
      const data = await res.json();
      setRequests(data.requests ?? []);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function decide(id: string, decision: "approve" | "reject") {
    setMessage(null);
    const res = await fetch(`/api/admin/change-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decision,
        checkerNote: notes[id] || "Reviewed",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Decision failed.");
      return;
    }
    setMessage(`Change request ${decision}d.`);
    await load();
  }

  const pending = requests.filter((r) => r.status === "pending");
  const decided = requests.filter((r) => r.status !== "pending");

  return (
    <main className="page-wide">
      <PageHeader
        title="Maker-checker queue"
        subtitle="High-risk config changes require a different admin to approve. Makers cannot self-approve."
      />
      {message ? <p className="mb-3 text-sm">{message}</p> : null}

      <h2 className="font-display text-xl">Pending</h2>
      <div className="mt-3 space-y-3">
        {pending.length ? (
          pending.map((r) => (
            <Panel key={r.id}>
              <div className="flex flex-wrap gap-2">
                <Badge tone="warn">{r.status}</Badge>
                <Badge>{r.entityType}</Badge>
              </div>
              <p className="mt-2 font-semibold">
                {r.action} → {r.entityId}
              </p>
              <p className="muted text-sm">{r.makerNote}</p>
              <pre className="mt-2 overflow-auto rounded-xl bg-surface p-3 text-xs">
                {r.payloadJson}
              </pre>
              <div className="mt-3 space-y-2">
                <Field label="Checker note" id={`note-${r.id}`}>
                  <TextInput
                    id={`note-${r.id}`}
                    value={notes[r.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                    placeholder="Why approve or reject"
                  />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="accent" onClick={() => void decide(r.id, "approve")}>
                    Approve as checker
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => void decide(r.id, "reject")}>
                    Reject
                  </Button>
                </div>
              </div>
            </Panel>
          ))
        ) : (
          <Panel>
            <p className="muted">No pending change requests.</p>
          </Panel>
        )}
      </div>

      <h2 className="font-display mt-6 text-xl">Recent decisions</h2>
      <div className="mt-3 space-y-2">
        {decided.slice(0, 10).map((r) => (
          <Panel key={r.id} className="py-3">
            <Badge tone={r.status === "approved" ? "default" : "warn"}>{r.status}</Badge>
            <p className="mt-1 text-sm">
              {r.action} · {r.entityType} · {new Date(r.createdAt).toLocaleString("en-GB")}
            </p>
          </Panel>
        ))}
      </div>
    </main>
  );
}
