"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Panel } from "@/components/ui";

type Connection = {
  id: string;
  providerName: string;
  kind: string;
  status: string;
  lastSyncAt: string | null;
  lastError: string | null;
};

type Bank = { code: string; name: string; providerLabel: string };

export function ConnectionsClient({
  initialConnections,
  banks,
}: {
  initialConnections: Connection[];
  banks: Bank[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function connect(bankCode: string) {
    setBusy(`connect:${bankCode}`);
    setError(null);
    setStatusMsg(null);
    const res = await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bankCode }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) {
      setError(data.error ?? "Could not connect.");
      return;
    }
    setStatusMsg(`Connected ${data.providerName}.`);
    router.refresh();
  }

  async function act(id: string, action: "sync" | "disconnect") {
    setBusy(`${action}:${id}`);
    setError(null);
    setStatusMsg(null);
    const res = await fetch(`/api/connections/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) {
      setError(data.error ?? "Action failed.");
      return;
    }
    setStatusMsg(
      action === "sync"
        ? (data.outcome?.message ?? "Sync complete.")
        : "Connection disconnected and consent paused.",
    );
    router.refresh();
  }

  const linked = new Set(initialConnections.map((c) => c.providerName));

  return (
    <div className="space-y-4">
      <div aria-live="polite" className="sr-only">
        {statusMsg || error || ""}
      </div>
      {error ? (
        <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {statusMsg ? (
        <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent" role="status">
          {statusMsg}
        </p>
      ) : null}

      <div className="space-y-3">
        {initialConnections.length ? (
          initialConnections.map((c) => (
            <Panel key={c.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{c.providerName}</p>
                    <Badge>simulated</Badge>
                  </div>
                  <p className="muted text-sm">{c.kind.replaceAll("_", " ")}</p>
                  <p className="muted mt-1 text-xs">Data used · account balances (demo refresh)</p>
                </div>
                <Badge
                  tone={
                    c.status === "healthy"
                      ? "default"
                      : c.status === "degraded"
                        ? "warn"
                        : "danger"
                  }
                >
                  {c.status}
                </Badge>
              </div>
              <p className="muted mt-2 text-sm">
                Last sync{" "}
                {c.lastSyncAt
                  ? new Date(c.lastSyncAt).toLocaleString("en-GB")
                  : "not yet synced"}
              </p>
              {c.lastError ? <p className="mt-1 text-sm text-warning">{c.lastError}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="soft"
                  disabled={busy !== null || c.status === "disconnected"}
                  onClick={() => void act(c.id, "sync")}
                  aria-label={`Sync ${c.providerName}`}
                >
                  {busy === `sync:${c.id}` ? "Syncing…" : "Refresh"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy !== null || c.status === "disconnected"}
                  onClick={() => void act(c.id, "disconnect")}
                  aria-label={`Disconnect ${c.providerName}`}
                >
                  Disconnect
                </Button>
              </div>
            </Panel>
          ))
        ) : (
          <Panel>
            <p className="muted">No live connections yet. Connect a demo bank below.</p>
          </Panel>
        )}
      </div>

      <Panel>
        <p className="eyebrow">Connect demo bank</p>
        <p className="muted mt-1 text-sm">
          <strong>Simulated</strong> only — no credentials leave this device. Consent is created
          automatically and can be paused anytime.
        </p>
        <ul className="mt-3 space-y-2">
          {banks.map((b) => {
            const already = linked.has(b.providerLabel);
            return (
              <li key={b.code} className="flex items-center justify-between gap-3">
                <span className="font-medium">{b.name}</span>
                <Button
                  type="button"
                  variant="soft"
                  disabled={already || busy !== null}
                  onClick={() => void connect(b.code)}
                  aria-label={already ? `${b.name} already connected` : `Connect ${b.name}`}
                >
                  {already ? "Linked" : busy === `connect:${b.code}` ? "Connecting…" : "Connect"}
                </Button>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
