"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { OpsCareRemindButton } from "@/components/OpsCareRemindButton";
import { shouldOfferOpsCareRemind } from "@/engines/ops-care-remind";
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
  careAck?: {
    hasCareAck: boolean;
    lastCareAckAt: string | null;
    label: string;
    tone: "ok" | "warn";
  };
};

type StatusFilter =
  | "all"
  | "open"
  | "in_progress"
  | "resolved"
  | "rejected"
  | "complaint"
  | "awaiting_adviser";

const STATUS_CHIPS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "New / open" },
  { id: "in_progress", label: "In progress" },
  { id: "awaiting_adviser", label: "Awaiting adviser" },
  { id: "complaint", label: "Complaint" },
  { id: "resolved", label: "Resolved" },
  { id: "rejected", label: "Closed" },
];

function ageLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "1d";
  return `${days}d`;
}

function severityTone(row: CaseRow): "danger" | "warn" | "default" {
  if (row.category === "complaint") return "danger";
  if (row.status === "open" || row.status === "in_progress") return "warn";
  return "default";
}

export default function AdminEscalationsPage() {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [resolution, setResolution] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");

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

  const visible = useMemo(() => {
    return cases.filter((e) => {
      if (filter === "all") return true;
      if (filter === "complaint") return e.category === "complaint";
      if (filter === "awaiting_adviser")
        return (
          (e.status === "open" || e.status === "in_progress") &&
          e.careAck?.tone === "warn"
        );
      return e.status === filter;
    });
  }, [cases, filter]);

  return (
    <main className="page-wide">
      <PageHeader
        title="Escalations & complaints"
        subtitle="Queue states first. Check care-ack before resolving — customers get an in-product notification."
        action={
          <Link href="/admin/ops" className="btn btn-soft">
            Ops board
          </Link>
        }
      />

      <InsightPanel eyebrow="Queue rule">
        Resolving a case is an ops decision. Care ack / remind never auto-closes this queue.
      </InsightPanel>

      {message ? <p className="mb-3 mt-3 text-sm">{message}</p> : null}

      <div className="mb-4 mt-4 flex flex-wrap gap-2" aria-label="Escalation status filters">
        {STATUS_CHIPS.map((chip) => {
          const active = filter === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilter(chip.id)}
              className={
                active
                  ? "rounded-full border border-accent bg-accent-soft px-3 py-1.5 text-sm font-semibold"
                  : "muted rounded-full border border-line px-3 py-1.5 text-sm hover:border-accent"
              }
              aria-pressed={active}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {cases.length === 0 ? (
          <EmptyState title="Queue clear" body="No escalations in the queue." />
        ) : null}
        {cases.length > 0 && visible.length === 0 ? (
          <Panel>
            <p className="muted text-sm">No cases match this filter.</p>
          </Panel>
        ) : null}
        {visible.map((e) => (
          <Panel key={e.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <Badge tone={severityTone(e)}>
                    {e.category === "complaint" ? "Complaint" : "Support"}
                  </Badge>
                  <Badge>{e.status}</Badge>
                  <Badge>{e.level}</Badge>
                  {e.careAck ? (
                    <Badge tone={e.careAck.tone === "warn" ? "warn" : "default"}>
                      {e.careAck.label}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-2 font-semibold">
                  {e.customer.name} — {e.reason}
                </p>
                <p className="muted mt-1 text-sm">
                  Age {ageLabel(e.createdAt)} · {e.customer.email} ·{" "}
                  {new Date(e.createdAt).toLocaleString("en-GB")} · {e.id.slice(0, 8)}
                  {e.careAck?.lastCareAckAt
                    ? ` · last care ack ${new Date(e.careAck.lastCareAckAt).toLocaleString("en-GB")}`
                    : ""}
                </p>
                <p className="muted mt-1 text-sm">
                  Last action: {e.resolution ? "Resolution on file" : "Awaiting ops update"}
                </p>
              </div>
              <Link
                href={`/adviser/customers/${e.customer.id}?tab=care`}
                className="btn btn-ghost text-sm"
              >
                Care desk
              </Link>
            </div>
            {shouldOfferOpsCareRemind({
              status: e.status,
              hasCareAck: e.careAck?.hasCareAck,
            }) ? (
              <div className="mt-2">
                <OpsCareRemindButton customerId={e.customer.id} />
              </div>
            ) : null}
            <p className="muted mt-2 text-sm">{e.summaryPreview}</p>
            {e.resolution ? (
              <p className="mt-2 text-sm">
                <span className="font-medium">Resolution:</span> {e.resolution}
              </p>
            ) : null}
            {e.status === "open" || e.status === "in_progress" ? (
              <div className="mt-3 space-y-2 border-t border-line pt-3">
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
        ))}
      </div>
    </main>
  );
}
