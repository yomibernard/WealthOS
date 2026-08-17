"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Badge,
  Button,
  EmptyState,
  InsightPanel,
  PageHeader,
  Panel,
} from "@/components/ui";
import { CHANNEL_COPY, type NotificationPrefs } from "@/lib/notification-prefs";
import { resolveNotificationLink } from "@/lib/notification-links";
import {
  classifyCustomerNotificationKind,
  customerNotificationKindLabel,
  filterCustomerNotifications,
  type CustomerNotificationKind,
  type CustomerNotificationReadFilter,
} from "@/engines/customer-notifications";
import { normalizeCategory } from "@/lib/notification-prefs";

type Note = {
  id: string;
  category: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

const READ_CHIPS: { id: CustomerNotificationReadFilter; label: string }[] = [
  { id: "unread", label: "Unread" },
  { id: "all", label: "All" },
];

const KIND_CHIPS: { id: CustomerNotificationKind | "all"; label: string }[] = [
  { id: "all", label: "All kinds" },
  { id: "care_update", label: "Care" },
  { id: "support", label: "Support" },
  { id: "privacy", label: "Privacy" },
  { id: "cadence", label: "Cadence" },
];

function triageHref(
  read: CustomerNotificationReadFilter,
  kind: CustomerNotificationKind | "all",
) {
  const params = new URLSearchParams();
  if (read !== "all") params.set("read", read);
  if (kind !== "all") params.set("kind", kind);
  const q = params.toString();
  return q ? `/app/notifications?${q}` : "/app/notifications";
}

const GROUP_ORDER = ["critical", "important", "advisory", "informational"] as const;

function NotificationsInner() {
  const searchParams = useSearchParams();
  const readRaw = searchParams.get("read");
  const kindRaw = searchParams.get("kind");
  const readFilter: CustomerNotificationReadFilter =
    readRaw === "unread" || readRaw === "read" ? readRaw : "all";
  const kindFilter: CustomerNotificationKind | "all" =
    kindRaw === "care_update" ||
    kindRaw === "support" ||
    kindRaw === "privacy" ||
    kindRaw === "cadence" ||
    kindRaw === "other"
      ? kindRaw
      : "all";

  const [notes, setNotes] = useState<Note[]>([]);
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [showPrefs, setShowPrefs] = useState(false);

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

  async function markRead(id: string) {
    setBusy(id);
    setMessage(null);
    const res = await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    });
    setBusy(null);
    if (!res.ok) {
      setMessage("Could not mark that notification as read.");
      return;
    }
    await load();
  }

  async function markAllRead() {
    setBusy("all");
    setMessage(null);
    const res = await fetch("/api/notifications/mark-all-read", { method: "POST" });
    setBusy(null);
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
    () => filterCustomerNotifications(notes, { read: readFilter, kind: kindFilter }),
    [notes, readFilter, kindFilter],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Note[]>();
    for (const key of GROUP_ORDER) map.set(key, []);
    for (const n of visible) {
      const cat = normalizeCategory(n.category);
      map.get(cat)!.push(n);
    }
    return GROUP_ORDER.map((key) => ({
      key,
      title: key.charAt(0).toUpperCase() + key.slice(1),
      items: map.get(key)!,
    })).filter((g) => g.items.length > 0);
  }, [visible]);

  return (
    <main>
      <PageHeader
        title="Notifications"
        subtitle="Critical · Important · Advisory · Information — without duplicating your Inbox desk."
        action={
          <button
            type="button"
            className="btn btn-ghost text-sm"
            onClick={() => setShowPrefs((v) => !v)}
          >
            {showPrefs ? "Hide preferences" : "Preferences"}
          </button>
        }
      />

      <InsightPanel eyebrow="Inbox vs notifications">
        Inbox is for actionable triage. Notifications are channel alerts and cadence — open Inbox when
        you need to act on recommendations.
      </InsightPanel>

      {message ? (
        <p className="mb-3 mt-3 text-sm" role="status">
          {message}
        </p>
      ) : null}

      {showPrefs && prefs ? (
        <Panel className="mb-4 mt-4 space-y-3">
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

      <Panel className="mb-4 mt-4 space-y-3">
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
          <Link href="/app/inbox" className="btn btn-ghost">
            Open inbox
          </Link>
        </div>
      </Panel>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone={unread > 0 ? "warn" : "default"}>{unread} unread</Badge>
        <Badge>{notes.length} total</Badge>
        {unread > 0 ? (
          <Button
            type="button"
            variant="soft"
            className="!min-h-0 px-3 py-1 text-sm"
            disabled={busy === "all"}
            onClick={() => void markAllRead()}
          >
            {busy === "all" ? "Saving…" : "Mark all as read"}
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
              href={triageHref(readFilter, chip.id)}
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

      {!notes.length ? (
        <EmptyState
          title="No notifications yet"
          body="Generate a report or digest above, or wait for care and cadence alerts in your enabled channels."
        />
      ) : null}
      {notes.length && !visible.length ? (
        <Panel>
          <p className="muted text-sm">
            No notifications match this triage filter.{" "}
            <Link href="/app/notifications" className="font-semibold text-accent">
              Show all
            </Link>
          </p>
        </Panel>
      ) : null}

      <div className="space-y-6">
        {grouped.map((group) => (
          <section key={group.key}>
            <h2 className="font-display text-xl">{group.title}</h2>
            <div className="mt-3 space-y-3">
              {group.items.map((n) => {
                const link = resolveNotificationLink(n);
                const kind = classifyCustomerNotificationKind(n);
                return (
                  <article key={n.id} className="asset-tile">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={!n.read ? "warn" : "default"}>
                        {n.read ? "Read" : "Unread"}
                      </Badge>
                      <Badge>{customerNotificationKindLabel(kind)}</Badge>
                    </div>
                    <p className="mt-2 font-semibold">{n.title}</p>
                    <p className="muted mt-1 whitespace-pre-wrap text-sm leading-relaxed">{n.body}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="muted text-xs">
                        {new Date(n.createdAt).toLocaleString("en-NG")}
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
                            disabled={busy === n.id}
                            onClick={() => void markRead(n.id)}
                          >
                            {busy === n.id ? "Saving…" : "Mark as read"}
                          </Button>
                        ) : null}
                      </div>
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

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <main>
          <PageHeader title="Notifications" subtitle="Loading triage desk…" />
        </main>
      }
    >
      <NotificationsInner />
    </Suspense>
  );
}
