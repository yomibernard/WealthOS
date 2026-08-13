"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge, Button, Field, PageHeader, Panel, TextInput } from "@/components/ui";

type Member = {
  id: string;
  name: string;
  relationship: string;
  dependant: boolean;
  dateOfBirth: string | null;
};

export default function HouseholdPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("spouse");
  const [dependant, setDependant] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/household");
    if (res.status === 503) {
      setError("Household features are currently disabled.");
      return;
    }
    if (res.ok) setMembers(await res.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/household", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, relationship, dependant }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not save household member.");
      return;
    }
    setName("");
    await load();
  }

  return (
    <main>
      <PageHeader
        title="Household"
        subtitle="Family relationships for planning — Phase 4 will deepen joint wealth and beneficiaries."
      />
      {error ? (
        <p className="mb-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <Panel>
        <form className="space-y-3" onSubmit={onSubmit}>
          <Field label="Name" id="name">
            <TextInput id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Relationship" id="relationship">
            <select
              id="relationship"
              className="min-h-12 rounded-xl border border-line bg-white px-3"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
            >
              {["spouse", "child", "parent", "other"].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={dependant}
              onChange={(e) => setDependant(e.target.checked)}
            />
            Dependant
          </label>
          <Button type="submit" variant="accent" className="w-full">
            Add household member
          </Button>
        </form>
      </Panel>
      <div className="mt-3 space-y-3">
        {members.map((m) => (
          <Panel key={m.id}>
            <div className="flex flex-wrap gap-2">
              <Badge>{m.relationship}</Badge>
              {m.dependant ? <Badge tone="warn">Dependant</Badge> : null}
            </div>
            <p className="mt-2 font-semibold">{m.name}</p>
          </Panel>
        ))}
      </div>
    </main>
  );
}
