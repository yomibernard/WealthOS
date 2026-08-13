"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Panel, ProgressBar, TextInput } from "@/components/ui";

const sections = [
  { key: "aspiration", label: "What should your money achieve?", type: "text" },
  { key: "age", label: "Age", type: "number" },
  { key: "employment", label: "Employment / business status", type: "text" },
  { key: "income", label: "Monthly income (₦)", type: "number" },
  { key: "dependants", label: "Number of dependants", type: "number" },
  { key: "risk", label: "Risk comfort (conservative / balanced / growth)", type: "text" },
];

export default function FactFindPage() {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const section = sections[idx];
  const completeness = Math.round(((idx + 1) / sections.length) * 100);

  async function saveAndContinue() {
    await fetch("/api/onboarding/fact-find", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (idx >= sections.length - 1) router.push("/app");
    else setIdx((i) => i + 1);
  }

  return (
    <main className="page py-8">
      <p className="eyebrow">Conversational fact-find</p>
      <h1 className="font-display mt-2 text-3xl">Build your financial profile</h1>
      <div className="mt-4">
        <ProgressBar value={completeness} label={`Financial Profile ${completeness}% complete`} />
      </div>
      <Panel className="mt-6 space-y-4">
        <Field label={section.label} id={section.key}>
          <TextInput
            id={section.key}
            type={section.type}
            value={values[section.key] ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, [section.key]: e.target.value }))}
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="accent" onClick={saveAndContinue}>
            Continue
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (idx >= sections.length - 1) router.push("/app");
              else setIdx((i) => i + 1);
            }}
          >
            Skip for now
          </Button>
        </div>
      </Panel>
    </main>
  );
}
