"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Field,
  InsightPanel,
  PageHeader,
  Panel,
  TextInput,
} from "@/components/ui";
import {
  CareUpdateReceiptList,
  type CareUpdateRow,
} from "@/components/CareUpdateReceiptList";

type CaseRow = {
  id: string;
  level: string;
  reason: string;
  status: string;
  createdAt: string;
  resolution: string | null;
};

const HELP_CATEGORIES = [
  {
    id: "product" as const,
    label: "Product help",
    hint: "Something in WealthOS is unclear or stuck.",
  },
  {
    id: "account" as const,
    label: "Account & access",
    hint: "Sign-in, security, or profile issues.",
  },
  {
    id: "data" as const,
    label: "Data & connections",
    hint: "Sync, confidence, or missing balances.",
  },
  {
    id: "complaint" as const,
    label: "Formal complaint",
    hint: "We never hide this path — labelled for the ops queue.",
  },
];

export default function SupportPage() {
  const [helpCategory, setHelpCategory] =
    useState<(typeof HELP_CATEGORIES)[number]["id"]>("product");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [careUpdates, setCareUpdates] = useState<CareUpdateRow[]>([]);

  const isComplaint = helpCategory === "complaint";
  const category: "support" | "complaint" = isComplaint ? "complaint" : "support";

  async function load() {
    const [casesRes, careRes] = await Promise.all([
      fetch("/api/escalations"),
      fetch("/api/care-updates?list=1"),
    ]);
    if (casesRes.ok) setCases(await casesRes.json());
    if (careRes.ok) {
      const data = (await careRes.json()) as { items?: CareUpdateRow[] };
      setCareUpdates(
        (data.items ?? []).filter(
          (i) => i.href === "/app/support" || !/privacy/i.test(i.title),
        ),
      );
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    const prefix =
      helpCategory === "product"
        ? "Product help"
        : helpCategory === "account"
          ? "Account & access"
          : helpCategory === "data"
            ? "Data & connections"
            : null;
    const bodyReason = prefix ? `[${prefix}] ${reason}` : reason;
    const res = await fetch("/api/escalations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: bodyReason,
        category,
        level: "L2_SUPPORT",
      }),
    });
    if (!res.ok) {
      setMessage("We could not submit that right now. Please try again.");
      return;
    }
    setReason("");
    setMessage(
      isComplaint
        ? "Complaint logged. Operations will review under our complaints process."
        : "Support request received. A specialist can pick this up from the queue.",
    );
    await load();
  }

  return (
    <main>
      <PageHeader
        title="Support & complaints"
        subtitle="Care when you need a person — not a ticketing factory. Complaints stay visible."
      />

      <InsightPanel eyebrow="How can we help?">
        Start with care updates and open cases. Open a new case when AI confidence is low, something
        went wrong, or you want a human on it. Marking a care update as seen never closes the ops
        queue.
      </InsightPanel>

      <Panel className="mb-4 mt-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold">Recent care updates</p>
          {careUpdates.length ? <Badge>{careUpdates.length}</Badge> : null}
        </div>
        <p className="muted text-sm">
          Your adviser sent these acknowledgments. Mark as seen when you have read them — that does
          not close the ops queue.
        </p>
        <CareUpdateReceiptList
          items={careUpdates}
          onChanged={load}
          emptyHint="No recent support care updates."
        />
      </Panel>

      <Panel className="mb-4 space-y-3">
        <p className="font-semibold">Open a case</p>
        <p className="muted text-sm">
          Choose a category. Formal complaints are labelled for the ops queue and are never hidden.
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Help category">
          {HELP_CATEGORIES.map((c) => {
            const active = helpCategory === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setHelpCategory(c.id)}
                className={
                  active
                    ? "rounded-full border border-accent bg-accent-soft px-3 py-1.5 text-sm font-semibold"
                    : "muted rounded-full border border-line px-3 py-1.5 text-sm hover:border-accent"
                }
                aria-pressed={active}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        <p className="muted text-sm">
          {HELP_CATEGORIES.find((c) => c.id === helpCategory)?.hint}
        </p>
        <form className="space-y-3" onSubmit={onSubmit}>
          <Field label="What happened?" id="reason">
            <TextInput
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Short description — we attach your Wealth Graph summary"
              required
            />
          </Field>
          <Button type="submit" variant="accent" className="w-full">
            {isComplaint ? "Submit formal complaint" : "Submit to L2 support"}
          </Button>
        </form>
        {message ? <p className="mt-2 text-sm">{message}</p> : null}
      </Panel>

      <Panel className="mb-4 space-y-3">
        <p className="font-semibold">Other paths</p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>L0 Self-service — Privacy Centre, digests, confidence fixes</li>
          <li>L1 WealthAI — in-product guidance with deterministic tools</li>
          <li>L2 Support specialist — this page</li>
          <li>L3 Regulated financial adviser</li>
        </ul>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/app/adviser-request" className="btn btn-soft flex-1 text-center">
            Escalate to an adviser (L3)
          </Link>
          <Link href="/app/privacy" className="btn btn-soft flex-1 text-center">
            Privacy & data export
          </Link>
          <Link href="/app/inbox" className="btn btn-ghost flex-1 text-center">
            Wealth Inbox
          </Link>
        </div>
      </Panel>

      <div className="space-y-3">
        <p className="eyebrow">Case status & history</p>
        {cases.length === 0 ? (
          <Panel>
            <p className="muted text-sm">No open or recent cases yet.</p>
          </Panel>
        ) : (
          cases.map((c) => (
            <Panel key={c.id}>
              <div className="flex flex-wrap gap-2">
                <Badge>{c.level}</Badge>
                <Badge tone={c.status === "open" ? "warn" : "default"}>{c.status}</Badge>
                {c.reason.startsWith("COMPLAINT:") ? <Badge tone="warn">Complaint</Badge> : null}
              </div>
              <p className="mt-2 text-sm font-medium">{c.reason}</p>
              {c.resolution ? (
                <p className="mt-1 text-sm">
                  <span className="font-medium">Update:</span> {c.resolution}
                </p>
              ) : null}
              <p className="muted mt-1 text-xs">
                {new Date(c.createdAt).toLocaleString("en-GB")} · {c.id.slice(0, 8)}
              </p>
            </Panel>
          ))
        )}
      </div>
    </main>
  );
}
