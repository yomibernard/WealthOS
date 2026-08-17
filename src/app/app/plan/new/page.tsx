"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Button, Field, InsightPanel, PageHeader, Panel, ProgressBar, TextInput } from "@/components/ui";
import { projectGoal } from "@/engines/goals";
import { formatCurrency } from "@/lib/format";

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

const STEPS = [
  { key: "intent", title: "What do you want to achieve?" },
  { key: "amount", title: "How much?" },
  { key: "when", title: "When?" },
  { key: "allocated", title: "What is already allocated?" },
  { key: "contribute", title: "How much can you contribute?" },
] as const;

export default function NewGoalPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
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
  const [loading, setLoading] = useState(false);

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  const preview = useMemo(() => {
    const targetAmount = Number(form.targetAmount) || 0;
    const existingAllocation = Number(form.existingAllocation) || 0;
    const monthlyContribution = Number(form.monthlyContribution) || 0;
    if (!targetAmount || !form.targetDate) return null;
    return projectGoal({
      targetAmount,
      existingAllocation,
      monthlyContribution,
      targetDate: new Date(form.targetDate),
    });
  }, [form]);

  function validateStep(): string | null {
    if (step === 0 && (!form.name.trim() || !form.type)) return "Name your goal to continue.";
    if (step === 1 && !(Number(form.targetAmount) > 0)) return "Enter a target amount.";
    if (step === 2 && !form.targetDate) return "Choose a target date.";
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const problem = validateStep();
    if (problem) {
      setError(problem);
      return;
    }
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    setLoading(true);
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
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save goal.");
      return;
    }
    router.push(`/app/plan/${data.id}`);
  }

  return (
    <main>
      <PageHeader
        title="Create goal"
        subtitle="A short wizard — then an immediate illustrative projection."
      />
      <div className="mt-2">
        <ProgressBar value={progress} label={`Step ${step + 1} of ${STEPS.length}`} />
      </div>

      <Panel className="mt-4">
        <p className="eyebrow">{STEPS[step].title}</p>
        <form className="mt-4 space-y-4" onSubmit={(e) => void onSubmit(e)}>
          {step === 0 ? (
            <>
              <Field label="Goal type" id="type">
                <select
                  id="type"
                  className="min-h-12 w-full rounded-xl border border-line bg-white px-3"
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
              <Field label="Name" id="name" hint="e.g. Children’s university fund">
                <TextInput
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </Field>
            </>
          ) : null}

          {step === 1 ? (
            <Field label="Target amount (₦)" id="targetAmount">
              <TextInput
                id="targetAmount"
                type="number"
                required
                value={form.targetAmount}
                onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
              />
            </Field>
          ) : null}

          {step === 2 ? (
            <Field label="Target date" id="targetDate">
              <TextInput
                id="targetDate"
                type="date"
                required
                value={form.targetDate}
                onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
              />
            </Field>
          ) : null}

          {step === 3 ? (
            <Field
              label="Already allocated (₦)"
              id="existing"
              hint="Cash or investments already earmarked for this goal."
            >
              <TextInput
                id="existing"
                type="number"
                value={form.existingAllocation}
                onChange={(e) => setForm((f) => ({ ...f, existingAllocation: e.target.value }))}
              />
            </Field>
          ) : null}

          {step === 4 ? (
            <Field label="Monthly contribution (₦)" id="monthly">
              <TextInput
                id="monthly"
                type="number"
                value={form.monthlyContribution}
                onChange={(e) => setForm((f) => ({ ...f, monthlyContribution: e.target.value }))}
              />
            </Field>
          ) : null}

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <div className="flex flex-wrap gap-2">
            {step > 0 ? (
              <Button
                type="button"
                variant="ghost"
                disabled={loading}
                onClick={() => {
                  setError(null);
                  setStep((s) => s - 1);
                }}
              >
                Back
              </Button>
            ) : null}
            <Button type="submit" variant="accent" className="flex-1" disabled={loading}>
              {loading
                ? "Saving…"
                : step < STEPS.length - 1
                  ? "Continue"
                  : "Save goal & open journey"}
            </Button>
          </div>
        </form>
      </Panel>

      {preview && step >= 2 ? (
        <InsightPanel className="mt-4" eyebrow="First projection">
          Central path ≈ {formatCurrency(preview.projectedNominal, form.currency || "NGN", true)} (
          {preview.progressPercent}% of target). {preview.narrative}
        </InsightPanel>
      ) : null}
    </main>
  );
}
