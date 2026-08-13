"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button, Field, PageHeader, Panel, TextInput } from "@/components/ui";

const kinds = [
  { value: "asset-cash", label: "Cash / bank" },
  { value: "asset-investment", label: "Investment" },
  { value: "asset-property", label: "Property" },
  { value: "asset-pension", label: "Pension" },
  { value: "asset-business", label: "Business interest" },
  { value: "asset-crypto", label: "Crypto (awareness only — no trading)" },
  { value: "liability", label: "Liability" },
];

export default function AddWealthPage() {
  const router = useRouter();
  const [kind, setKind] = useState("asset-cash");
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [ownership, setOwnership] = useState("100");
  const [provider, setProvider] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/wealth/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        name,
        value: Number(value),
        currency,
        ownershipPercent: Number(ownership),
        provider,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "We could not save this item right now.");
      return;
    }
    router.push("/app/wealth");
    router.refresh();
  }

  return (
    <main>
      <PageHeader title="Add to Wealth Graph" subtitle="Manual entry first. Provenance will be marked clearly." />
      <Panel>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Type" id="kind">
            <select
              id="kind"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="min-h-12 rounded-xl border border-line bg-white px-3"
            >
              {kinds.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Name" id="name">
            <TextInput id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Provider" id="provider">
            <TextInput id="provider" value={provider} onChange={(e) => setProvider(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Value / balance" id="value">
              <TextInput
                id="value"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
            </Field>
            <Field label="Currency" id="currency">
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="min-h-12 rounded-xl border border-line bg-white px-3"
              >
                {["NGN", "USD", "GBP", "EUR"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Ownership %" id="ownership">
            <TextInput
              id="ownership"
              type="number"
              min={1}
              max={100}
              value={ownership}
              onChange={(e) => setOwnership(e.target.value)}
            />
          </Field>
          {error ? (
            <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" variant="accent" className="w-full">
            Save
          </Button>
        </form>
      </Panel>
    </main>
  );
}
