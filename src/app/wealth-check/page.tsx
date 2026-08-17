"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ActionCard, Button, InsightPanel, Panel, ProgressBar } from "@/components/ui";
import { formatNaira } from "@/lib/format";
import { calculateNetWorth } from "@/engines/net-worth";
import { calculateWealthHealth } from "@/engines/wealth-health";
import { topActions } from "@/engines/nbfa";

const FX = [
  {
    from: "USD",
    to: "NGN",
    rate: 1600,
    asOf: new Date(),
    source: "demo",
  },
];

type Step = {
  key: string;
  prompt: string;
  placeholder: string;
  optional?: boolean;
  helper?: string;
};

type Stage = {
  id: string;
  title: string;
  lead: string;
  steps: Step[];
};

const STAGES: Stage[] = [
  {
    id: "achieve",
    title: "What money should achieve",
    lead: "Start with purpose — not product lists.",
    steps: [
      {
        key: "goal",
        prompt: "What would you most like your money to achieve?",
        placeholder: "e.g. Retire comfortably and fund my children's education",
        helper: "This shapes goals and attention later — not a product pitch.",
      },
      {
        key: "age",
        prompt: "How old are you?",
        placeholder: "42",
        helper: "Helps frame retirement and protection horizons.",
      },
      {
        key: "income",
        prompt: "Roughly, what is your monthly income in Naira?",
        placeholder: "4500000",
        helper: "Used for savings rate and health estimates.",
      },
      {
        key: "expenses",
        prompt: "Roughly, what do you spend each month?",
        placeholder: "2500000",
        helper: "Used for emergency cover and cash runway.",
      },
    ],
  },
  {
    id: "own",
    title: "What you own",
    lead: "Rough estimates are fine — confidence stays labelled.",
    steps: [
      {
        key: "cash",
        prompt: "How much do you hold in bank/savings (₦)?",
        placeholder: "8000000",
        helper: "Cash is the backbone of liquidity checks.",
      },
      {
        key: "property",
        prompt: "Estimated value of property you own (₦)?",
        placeholder: "95000000",
        optional: true,
        helper: "Optional — skip if you are unsure.",
      },
      {
        key: "investments",
        prompt: "Estimated investments — funds, stocks, T-bills (₦)?",
        placeholder: "20000000",
        optional: true,
        helper: "Optional — you can refine this after you create an account.",
      },
    ],
  },
  {
    id: "owe",
    title: "What you owe",
    lead: "Liabilities matter as much as assets for a true picture.",
    steps: [
      {
        key: "debt",
        prompt: "Total debts or loans outstanding (₦)?",
        placeholder: "15000000",
        optional: true,
        helper: "Include mortgages, personal loans, and credit — or skip for now.",
      },
    ],
  },
];

const FLAT_STEPS = STAGES.flatMap((stage, stageIndex) =>
  stage.steps.map((step) => ({ ...step, stageIndex })),
);

