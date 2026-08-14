"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, Button, PageHeader, Panel } from "@/components/ui";
import {
  classifyInboxKind,
  filterInboxItems,
  inboxKindLabel,
  type InboxKind,
  type InboxStatusFilter,
} from "@/engines/inbox-triage";

type InboxItem = {
  id: string;
  category: string;
  priority: string;
  title: string;
  body: string;
  href: string | null;
  status: string;
  createdAt: string;
};

const STATUS_CHIPS: { id: InboxStatusFilter; label: string }[] = [
  { id: "unread", label: "Unread" },
  { id: "all", label: "All" },
];

const KIND_CHIPS: { id: InboxKind | "all"; label: string }[] = [
  { id: "all", label: "All kinds" },
  { id: "recommendation", label: "Recommendations" },
  { id: "connection", label: "Connections" },
  { id: "data_quality", label: "Data quality" },
  { id: "adviser", label: "Adviser" },
  { id: "estate", label: "Estate" },
  { id: "support", label: "Support" },
  { id: "privacy", label: "Privacy" },
];

function triageHref(status: InboxStatusFilter, kind: InboxKind | "all") {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (kind !== "all") params.set("kind", kind);
  const q = params.toString();
  return q ? `/app/inbox?${q}` : "/app/inbox";
}

const priorityTone = (p: string): "default" | "warn" | "danger" => {
  if (p === "critical") return "danger";
  if (p === "important") return "warn";
  return "default";
};

function InboxInner() {
  const searchParams = useSearchParams();
  const statusRaw = searchParams.get("status");
  const kindRaw = searchParams.get("kind");
  const statusFilter: InboxStatusFilter =
    statusRaw === "unread" || statusRaw === "read" ? statusRaw : "all";
  const kindFilter: InboxKind | "all" =
    kindRaw === "recommendation" ||
    kindRaw === "connection" ||
    kindRaw === "data_quality" ||
    kindRaw === "estate" ||
    kindRaw === "adviser" ||
    kindRaw === "support" ||
    kindRaw === "privacy" ||
    kindRaw === "life_event" ||
    kindRaw === "other"
      ? kindRaw
      : "all";

  const [items, setItems] = useState<InboxItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load(refresh = false) {
    setError(null);
    const res = await fetch(refresh ? "/api/inbox?refresh=1" : "/api/inbox");
    if (res.status === 503) {
      setError("Wealth Inbox is currently disabled.");
      return;
    }
    if (!res.ok) {
      setError("Could not load inbox.");
      return;
    }
    const data = await res.json();
    setItems(data.items);
    setUnread(data.unread);
  }

  useEffect(() => {
    void load(true);
  }, []);

  async function setStatus(id: string, status: "read" | "dismissed" | "acted") {
    setBusyId(id);
    setBusy(true);
    await fetch(`/api/inbox/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    setBusyId(null);
    await load(false);
  }

  async function markAllRead() {
    setBusyId("all");
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/inbox/mark-all-read", { method: "POST" });
    setBusy(false);
    setBusyId(null);
    if (!res.ok) {
      setMessage("Could not mark all inbox items as read.");
      return;
    }
    const data = (await res.json()) as { updated?: number };
    setMessage(
      data.updated
        ? `Marked ${data.updated} item${data.updated === 1 ? "" : "s"} as read.`
        : "Nothing left to mark as read.",
    );
    await load(false);
  }

  const visible = useMemo(
    () => filterInboxItems(items, { status: statusFilter, kind: kindFilter }),
    [items, statusFilter, kindFilter],
  );

  return (
    <main>
      <PageHeader
        title="Wealth Inbox"
        subtitle="Triage recommendations, connections, adviser care, and estate gaps — know what to do next."
        action={
          <Button
            type="button"
            variant="soft"
            disabled={busy}
            onClick={() => void load(true)}
          >
            Refresh
          </Button>
        }
      />

      {error ? (
        <p className="mb-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="mb-3 text-sm" role="status">
          {message}
        </p>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone={unread > 0 ? "warn" : "default"}>{unread} unread</Badge>
        <Badge>{items.length} active</Badge>
        {unread > 0 ? (
          <Button
            type="button"
            variant="soft"
            className="!min-h-0 px-3 py-1 text-sm"
            disabled={busyId === "all"}
            onClick={() => void markAllRead()}
          >
            {busyId === "all" ? "Saving…" : "Mark all as read"}
          </Button>
        ) : null}
      </div>

      <div className="mb-2 flex flex-wrap gap-2" aria-label="Status filters">
        {STATUS_CHIPS.map((chip) => {
          const active = statusFilter === chip.id;
          return (
            <Link
              key={chip.id}
              href={triageHref(chip.id, kindFilter)}
              className={
                active
                  ? "rounded-md border border-accent bg-accent-soft px-3 py-1 text-sm font-medium"
                  : "muted rounded-md border border-line px-3 py-1 text-sm hover:border-accent"
              }
              aria-current={active ? "true" : undefined}
            >
              {chip.label}
            </Link>
          );
        })}
      </div>
      <div className="mb-4 flex flex-wrap gap-2" aria-label="Kind filters">
        {KIND_CHIPS.map((chip) => {
          const active = kindFilter === chip.id;
          return (
            <Link
              key={chip.id}
              href={triageHref(statusFilter, chip.id)}
              className={
                active
                  ? "rounded-md border border-accent bg-accent-soft px-3 py-1 text-sm font-medium"
                  : "muted rounded-md border border-line px-3 py-1 text-sm hover:border-accent"
              }
              aria-current={active ? "true" : undefined}
            >
              {chip.label}
            </Link>
          );
        })}
      </div>

      <div className="space-y-3" aria-live="polite">
        {!items.length && !error ? (
          <Panel>
            <p className="muted text-sm">Inbox is clear. Refresh after life events or syncs.</p>
          </Panel>
        ) : null}
        {items.length && !visible.length ? (
          <Panel>
            <p className="muted text-sm">
              No inbox items match this triage filter.{" "}
              <Link href="/app/inbox" className="font-semibold text-accent">
                Show all
              </Link>
            </p>
          </Panel>
        ) : null}
        {visible.map((item) => {
          const kind = classifyInboxKind(item.category);
          return (
            <Panel key={item.id} className={item.status === "unread" ? "border-accent" : undefined}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="muted mt-1 text-sm">{item.body}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={priorityTone(item.priority)}>{item.priority}</Badge>
                  <Badge>{inboxKindLabel(kind)}</Badge>
                  <Badge tone={item.status === "unread" ? "warn" : "default"}>
                    {item.status}
                  </Badge>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.href ? (
                  <Link
                    href={item.href}
                    className="btn btn-soft"
                    onClick={() => void setStatus(item.id, "read")}
                  >
                    Open
                  </Link>
                ) : null}
                {item.status === "unread" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => void setStatus(item.id, "read")}
                  >
                    Mark read
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void setStatus(item.id, "dismissed")}
                >
                  Dismiss
                </Button>
              </div>
            </Panel>
          );
        })}
      </div>
    </main>
  );
}

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <main>
          <PageHeader title="Wealth Inbox" subtitle="Loading triage desk…" />
        </main>
      }
    >
      <InboxInner />
    </Suspense>
  );
}
