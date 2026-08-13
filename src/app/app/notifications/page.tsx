"use client";

import { useEffect, useState } from "react";
import { Badge, Button, PageHeader, Panel } from "@/components/ui";

type Note = {
  id: string;
  category: string;
  title: string;
  body: string;
  createdAt: string;
};

type Prefs = {
  critical: boolean;
  important: boolean;
  advisory: boolean;
  informational: boolean;
};

export default function NotificationsPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const [nRes, pRes] = await Promise.all([
      fetch("/api/notifications"),
      fetch("/api/notifications/preferences"),
    ]);
    if (nRes.ok) setNotes(await nRes.json());
    if (pRes.ok) setPrefs(await pRes.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function savePrefs(next: Prefs) {
    setPrefs(next);
    await fetch("/api/notifications/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setMessage("Preferences saved. Critical security alerts stay on.");
  }

  async function generateReport() {
    setMessage(null);
    const res = await fetch("/api/reports/monthly", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Report failed.");
      return;
    }
    if (data.skipped) {
      setMessage("Report skipped — informational notifications are off.");
      return;
    }
    setMessage("Monthly wealth report added.");
    await load();
  }

  return (
    <main>
      <PageHeader
        title="Notifications"
        subtitle="Critical, Important, Advisory, Informational — configure without overload."
        action={
          <Button type="button" variant="soft" onClick={() => void generateReport()}>
            Monthly report
          </Button>
        }
      />

      {message ? <p className="mb-3 text-sm">{message}</p> : null}

      {prefs ? (
        <Panel className="mb-4 space-y-2">
          <p className="eyebrow">Preferences</p>
          {(
            [
              ["critical", "Critical (security, fraud) — always on"],
              ["important", "Important (liquidity, concentration, maturity)"],
              ["advisory", "Advisory (rebalance, idle cash, plan tips)"],
              ["informational", "Informational (monthly report, market context)"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={prefs[key]}
                disabled={key === "critical"}
                onChange={(e) =>
                  void savePrefs({ ...prefs, [key]: e.target.checked, critical: true })
                }
              />
              <span>{label}</span>
            </label>
          ))}
        </Panel>
      ) : null}

      <div className="space-y-3">
        {notes.map((n) => (
          <Panel key={n.id}>
            <Badge tone={n.category === "Important" || n.category === "Critical" ? "warn" : "default"}>
              {n.category}
            </Badge>
            <p className="mt-2 font-semibold">{n.title}</p>
            <p className="muted mt-1 text-sm">{n.body}</p>
          </Panel>
        ))}
        {!notes.length ? (
          <Panel>
            <p className="muted">No notifications yet.</p>
          </Panel>
        ) : null}
      </div>
    </main>
  );
}
