"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Field, PageHeader, Panel, TextInput } from "@/components/ui";

type CaseRow = {
  id: string;
  level: string;
  reason: string;
  status: string;
  category: string;
  resolution: string | null;
  summaryPreview: string;
  createdAt: string;
  customer: { id: string; name: string; email: string };
};

export default function AdminEscalationsPage() {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [resolution, setResolution] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/escalations");
    if (res.ok) {
      const data = await res.json();
      setCases(data.cases ?? []);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function update(id: string, status: "in_progress" | "resolved" | "rejected") {
    setMessage(null);
    const res = await fetch("/api/admin/escalations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        status,
        resolution: resolution[id] || "Reviewed by operations.",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Update failed.");
      return;
    }
    setMessage(`Case marked ${status}.`);
    await load();
  }

  return (
    <main className="page-wide">
      <PageHeader
        title="Escalations & complaints"
        subtitle="L2 support and formal complaints. Resolve with a note — customers get an in-product notification."
      />
      {message ? <p className="mb-3 text-sm">{message}</p> : null}
      <div className="space-y-3">
        {cases.length === 0 ? (
          <Panel>
            <p className="muted text-sm">No escalations in the queue.</p>
          </Panel>
        ) : (
          cases.map((e) => (
            <Panel key={e.id}>
              <div className="flex flex-wrap gap-2">
                <Badge>{e.level}</Badge>
                <Badge tone={e.status === "open" || e.status === "in_progress" ? "warn" : "default"}>
                  {e.status}
                </Badge>
                {e.category === "complaint" ? <Badge tone="warn">Complaint</Badge> : null}
                {e.category === "support" ? <Badge>Support</Badge> : null}
              </div>
              <p className="mt-2 font-semibold">
                {e.customer.name} — {e.reason}
              </p>
              <p className="muted mt-1 text-sm">
                {e.customer.email} · {new Date(e.createdAt).toLocaleString("en-GB")} ·{" "}
                {e.id.slice(0, 8)}
              </p>
              <p className="muted mt-1 text-sm">{e.summaryPreview}</p>
              {e.resolution ? (
                <p className="mt-2 text-sm">
                  <span className="font-medium">Resolution:</span> {e.resolution}
                </p>
              ) : null}
              {e.status === "open" || e.status === "in_progress" ? (
                <div className="mt-3 space-y-2">
                  <Field label="Resolution note" id={`res-${e.id}`}>
                    <TextInput
                      id={`res-${e.id}`}
                      value={resolution[e.id] ?? ""}
                      onChange={(ev) =>
                        setResolution((s) => ({ ...s, [e.id]: ev.target.value }))
                      }
                      placeholder="What did ops conclude or ask the customer to do?"
                    />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="soft"
                      onClick={() => void update(e.id, "in_progress")}
                    >
                      In progress
                    </Button>
                    <Button
                      type="button"
                      variant="accent"
                      onClick={() => void update(e.id, "resolved")}
                    >
                      Resolve
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => void update(e.id, "rejected")}
                    >
                      Reject / close
                    </Button>
                  </div>
                </div>
              ) : null}
            </Panel>
          ))
        )}
      </div>
    </main>
  );
}
