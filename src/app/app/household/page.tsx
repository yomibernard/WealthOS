"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  InsightPanel,
  PageHeader,
  Panel,
  TextInput,
} from "@/components/ui";

type Member = {
  id: string;
  name: string;
  relationship: string;
  dependant: boolean;
  dateOfBirth: string | null;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

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

  const groups = useMemo(() => {
    const order = ["spouse", "child", "parent", "other"];
    const map = new Map<string, Member[]>();
    for (const m of members) {
      const key = m.relationship || "other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return order
      .filter((k) => map.has(k))
      .map((k) => ({ key: k, members: map.get(k)! }))
      .concat(
        [...map.entries()]
          .filter(([k]) => !order.includes(k))
          .map(([key, members]) => ({ key, members })),
      );
  }, [members]);

  const dependants = members.filter((m) => m.dependant).length;

  return (
    <main>
      <PageHeader
        title="Household"
        subtitle="Family context for planning — understandable without exposing unnecessary private detail."
      />

      <section className="hero-metric">
        <p className="eyebrow">Family</p>
        <h2 className="font-display mt-1 text-3xl font-semibold tracking-tight">
          {members.length} member{members.length === 1 ? "" : "s"}
        </h2>
        <p className="muted mt-2 text-sm">
          {dependants} dependant{dependants === 1 ? "" : "s"} marked · shared goals and assets live
          in Plan and Wealth.
        </p>
      </section>

      <InsightPanel className="mt-4" eyebrow="Privacy">
        Household wealth is summarised here for planning. Individual permissions and shared assets
        deepen over time — we do not dump every personal detail onto one screen.
      </InsightPanel>

      {error ? (
        <p className="mb-3 mt-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/app/plan" className="btn btn-soft">
          Shared goals
        </Link>
        <Link href="/app/wealth" className="btn btn-ghost">
          Shared / individual assets
        </Link>
        <Link href="/app/consent" className="btn btn-ghost">
          Permissions
        </Link>
      </div>

      {!members.length ? (
        <div className="mt-5">
          <EmptyState
            title="No household members yet"
            body="Add a spouse, child, or dependant so protection and estate readiness stay grounded."
          />
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.key} className="mt-5">
            <h2 className="font-display text-xl capitalize">{g.key}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {g.members.map((m) => (
                <article key={m.id} className="asset-tile flex items-start gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-soft font-display text-lg text-accent"
                    aria-hidden
                  >
                    {initials(m.name) || "·"}
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{m.relationship}</Badge>
                      {m.dependant ? <Badge tone="warn">Dependant</Badge> : null}
                    </div>
                    <p className="mt-2 font-semibold">{m.name}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      )}

      <Panel className="mt-5">
        <p className="eyebrow">Add member</p>
        <form className="mt-3 space-y-3" onSubmit={(e) => void onSubmit(e)}>
          <Field label="Name" id="name">
            <TextInput id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Relationship" id="relationship">
            <select
              id="relationship"
              className="min-h-12 w-full rounded-xl border border-line bg-white px-3"
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
    </main>
  );
}
