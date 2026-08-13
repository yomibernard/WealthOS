"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, Button, PageHeader, Panel } from "@/components/ui";
import { CHANNEL_COPY, type NotificationPrefs } from "@/lib/notification-prefs";
import { resolveNotificationLink } from "@/lib/notification-links";

type Note = {
  id: string;
  category: string;
  title: string;
  body: string;
  createdAt: string;
};

export default function NotificationsPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const [nRes, pRes] = await Promise.all([
      fetch("/api/notifications"),
      fetch("/api/notifications/preferences"),
    ]);
    if (nRes.ok) setNotes(await nRes.json());
    if (pRes.ok) {
      const p = await pRes.json();
      setPrefs({
        critical: true,
        important: Boolean(p.important),
        advisory: Boolean(p.advisory),
        informational: Boolean(p.informational),
      });
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function savePrefs(next: NotificationPrefs) {
    const locked = { ...next, critical: true };
    setPrefs(locked);
    await fetch("/api/notifications/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(locked),
    });
    setMessage("Preferences saved. Critical alerts stay on.");
    await load();
  }

  async function runGenerate(kind: "monthly" | "weekly") {
    setBusy(kind);
    setMessage(null);
    try {
      const res = await fetch(
        kind === "monthly" ? "/api/reports/monthly" : "/api/digest/weekly",
        { method: "POST" },
      );
      const data = (await res.json()) as { error?: string; skipped?: boolean; reason?: string };
      if (!res.ok) {
        setMessage(data.error ?? "Could not generate.");
        return;
      }
      if (data.skipped) {
        setMessage(data.reason ?? "Skipped by your preferences.");
        return;
      }
      setMessage(kind === "monthly" ? "Monthly wealth report added." : "Weekly digest added.");
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <main>
      <PageHeader
        title="Notifications"
        subtitle="Control channels without missing security alerts. Digests and reports respect Informational."
      />

      {message ? (
        <p className="mb-3 text-sm" role="status">
          {message}
        </p>
      ) : null}

      {prefs ? (
        <Panel className="mb-4 space-y-3">
          <p className="eyebrow">Channels</p>
          {CHANNEL_COPY.map((ch) => (
            <label
              key={ch.key}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3"
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={prefs[ch.key]}
                disabled={ch.locked}
                onChange={(e) =>
                  void savePrefs({ ...prefs, [ch.key]: e.target.checked, critical: true })
                }
              />
              <span>
                <span className="font-semibold">{ch.label}</span>
                <span className="muted mt-1 block text-sm">{ch.detail}</span>
              </span>
            </label>
          ))}
          {!prefs.informational ? (
            <p className="text-sm font-medium text-danger">
              Informational is off — monthly reports and weekly digests will not notify until you
              turn it back on.
            </p>
          ) : null}
          {!prefs.important ? (
            <p className="muted text-sm">
              Important is off — adviser nudge notifications are hidden (shared notes still appear in
              Adviser collaboration / Inbox).
            </p>
          ) : null}
        </Panel>
      ) : null}

      <Panel className="mb-4 space-y-3">
        <p className="eyebrow">Generate now</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="soft"
            disabled={busy != null}
            onClick={() => void runGenerate("monthly")}
          >
            {busy === "monthly" ? "Working…" : "Monthly report"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={busy != null}
            onClick={() => void runGenerate("weekly")}
          >
            {busy === "weekly" ? "Working…" : "Weekly digest"}
          </Button>
          <Link href="/app/digest" className="btn btn-ghost">
            Open digest
          </Link>
          <Link href="/app/reports" className="btn btn-ghost">
            Open reports
          </Link>
        </div>
      </Panel>

      <div className="space-y-3">
        {notes.map((n) => {
          const link = resolveNotificationLink(n);
          return (
            <Panel key={n.id}>
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
              <p className="mt-2 font-semibold">{n.title}</p>
              <p className="muted mt-1 whitespace-pre-wrap text-sm">{n.body}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="muted text-xs">
                  {new Date(n.createdAt).toLocaleString("en-NG")}
                </p>
                {link ? (
                  <Link href={link.href} className="text-sm font-semibold text-accent">
                    {link.label}
                  </Link>
                ) : null}
              </div>
            </Panel>
          );
        })}
        {!notes.length ? (
          <Panel>
            <p className="muted text-sm">
              No notifications in your enabled channels yet. Generate a report or digest above.
            </p>
          </Panel>
        ) : null}
      </div>
    </main>
  );
}
