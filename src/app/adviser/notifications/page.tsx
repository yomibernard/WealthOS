"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, Button, PageHeader, Panel } from "@/components/ui";
import { resolveNotificationLink } from "@/lib/notification-links";
import {
  adviserNotificationKindLabel,
  classifyAdviserNotificationKind,
  filterAdviserNotifications,
  type AdviserNotificationKind,
  type AdviserNotificationReadFilter,
} from "@/engines/adviser-notifications";

type Note = {
  id: string;
  category: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

const READ_CHIPS: { id: AdviserNotificationReadFilter; label: string }[] = [
  { id: "unread", label: "Unread" },
  { id: "all", label: "All" },
];

const KIND_CHIPS: { id: AdviserNotificationKind | "all"; label: string }[] = [
  { id: "all", label: "All kinds" },
  { id: "care_receipt", label: "Care receipts" },
  { id: "share", label: "Shares" },
];

function triageHref(read: AdviserNotificationReadFilter, kind: AdviserNotificationKind | "all") {
  const params = new URLSearchParams();
  if (read !== "all") params.set("read", read);
  if (kind !== "all") params.set("kind", kind);
  const q = params.toString();
  return q ? `/adviser/notifications?${q}` : "/adviser/notifications";
}

function AdviserNotificationsInner() {
  const searchParams = useSearchParams();
  const readRaw = searchParams.get("read");
  const kindRaw = searchParams.get("kind");
  const readFilter: AdviserNotificationReadFilter =
    readRaw === "unread" || readRaw === "read" ? readRaw : "all";
  const kindFilter: AdviserNotificationKind | "all" =
    kindRaw === "care_receipt" || kindRaw === "share" || kindRaw === "other"
      ? kindRaw
      : "all";

  const [notes, setNotes] = useState<Note[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/notifications");
    if (res.ok) setNotes(await res.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function markRead(id: string) {
    setBusyId(id);
    setMessage(null);
    const res = await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    });
    setBusyId(null);
    if (!res.ok) {
      setMessage("Could not mark that notification as read.");
      return;
    }
    await load();
  }

  async function markAllRead() {
    setBusyId("all");
    setMessage(null);
    const res = await fetch("/api/notifications/mark-all-read", { method: "POST" });
    setBusyId(null);
    if (!res.ok) {
      setMessage("Could not mark all notifications as read.");
      return;
    }
    const data = (await res.json()) as { updated?: number };
    setMessage(
      data.updated
        ? `Marked ${data.updated} notification${data.updated === 1 ? "" : "s"} as read.`
        : "Nothing left to mark as read.",
    );
    await load();
  }

  const unread = notes.filter((n) => !n.read).length;
  const visible = useMemo(
    () => filterAdviserNotifications(notes, { read: readFilter, kind: kindFilter }),
    [notes, readFilter, kindFilter],
  );

  return (
    <main className="page-wide">
      <PageHeader
        title="Adviser notifications"
        subtitle="Triage care receipts and customer shares — filter, open the Care desk, or clear the unread desk."
        action={
          <Link href="/adviser" className="btn btn-soft">
            Care radar
          </Link>
        }
      />

      {message ? (
        <p className="mb-3 text-sm" role="status">
          {message}
        </p>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone={unread > 0 ? "warn" : "default"}>{unread} unread</Badge>
        <Badge>{notes.length} total</Badge>
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

      <div className="mb-2 flex flex-wrap gap-2" aria-label="Read filters">
        {READ_CHIPS.map((chip) => {
          const active = readFilter === chip.id;
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
              href={triageHref(readFilter, chip.id)}
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

      <div className="space-y-3">
        {visible.map((n) => {
          const link = resolveNotificationLink(n);
          const kind = classifyAdviserNotificationKind(n);
          return (
            <Panel key={n.id}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  tone={
                    n.category.toLowerCase() === "important" ||
                    n.category.toLowerCase() === "critical"
                      ? "warn"
                      : "default"
                  }
                >
                  {n.category}
                </Badge>
                <Badge>{adviserNotificationKindLabel(kind)}</Badge>
                <Badge tone={n.read ? "default" : "warn"}>
                  {n.read ? "Read" : "Unread"}
                </Badge>
              </div>
              <p className="mt-2 font-semibold">{n.title}</p>
              <p className="muted mt-1 whitespace-pre-wrap text-sm">{n.body}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="muted text-xs">
                  {new Date(n.createdAt).toLocaleString("en-GB")}
                </p>
                <div className="flex flex-wrap gap-3">
                  {link ? (
                    <Link href={link.href} className="text-sm font-semibold text-accent">
                      {link.label}
                    </Link>
                  ) : null}
                  {!n.read ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="!min-h-0 !px-0 !py-0 text-sm"
                      disabled={busyId === n.id}
                      onClick={() => void markRead(n.id)}
                    >
                      {busyId === n.id ? "Saving…" : "Mark as read"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </Panel>
          );
        })}
        {!notes.length ? (
          <Panel>
            <p className="muted text-sm">
              No adviser notifications yet. When a customer marks a care update as seen or shares a
              briefing, it appears here.
            </p>
          </Panel>
        ) : null}
        {notes.length && !visible.length ? (
          <Panel>
            <p className="muted text-sm">
              No notifications match this triage filter.{" "}
              <Link href="/adviser/notifications" className="font-semibold text-accent">
                Show all
              </Link>
            </p>
          </Panel>
        ) : null}
      </div>
    </main>
  );
}

export default function AdviserNotificationsPage() {
  return (
    <Suspense
      fallback={
        <main className="page-wide">
          <PageHeader title="Adviser notifications" subtitle="Loading triage desk…" />
        </main>
      }
    >
      <AdviserNotificationsInner />
    </Suspense>
  );
}
