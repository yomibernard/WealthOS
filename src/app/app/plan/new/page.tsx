"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button, Field, PageHeader, Panel, TextInput } from "@/components/ui";

const types = [
  "RETIREMENT",
  "EDUCATION",
  "PROPERTY",
  "EMERGENCY",
  "BUSINESS_CAPITAL",
  "MIGRATION",
  "REGULAR_INCOME",
  "CUSTOM",
];

export default function NewGoalPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    type: "RETIREMENT",
    name: "",
    targetAmount: "",
    targetDate: "",
    monthlyContribution: "",
    existingAllocation: "",
    currency: "NGN",
  });
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        targetAmount: Number(form.targetAmount),
        monthlyContribution: Number(form.monthlyContribution || 0),
        existingAllocation: Number(form.existingAllocation || 0),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not save goal.");
      return;
    }
    router.push(`/app/plan/${data.id}`);
  }

  return (
    <main>
      <PageHeader title="Create goal" subtitle="Capture target, timing and contribution assumptions." />
      <Panel>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Goal type" id="type">
            <select
              id="type"
              className="min-h-12 rounded-xl border border-line bg-white px-3"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              {types.map((t) => (
                <option key={t} value={t}>
                  {t.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Name" id="name">
            <TextInput
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="Target amount" id="targetAmount">
            <TextInput
              id="targetAmount"
              type="number"
              required
              value={form.targetAmount}
              onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
            />
          </Field>
          <Field label="Target date" id="targetDate">
            <TextInput
              id="targetDate"
              type="date"
              required
              value={form.targetDate}
              onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
            />
          </Field>
          <Field label="Existing allocation" id="existing">
            <TextInput
              id="existing"
              type="number"
              value={form.existingAllocation}
              onChange={(e) => setForm((f) => ({ ...f, existingAllocation: e.target.value }))}
            />
          </Field>
          <Field label="Monthly contribution" id="monthly">
            <TextInput
              id="monthly"
              type="number"
              value={form.monthlyContribution}
              onChange={(e) => setForm((f) => ({ ...f, monthlyContribution: e.target.value }))}
            />
          </Field>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" variant="accent" className="w-full">
            Save goal
          </Button>
        </form>
      </Panel>
    </main>
  );
}
