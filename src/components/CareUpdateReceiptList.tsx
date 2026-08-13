"use client";

import { useState } from "react";
import { Badge, Button, TextInput } from "@/components/ui";

export type CareUpdateRow = {
  id: string;
  title: string;
  preview: string;
  adviserName: string;
  createdAt: string;
  href: string;
  seen?: boolean;
  thanksPreview?: string | null;
};

export function CareUpdateReceiptList({
  items,
  onChanged,
  emptyHint,
}: {
  items: CareUpdateRow[];
  onChanged: () => void | Promise<void>;
  emptyHint: string;
}) {
  const [thanksById, setThanksById] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!items.length) {
    return <p className="muted text-sm">{emptyHint}</p>;
  }

  async function markSeen(id: string) {
    setBusyId(id);
    setError(null);
    const thanks = (thanksById[id] ?? "").trim();
    const res = await fetch(`/api/care-updates/${id}/seen`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(thanks ? { thanks } : {}),
    });
    setBusyId(null);
    if (!res.ok) {
      setError("Could not mark that care update as seen.");
      return;
    }
    setThanksById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    await onChanged();
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {items.map((u) => (
          <li key={u.id} className="rounded-xl border border-line px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-sm">{u.title}</p>
              <Badge tone={u.seen ? "default" : "warn"}>
                {u.seen ? "Seen" : "Unseen"}
              </Badge>
            </div>
            <p className="mt-1 text-sm">{u.preview}</p>
            {u.seen && u.thanksPreview ? (
              <p className="mt-1 text-sm">Thanks: {u.thanksPreview}</p>
            ) : null}
            <p className="muted mt-1 text-xs">
              {u.adviserName} · {new Date(u.createdAt).toLocaleString("en-GB")}
            </p>
            {!u.seen ? (
              <div className="mt-2 space-y-2">
                <TextInput
                  id={`thanks-${u.id}`}
                  value={thanksById[u.id] ?? ""}
                  onChange={(e) =>
                    setThanksById((prev) => ({ ...prev, [u.id]: e.target.value }))
                  }
                  placeholder="Optional thanks (does not close the case)"
                  maxLength={200}
                />
                <Button
                  type="button"
                  variant="soft"
                  className="w-full"
                  disabled={busyId === u.id}
                  onClick={() => void markSeen(u.id)}
                >
                  {busyId === u.id ? "Saving…" : "Mark as seen"}
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
