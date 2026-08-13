"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, Button, PageHeader, Panel } from "@/components/ui";

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

const priorityTone = (p: string): "default" | "warn" | "danger" => {
  if (p === "critical") return "danger";
  if (p === "important") return "warn";
  return "default";
};

export default function InboxPage() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    setBusy(true);
    await fetch(`/api/inbox/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    await load(false);
  }

  return (
    <main>
      <PageHeader
        title="Wealth Inbox"
        subtitle="One place for recommendations, connection issues, life-event follow-ups, and estate gaps."
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

      <Panel className="mb-3">
        <p className="eyebrow">Unread</p>
        <p className="font-display mt-1 text-3xl">{unread}</p>
      </Panel>

      <div className="space-y-3" aria-live="polite">
        {items.length === 0 && !error ? (
          <Panel>
            <p className="muted text-sm">Inbox is clear. Refresh after life events or syncs.</p>
          </Panel>
        ) : (
          items.map((item) => (
            <Panel key={item.id} className={item.status === "unread" ? "border-accent" : undefined}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="muted mt-1 text-sm">{item.body}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={priorityTone(item.priority)}>{item.priority}</Badge>
                  <Badge>{item.category.replaceAll("_", " ")}</Badge>
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
          ))
        )}
      </div>
    </main>
  );
}