export default function WealthCheckPage() {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const current = FLAT_STEPS[idx];
  const stage = STAGES[current.stageIndex];
  const stageStepIndex = stage.steps.findIndex((s) => s.key === current.key);
  const completeness = Math.round(((idx + (done ? 1 : 0)) / FLAT_STEPS.length) * 100);

  const result = useMemo(() => {
    if (!done) return null;
    const cash = num(answers.cash);
    const property = num(answers.property);
    const investments = num(answers.investments);
    const debt = num(answers.debt);
    const income = num(answers.income);
    const expenses = num(answers.expenses);

    const assets = [
      {
        id: "cash",
        value: cash,
        currency: "NGN",
        ownershipPercent: 100,
        confidence: 0.8,
        lastValuationDate: new Date(),
        verificationStatus: "ESTIMATED",
        category: "CASH",
      },
      {
        id: "property",
        value: property,
        currency: "NGN",
        ownershipPercent: 100,
        confidence: 0.6,
        lastValuationDate: new Date(),
        verificationStatus: "ESTIMATED",
        category: "PROPERTY",
      },
      {
        id: "inv",
        value: investments,
        currency: "NGN",
        ownershipPercent: 100,
        confidence: 0.75,
        lastValuationDate: new Date(),
        verificationStatus: "ESTIMATED",
        category: "INVESTMENT",
      },
    ].filter((a) => a.value > 0);

    const liabilities =
      debt > 0
        ? [
            {
              id: "debt",
              balance: debt,
              currency: "NGN",
              ownershipPercent: 100,
              confidence: 0.8,
              lastValuationDate: new Date(),
            },
          ]
        : [];

    const nw = calculateNetWorth(assets, liabilities, FX);
    const health = calculateWealthHealth({
      liquidAssetsNgn: cash,
      monthlyExpensesNgn: expenses || 1,
      monthlySavingsNgn: Math.max(0, income - expenses),
      monthlyIncomeNgn: income,
      totalDebtNgn: debt,
      totalAssetsNgn: nw.totalAssetsNgn,
      largestAssetClassPercent: nw.assetBreakdown[0]?.percent ?? 0,
      goalProgressAvg: 45,
      hasLifeInsurance: false,
      hasHealthInsurance: false,
      retirementAllocationNgn: 0,
      retirementTargetNgn: Math.max(nw.netWorthNgn * 2, 100_000_000),
      hasBeneficiaryInfo: false,
      hasEstateDocs: false,
      dataCoverage: 0.55,
    });
    const actions = topActions({
      emergencyMonths: expenses > 0 ? cash / expenses : 0,
      propertyPercent: nw.assetBreakdown.find((b) => b.category === "PROPERTY")?.percent ?? 0,
      idleCashNgn: Math.max(0, cash - expenses * 3),
      highInterestDebtNgn: debt > 0 ? debt * 0.4 : 0,
      staleAssetCount: 0,
      hasLifeInsurance: false,
      goalUnderfundedCount: 1,
      ngnExposurePercent: 100,
      vulnerableFlag: false,
      dataConfidence: nw.confidence,
    });

    return { nw, health, actions, goal: answers.goal };
  }, [done, answers]);

  function next(skip = false) {
    if (!skip && !answers[current.key]?.trim() && !current.optional) return;
    if (idx >= FLAT_STEPS.length - 1) setDone(true);
    else setIdx((i) => i + 1);
  }

  if (done && result) {
    const observations = result.actions.slice(0, 3);
    return (
      <main className="page py-8">
        <p className="eyebrow">Stage 4 · First wealth picture</p>
        <h1 className="font-display mt-2 text-3xl">Useful clarity — before any product push</h1>
        <p className="muted mt-2 max-w-xl text-sm leading-relaxed">
          Engines calculated these estimates from what you shared. Nothing here recommends a product.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Panel className="animate-rise space-y-2">
            <p className="eyebrow">Estimated net worth</p>
            <p className="font-display text-4xl">{formatNaira(result.nw.netWorthNgn, true)}</p>
            <p className="muted text-sm">
              Confidence ~{Math.round(result.nw.confidence * 100)}% · based on what you shared
            </p>
          </Panel>
          <Panel className="animate-rise-delay space-y-2">
            <p className="eyebrow">Preliminary Wealth Health</p>
            <p className="font-display text-4xl">{result.health.overall} / 100</p>
            <p className="muted text-sm">{result.health.improvementLevers[0]}</p>
          </Panel>
        </div>

        <ActionCard className="mt-4">
          <p className="eyebrow">Three plain observations</p>
          <ol className="mt-3 list-decimal space-y-3 pl-5">
            {observations.map((a) => (
              <li key={a.actionType}>
                <span className="font-semibold">{a.title}</span>
                {a.why ? <p className="muted mt-1 text-sm leading-relaxed">{a.why}</p> : null}
              </li>
            ))}
          </ol>
          {result.goal ? (
            <p className="muted mt-4 text-sm">You said your money should help with: {result.goal}</p>
          ) : null}
        </ActionCard>

        <InsightPanel className="mt-4" eyebrow="Next">
          Save this check to continue with consent and a fuller profile — still diagnosis before products.
        </InsightPanel>

        <div className="mt-6 space-y-3">
          <Link href="/auth/sign-up" className="btn btn-accent w-full">
            Save my Wealth Check
          </Link>
          <Link href="/auth/sign-in" className="btn btn-ghost w-full">
            Sign in to continue
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page py-8">
      <p className="eyebrow">Wealth Check</p>
      <h1 className="font-display mt-2 text-3xl">A guided conversation — not a long form</h1>

      <nav className="wc-stages mt-5" aria-label="Wealth Check stages">
        {STAGES.map((s, i) => {
          const active = i === current.stageIndex;
          const complete = i < current.stageIndex;
          return (
            <div
              key={s.id}
              className={`wc-stage ${active ? "is-active" : ""} ${complete ? "is-complete" : ""}`}
            >
              <span className="wc-stage-num" aria-hidden="true">
                {i + 1}
              </span>
              <span className="wc-stage-label">{s.title}</span>
            </div>
          );
        })}
        <div className="wc-stage wc-stage-reveal">
          <span className="wc-stage-num" aria-hidden="true">
            4
          </span>
          <span className="wc-stage-label">First wealth picture</span>
        </div>
      </nav>

      <div className="mt-4">
        <ProgressBar
          value={completeness}
          label={`${stage.title} · step ${stageStepIndex + 1} of ${stage.steps.length}`}
        />
      </div>

      <Panel className="mt-6 animate-rise">
        <p className="eyebrow">{stage.title}</p>
        <p className="muted mt-1 text-sm">{stage.lead}</p>
        <p className="mt-4 text-lg leading-relaxed">{current.prompt}</p>
        {current.helper ? <p className="muted mt-2 text-sm">{current.helper}</p> : null}
        <textarea
          className="mt-4 min-h-28 w-full rounded-xl border border-line bg-white p-3"
          placeholder={current.placeholder}
          value={answers[current.key] ?? ""}
          onChange={(e) => setAnswers((a) => ({ ...a, [current.key]: e.target.value }))}
          aria-label={current.prompt}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="accent" onClick={() => next(false)}>
            Continue
          </Button>
          {current.optional ? (
            <Button type="button" variant="ghost" onClick={() => next(true)}>
              Skip for now
            </Button>
          ) : null}
        </div>
      </Panel>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="muted text-sm">Optional fields can wait — save progress when you are ready.</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/auth/sign-up" className="btn btn-ghost text-sm">
            Save later
          </Link>
          <Link href="/auth/sign-in" className="btn btn-ghost text-sm">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}

function num(v?: string) {
  if (!v) return 0;
  return Number(String(v).replace(/,/g, "")) || 0;
}
