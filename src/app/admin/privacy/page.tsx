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

type Row = {
  id: string;
  userId: string;
  type: string;
  status: string;
  details: string | null;
  createdAt: string;
  customer?: { id: string; name: string; email: string };
  careAck?: {
    hasCareAck: boolean;
    lastCareAckAt: string | null;
    label: string;
    tone: "ok" | "warn";
  };
};

type FilterId =
  | "all"
  | "open"
  | "in_progress"
  | "completed"
  | "rejected"
  | "export"
  | "erasure"
  | "correction"
  | "access"
  | "awaiting_adviser";

const FILTER_CHIPS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Requested" },
  { id: "in_progress", label: "In progress" },
  { id: "awaiting_adviser", label: "Awaiting adviser" },
  { id: "export", label: "Export" },
  { id: "access", label: "Access" },
  { id: "correction", label: "Correction" },
  { id: "erasure", label: "Erasure" },
  { id: "completed", label: "Completed" },
  { id: "rejected", label: "Rejected" },
];

function ageLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "1d";
  return `${days}d`;
}

export default function AdminPrivacyPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [resolution, setResolution] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterId>("all");

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

  const visible = useMemo(() => {
    return rows.filter((r) => {
      if (filter === "all") return true;
      if (filter === "awaiting_adviser")
        return (
          (r.status === "open" || r.status === "in_progress") && r.careAck?.tone === "warn"
        );
      if (
        filter === "export" ||
        filter === "erasure" ||
        filter === "correction" ||
        filter === "access"
      ) {
        return r.type.toLowerCase().includes(filter);
      }
      return r.status === filter;
    });
  }, [rows, filter]);

  return (
    <main className="page-wide">
      <PageHeader
        title="Privacy requests"
        subtitle="Track type and status with audit-ready notes. Check care-ack — erasure still respects lawful retention."
        action={
          <Link href="/admin/audit?category=privacy" className="btn btn-ghost">
            Privacy audit
          </Link>
        }
      />

      <InsightPanel eyebrow="Strong audit">
        Completing or rejecting a request writes ops notes. Care reminders never close this queue.
      </InsightPanel>

      {message ? <p className="mb-3 mt-3 text-sm">{message}</p> : null}

      <div className="mb-4 mt-4 flex flex-wrap gap-2" aria-label="Privacy filters">
        {FILTER_CHIPS.map((chip) => {
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
        {rows.length === 0 ? (
          <EmptyState title="Queue clear" body="No privacy requests in the queue." />
        ) : null}
        {rows.length > 0 && visible.length === 0 ? (
          <Panel>
            <p className="muted text-sm">No requests match this filter.</p>
          </Panel>
        ) : null}
        {visible.map((r) => (
          <Panel key={r.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <Badge>{r.type}</Badge>
                  <Badge
                    tone={r.status === "open" || r.status === "in_progress" ? "warn" : "default"}
                  >
                    {r.status === "open" ? "requested" : r.status}
                  </Badge>
                  {r.careAck ? (
                    <Badge tone={r.careAck.tone === "warn" ? "warn" : "default"}>
                      {r.careAck.label}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-2 font-semibold">
                  {r.customer?.name ?? `User ${r.userId.slice(0, 10)}…`}
                  {r.customer?.email ? ` — ${r.customer.email}` : ""}
                </p>
                <p className="muted mt-1 text-sm">
                  Age {ageLabel(r.createdAt)} · {new Date(r.createdAt).toLocaleString("en-GB")}
                  {r.careAck?.lastCareAckAt
                    ? ` · last care ack ${new Date(r.careAck.lastCareAckAt).toLocaleString("en-GB")}`
                    : ""}
                </p>
                {r.details ? <p className="mt-1 text-sm">{r.details}</p> : null}
                {r.status === "rejected" && resolution[r.id] ? (
                  <p className="mt-1 text-sm">
                    <span className="font-medium">Rejected reason:</span> {resolution[r.id]}
                  </p>
                ) : null}
              </div>
              <Link
                href={`/adviser/customers/${r.userId}?tab=care`}
                className="btn btn-ghost text-sm"
              >
                Care desk
              </Link>
            </div>
            {shouldOfferOpsCareRemind({
              status: r.status,
              hasCareAck: r.careAck?.hasCareAck,
            }) ? (
              <div className="mt-2">
                <OpsCareRemindButton customerId={r.userId} />
              </div>
            ) : null}
            {r.status === "open" || r.status === "in_progress" ? (
              <div className="mt-3 space-y-2 border-t border-line pt-3">
                <Field label="Resolution note" id={`res-${r.id}`}>
                  <TextInput
                    id={`res-${r.id}`}
                    value={resolution[r.id] ?? ""}
                    onChange={(e) => setResolution((s) => ({ ...s, [r.id]: e.target.value }))}
                    placeholder="Verified identity? Retention note? Rejection reason?"
                  />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="soft"
                    onClick={() => void update(r.id, "in_progress")}
                  >
                    In progress
                  </Button>
                  <Button
                    type="button"
                    variant="accent"
                    onClick={() => void update(r.id, "completed")}
                  >
                    {r.type === "erasure" ? "Complete + erase" : "Complete"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => void update(r.id, "rejected")}
                  >
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
