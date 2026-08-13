"use client";

import { useEffect, useState } from "react";
import { Button, PageHeader, Panel } from "@/components/ui";

type Rate = {
  from: string;
  to: string;
  rate: number;
  asOf: string;
  source: string;
};

export default function AdminFxPage() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/fx");
    if (res.ok) {
      const data = await res.json();
      setRates(data.rates ?? []);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function refresh() {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/fx", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setMessage(`Refreshed ${data.count} FX pairs from ${data.quotes?.[0]?.source ?? "provider"}.`);
      await load();
    } else {
      setMessage(data.error ?? "Refresh failed.");
    }
  }

  return (
    <main className="page-wide">
      <PageHeader
        title="FX rates"
        subtitle="Approved FX source used by the net-worth engine. Demo adapter simulates market drift."
        action={
          <Button type="button" variant="accent" onClick={() => void refresh()} disabled={busy}>
            {busy ? "Refreshing…" : "Refresh rates"}
          </Button>
        }
      />
      {message ? <p className="mb-3 text-sm">{message}</p> : null}
      <div className="space-y-3">
        {rates.map((r) => (
          <Panel key={`${r.from}-${r.to}-${r.asOf}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-xl">
                {r.from}/{r.to}
              </p>
              <p className="font-semibold">{r.rate.toLocaleString("en-NG")}</p>
            </div>
            <p className="muted mt-1 text-sm">
              As of {new Date(r.asOf).toLocaleString("en-GB")} · {r.source}
            </p>
          </Panel>
        ))}
      </div>
    </main>
  );
}
