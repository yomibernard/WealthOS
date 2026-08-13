"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, Button, PageHeader, Panel } from "@/components/ui";
import { resolveNotificationLink } from "@/lib/notification-links";

type Note = {
  id: string;
  category: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export default function AdviserNotificationsPage() {
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

  const unread = notes.filter((n) => !n.read).length;

  return (
    <main className="page-wide">
      <PageHeader
        title="Adviser notifications"
        subtitle="Care receipts and customer shares land here — open the Care desk without leaving the adviser portal."
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

      <div className="mb-3 flex flex-wrap gap-2">
        <Badge tone={unread > 0 ? "warn" : "default"}>
          {unread} unread
        </Badge>
        <Badge>{notes.length} total</Badge>
      </div>

      <div className="space-y-3">
        {notes.map((n) => {
          const link = resolveNotificationLink(n);
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
      </div>
    </main>
  );
}
