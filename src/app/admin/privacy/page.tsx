"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Field, PageHeader, Panel, TextInput } from "@/components/ui";

type Row = {
  id: string;
  userId: string;
  type: string;
  status: string;
  details: string | null;
  createdAt: string;
};

export default function AdminPrivacyPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [resolution, setResolution] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/privacy");
    if (res.ok) {
      const data = await res.json();
      setRows(data.requests ?? []);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function update(id: string, status: "in_progress" | "completed" | "rejected") {
    setMessage(null);
    const res = await fetch("/api/admin/privacy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        status,
        resolution: resolution[id] || "Reviewed under retention policy.",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Update failed.");
      return;
    }
    setMessage(`Request marked ${status}.`);
    await load();
  }

  return (
    <main className="page-wide">
      <PageHeader
        title="Privacy requests"
        subtitle="Access, rectification, objection and erasure queue. Erasure still respects lawful retention."
      />
      {message ? <p className="mb-3 text-sm">{message}</p> : null}
      <div className="space-y-3">
        {rows.map((r) => (
          <Panel key={r.id}>
            <div className="flex flex-wrap gap-2">
              <Badge>{r.type}</Badge>
              <Badge tone={r.status === "open" ? "warn" : "default"}>{r.status}</Badge>
            </div>
            <p className="mt-2 text-sm">
              User {r.userId.slice(0, 10)}… · {new Date(r.createdAt).toLocaleString("en-GB")}
            </p>
            {r.details ? <p className="mt-1 text-sm">{r.details}</p> : null}
            {r.status === "open" || r.status === "in_progress" ? (
              <div className="mt-3 space-y-2">
                <Field label="Resolution note" id={`res-${r.id}`}>
                  <TextInput
                    id={`res-${r.id}`}
                    value={resolution[r.id] ?? ""}
                    onChange={(e) => setResolution((s) => ({ ...s, [r.id]: e.target.value }))}
                  />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="soft" onClick={() => void update(r.id, "in_progress")}>
                    In progress
                  </Button>
                  <Button type="button" variant="accent" onClick={() => void update(r.id, "completed")}>
                    {r.type === "erasure" ? "Complete + erase" : "Complete"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => void update(r.id, "rejected")}>
                    Reject
                  </Button>
                </div>
              </div>
            ) : null}
          </Panel>
        ))}
      </div>
    </main>
  );
}
