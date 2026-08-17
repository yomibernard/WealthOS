"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button, Field, InsightPanel, PageHeader, Panel, TextInput } from "@/components/ui";

const TOPICS = [
  "Investment",
  "Retirement",
  "Property",
  "Debt",
  "Family",
  "Other",
] as const;

const EXPECTATIONS = [
  { id: "few_days", label: "Within a few days" },
  { id: "this_week", label: "This week" },
  { id: "when_ready", label: "When they are ready — no rush" },
] as const;

export default function AdviserRequestPage() {
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>("Investment");
  const [expectation, setExpectation] =
    useState<(typeof EXPECTATIONS)[number]["id"]>("few_days");
  const [detail, setDetail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const expectLabel =
      EXPECTATIONS.find((x) => x.id === expectation)?.label ?? expectation;
    const reason = `[${topic}] ${detail.trim()} — Response expectation: ${expectLabel}`;
    const res = await fetch("/api/escalations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, level: "L3_ADVISER" }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("We could not submit that request. Please try again.");
      return;
    }
    setDone(true);
  }

  return (
    <main>
      <PageHeader
        title="Request an adviser"
        subtitle="Short form — what help you need, and when you hope for a response."
        action={
          <Link href="/app/adviser-collab" className="btn btn-ghost">
            Collaboration
          </Link>
        }
      />

      <InsightPanel eyebrow="What happens next">
        Level 3 escalation packages your Wealth Graph summary, goals, and recent context for a
        regulated financial adviser. Nothing is executed automatically.
      </InsightPanel>

      <Panel className="mt-4">
        {done ? (
          <div className="space-y-3">
            <p className="font-semibold">Request received</p>
            <p className="text-sm leading-relaxed">
              An adviser will see your Wealth Graph summary, goals and recent AI conversations.
              Track status under Support, and shared notes under Adviser collaboration.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/app/adviser-collab" className="btn btn-soft">
                Open collaboration
              </Link>
              <Link href="/app/support" className="btn btn-ghost">
                Support & cases
              </Link>
            </div>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <p className="eyebrow mb-2">What help do you need?</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Topic">
                {TOPICS.map((t) => {
                  const active = topic === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTopic(t)}
                      className={
                        active
                          ? "rounded-full border border-accent bg-accent-soft px-3 py-1.5 text-sm font-semibold"
                          : "muted rounded-full border border-line px-3 py-1.5 text-sm hover:border-accent"
                      }
                      aria-pressed={active}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label="A little more detail" id="reason">
              <TextInput
                id="reason"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="What should they focus on?"
                required
                minLength={3}
              />
            </Field>

            <div>
              <p className="eyebrow mb-2">When do you hope for a response?</p>
              <div className="space-y-2" role="radiogroup" aria-label="Response expectation">
                {EXPECTATIONS.map((ex) => (
                  <label
                    key={ex.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3"
                  >
                    <input
                      type="radio"
                      name="expectation"
                      checked={expectation === ex.id}
                      onChange={() => setExpectation(ex.id)}
                    />
                    <span className="text-sm font-medium">{ex.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {error ? (
              <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}

            <Button type="submit" variant="accent" className="w-full" disabled={busy}>
              {busy ? "Sending…" : "Request human review"}
            </Button>
          </form>
        )}
      </Panel>
    </main>
  );
}
