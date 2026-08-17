"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Panel, ProgressBar, TextInput } from "@/components/ui";

const sections = [
  {
    key: "aspiration",
    label: "What should your money achieve?",
    type: "text",
    why: "Sets the purpose for goals and next-best actions — not a product catalogue.",
  },
  {
    key: "age",
    label: "Age",
    type: "number",
    why: "Frames retirement, protection, and time horizons in health diagnostics.",
  },
  {
    key: "employment",
    label: "Employment / business status",
    type: "text",
    why: "Helps interpret income stability and planning assumptions.",
  },
  {
    key: "income",
    label: "Monthly income (₦)",
    type: "number",
    why: "Used for savings rate, affordability, and Wealth Health estimates.",
  },
  {
    key: "dependants",
    label: "Number of dependants",
    type: "number",
    why: "Influences protection and cash-reserve needs.",
  },
  {
    key: "risk",
    label: "Risk comfort (conservative / balanced / growth)",
    type: "text",
    why: "Guides suitability language — engines still calculate; AI only explains.",
  },
];

export default function FactFindPage() {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const section = sections[idx];
  const completeness = Math.round(((idx + 1) / sections.length) * 100);

  async function persist(nextValues: Record<string, string>) {
    await fetch("/api/onboarding/fact-find", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextValues),
    });
  }

  async function saveAndContinue() {
    await persist(values);
    if (idx >= sections.length - 1) router.push("/app");
    else setIdx((i) => i + 1);
  }

  async function skip() {
    await persist(values);
    if (idx >= sections.length - 1) router.push("/app");
    else setIdx((i) => i + 1);
  }

  return (
    <main className="page py-8">
      <p className="eyebrow">Conversational fact-find</p>
      <h1 className="font-display mt-2 text-3xl">Build your financial profile</h1>
      <p className="muted mt-2 max-w-xl text-sm">
        One question at a time. Skip what you are unsure about — you can refine later in WealthOS.
      </p>
      <div className="mt-4">
        <ProgressBar value={completeness} label={`Financial Profile ${completeness}% complete`} />
      </div>
      <Panel className="mt-6 space-y-4 animate-rise">
        <p className="eyebrow">
          Question {idx + 1} of {sections.length}
        </p>
        <Field label={section.label} id={section.key}>
          <TextInput
            id={section.key}
            type={section.type}
            value={values[section.key] ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, [section.key]: e.target.value }))}
          />
        </Field>
        <p className="muted text-sm leading-relaxed">
          <span className="font-semibold text-ink">Why we ask: </span>
          {section.why}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="accent" onClick={() => void saveAndContinue()}>
            Continue
          </Button>
          <Button type="button" variant="ghost" onClick={() => void skip()}>
            Skip for now
          </Button>
        </div>
      </Panel>
    </main>
  );
}
