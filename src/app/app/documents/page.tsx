"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button, Field, PageHeader, Panel, TextInput } from "@/components/ui";

type Doc = { id: string; name: string; mimeType: string; createdAt: string };

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [name, setName] = useState("");

  async function load() {
    const res = await fetch("/api/documents");
    if (res.ok) setDocs(await res.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, mimeType: "application/pdf" }),
    });
    setName("");
    await load();
  }

  return (
    <main>
      <PageHeader
        title="Documents"
        subtitle="Secure document references with malware-scan flag (demo marks clean)."
      />
      <Panel>
        <form className="space-y-3" onSubmit={onSubmit}>
          <Field label="Document name" id="name">
            <TextInput id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Button type="submit" variant="accent">
            Upload reference
          </Button>
        </form>
      </Panel>
      <div className="mt-3 space-y-3">
        {docs.map((d) => (
          <Panel key={d.id}>
            <p className="font-semibold">{d.name}</p>
            <p className="muted text-sm">
              {d.mimeType} · {new Date(d.createdAt).toLocaleString("en-GB")} · scanned clean
            </p>
          </Panel>
        ))}
      </div>
    </main>
  );
}
