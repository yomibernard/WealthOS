"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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

type Doc = { id: string; name: string; mimeType: string; createdAt: string };

const GROUPS = [
  "Statements",
  "Property",
  "Investments",
  "Insurance",
  "Pension",
  "Identity",
  "Other",
] as const;

type Group = (typeof GROUPS)[number];

function inferGroup(name: string): Group {
  const lower = name.toLowerCase();
  const tagged = GROUPS.find((g) => lower.startsWith(`[${g.toLowerCase()}]`));
  if (tagged) return tagged;
  if (/statement|bank|account/.test(lower)) return "Statements";
  if (/property|deed|title|mortgage|lease/.test(lower)) return "Property";
  if (/invest|fund|portfolio|share|bond/.test(lower)) return "Investments";
  if (/insur|policy|cover/.test(lower)) return "Insurance";
  if (/pension|rsa|annuity/.test(lower)) return "Pension";
  if (/id|passport|nin|bvn|identity/.test(lower)) return "Identity";
  return "Other";
}

function displayName(name: string) {
  return name.replace(/^\[[^\]]+\]\s*/i, "");
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [name, setName] = useState("");
  const [group, setGroup] = useState<Group>("Other");
  const [filter, setFilter] = useState<Group | "All">("All");

  async function load() {
    const res = await fetch("/api/documents");
    if (res.ok) setDocs(await res.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const labelled = `[${group}] ${name.trim()}`;
    await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: labelled, mimeType: "application/pdf" }),
    });
    setName("");
    await load();
  }

  const grouped = useMemo(() => {
    const map = new Map<Group, Doc[]>();
    for (const g of GROUPS) map.set(g, []);
    for (const d of docs) {
      const g = inferGroup(d.name);
      map.get(g)!.push(d);
    }
    return map;
  }, [docs]);

  const visibleGroups =
    filter === "All" ? GROUPS : GROUPS.filter((g) => g === filter);

  return (
    <main>
      <PageHeader
        title="Documents"
        subtitle="Secure digital vault — references with malware-scan flag (demo marks clean)."
      />

      <section className="hero-metric">
        <p className="eyebrow">Vault</p>
        <h2 className="font-display mt-1 text-3xl font-semibold tracking-tight">
          {docs.length} document{docs.length === 1 ? "" : "s"}
        </h2>
        <p className="muted mt-2 max-w-2xl text-sm leading-relaxed">
          Group by statements, property, investments, insurance, pension, identity, and other. Upload
          references; binary preview pipelines remain limited in this MVP.
        </p>
      </section>

      <InsightPanel className="mt-4" eyebrow="Security">
        References are stored with encryption-at-rest flags and a clean scan mark in demo. Link to
        assets from Wealth when you need provenance.
      </InsightPanel>

      <Panel className="mt-4">
        <form className="space-y-3" onSubmit={(e) => void onSubmit(e)}>
          <Field label="Vault group" id="group">
            <select
              id="group"
              className="min-h-12 w-full rounded-xl border border-line bg-white px-3"
              value={group}
              onChange={(e) => setGroup(e.target.value as Group)}
            >
              {GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Document name" id="name">
            <TextInput
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q1 bank statement"
              required
            />
          </Field>
          <Button type="submit" variant="accent">
            Upload reference
          </Button>
        </form>
      </Panel>

      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Document groups">
        <button
          type="button"
          role="tab"
          aria-selected={filter === "All"}
          className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
            filter === "All" ? "border-accent bg-accent-soft text-accent" : "border-line bg-white"
          }`}
          onClick={() => setFilter("All")}
        >
          All
        </button>
        {GROUPS.map((g) => (
          <button
            key={g}
            type="button"
            role="tab"
            aria-selected={filter === g}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
              filter === g ? "border-accent bg-accent-soft text-accent" : "border-line bg-white"
            }`}
            onClick={() => setFilter(g)}
          >
            {g}
          </button>
        ))}
      </div>

      {!docs.length ? (
        <div className="mt-4">
          <EmptyState
            title="Vault is empty"
            body="Upload a document reference to start organising statements, deeds, and policies."
          />
        </div>
      ) : (
        visibleGroups.map((g) => {
          const items = grouped.get(g) ?? [];
          if (!items.length && filter === "All") return null;
          return (
            <section key={g} className="mt-5">
              <h2 className="font-display text-xl">{g}</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {items.length ? (
                  items.map((d) => (
                    <article key={d.id} className="asset-tile">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{g}</Badge>
                        <Badge>scanned clean</Badge>
                      </div>
                      <p className="mt-2 font-semibold">{displayName(d.name)}</p>
                      <p className="muted mt-1 text-sm">
                        {d.mimeType} · {new Date(d.createdAt).toLocaleString("en-GB")}
                      </p>
                      <p className="muted mt-2 text-xs">
                        Preview / rename / asset-link pipelines can deepen later — reference is
                        stored securely for now.
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="muted text-sm">No documents in this group.</p>
                )}
              </div>
            </section>
          );
        })
      )}
    </main>
  );
}
