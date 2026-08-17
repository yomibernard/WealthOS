"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, Button, EmptyState, InsightPanel, PageHeader, Panel } from "@/components/ui";
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
  { id: "adviser", label: "Adviser" },
  { id: "support", label: "Support" },
  { id: "privacy", label: "Privacy" },
  { id: "connection", label: "Connections" },
  { id: "data_quality", label: "Data quality" },
  { id: "estate", label: "Estate" },
];

function triageHref(status: InboxStatusFilter, kind: InboxKind | "all") {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (kind !== "all") params.set("kind", kind);
  const q = params.toString();
  return q ? `/app/inbox?${q}` : "/app/inbox";
}

function sectionFor(item: InboxItem): "needs_action" | "adviser" | "wealthos" | "support" {
  const kind = classifyInboxKind(item.category);
  if (kind === "adviser") return "adviser";
  if (kind === "support" || kind === "privacy") return "support";
  if (item.priority === "critical" || item.priority === "important" || item.status === "unread") {
    if (kind === "recommendation" || kind === "data_quality" || kind === "connection") {
      return "needs_action";
    }
  }
  if (kind === "recommendation" || kind === "data_quality" || kind === "estate") return "needs_action";
  return "wealthos";
}

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

  const sections = useMemo(() => {
    const buckets: Record<string, InboxItem[]> = {
      needs_action: [],
      adviser: [],
      wealthos: [],
      support: [],
    };
    for (const item of visible) {
      buckets[sectionFor(item)].push(item);
    }
    return [
      { id: "needs_action", title: "Needs action", items: buckets.needs_action },
      { id: "adviser", title: "Adviser", items: buckets.adviser },
      { id: "wealthos", title: "WealthOS", items: buckets.wealthos },
      { id: "support", title: "Support & privacy", items: buckets.support },
    ].filter((s) => s.items.length > 0);
  }, [visible]);

  return (
    <main>
      <PageHeader
        title="Wealth Inbox"
        subtitle="What deserves attention — not an email client. Triage, then act."
        action={
          <Button type="button" variant="soft" disabled={busy} onClick={() => void load(true)}>
            Refresh
          </Button>
        }
      />

      <InsightPanel eyebrow="How to use this">
        Prioritise unread and important recommendations first. Mark read or dismiss when done —
        resolved items leave the active desk.
      </InsightPanel>

      {error ? (
        <p className="mb-3 mt-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="mb-3 mt-3 text-sm" role="status">
          {message}
        </p>
      ) : null}

      <div className="mt-4 mb-3 flex flex-wrap items-center gap-2">
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
                  ? "rounded-full border border-accent bg-accent-soft px-3 py-1.5 text-sm font-semibold"
                  : "muted rounded-full border border-line px-3 py-1.5 text-sm hover:border-accent"
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
                  ? "rounded-full border border-accent bg-accent-soft px-3 py-1.5 text-sm font-semibold"
                  : "muted rounded-full border border-line px-3 py-1.5 text-sm hover:border-accent"
              }
              aria-current={active ? "true" : undefined}
            >
              {chip.label}
            </Link>
          );
        })}
      </div>

      <div className="space-y-6" aria-live="polite">
        {!items.length && !error ? (
          <EmptyState
            title="Inbox is clear"
            body="Nothing needs triage right now. Refresh after life events, syncs, or new recommendations."
          />
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

        {sections.map((section) => (
          <section key={section.id}>
            <h2 className="font-display text-xl">{section.title}</h2>
            <div className="mt-3 space-y-3">
              {section.items.map((item) => {
                const kind = classifyInboxKind(item.category);
                return (
                  <article
                    key={item.id}
                    className={`action-card ${item.status === "unread" ? "border-accent" : ""}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {item.status === "unread" ? <Badge tone="warn">Unread</Badge> : null}
                      {item.priority === "critical" || item.priority === "important" ? (
                        <Badge tone={item.priority === "critical" ? "danger" : "warn"}>
                          Action required
                        </Badge>
                      ) : null}
                      <Badge>{inboxKindLabel(kind)}</Badge>
                    </div>
                    <p className="mt-2 font-semibold">{item.title}</p>
                    <p className="muted mt-1 text-sm leading-relaxed">{item.body}</p>
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
                        Resolve / dismiss
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
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
