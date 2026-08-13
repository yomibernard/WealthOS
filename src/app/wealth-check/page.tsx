"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button, Panel, ProgressBar } from "@/components/ui";
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
};

const STEPS: Step[] = [
  {
    key: "goal",
    prompt: "What would you most like your money to achieve?",
    placeholder: "e.g. Retire comfortably and fund my children's education",
  },
  {
    key: "age",
    prompt: "How old are you?",
    placeholder: "42",
  },
  {
    key: "income",
    prompt: "Roughly, what is your monthly income in Naira?",
    placeholder: "4500000",
  },
  {
    key: "expenses",
    prompt: "Roughly, what do you spend each month?",
    placeholder: "2500000",
  },
  {
    key: "cash",
    prompt: "How much do you hold in bank/savings (₦)?",
    placeholder: "8000000",
  },
  {
    key: "property",
    prompt: "Estimated value of property you own (₦)?",
    placeholder: "95000000",
    optional: true,
  },
  {
    key: "investments",
    prompt: "Estimated investments — funds, stocks, T-bills (₦)?",
    placeholder: "20000000",
    optional: true,
  },
  {
    key: "debt",
    prompt: "Total debts or loans outstanding (₦)?",
    placeholder: "15000000",
    optional: true,
  },
];

export default function WealthCheckPage() {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const step = STEPS[idx];
  const completeness = Math.round(((idx + (done ? 1 : 0)) / STEPS.length) * 100);

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
    if (!skip && !answers[step.key]?.trim() && !step.optional) return;
    if (idx >= STEPS.length - 1) setDone(true);
    else setIdx((i) => i + 1);
  }

  if (done && result) {
    return (
      <main className="page py-8">
        <p className="eyebrow">Your Wealth Check</p>
        <h1 className="font-display mt-2 text-3xl">Useful clarity — before any product push</h1>
        <Panel className="mt-5 animate-rise space-y-3">
          <p className="eyebrow">Estimated net worth</p>
          <p className="font-display text-4xl">{formatNaira(result.nw.netWorthNgn, true)}</p>
          <p className="muted text-sm">
            Confidence ~{Math.round(result.nw.confidence * 100)}% · based on what you shared
          </p>
        </Panel>
        <Panel className="mt-3 animate-rise-delay">
          <p className="eyebrow">Wealth Health</p>
          <p className="font-display mt-1 text-3xl">{result.health.overall} / 100</p>
          <p className="muted mt-2 text-sm">{result.health.improvementLevers[0]}</p>
        </Panel>
        <Panel className="mt-3">
          <p className="eyebrow">Needs your attention</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            {result.actions.slice(0, 3).map((a) => (
              <li key={a.actionType}>{a.title}</li>
            ))}
          </ol>
          {result.goal ? (
            <p className="muted mt-3 text-sm">You said your money should help with: {result.goal}</p>
          ) : null}
        </Panel>
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
      <h1 className="font-display mt-2 text-3xl">A guided conversation — not a 19-page form</h1>
      <div className="mt-4">
        <ProgressBar value={completeness} label={`Financial Profile ${completeness}% complete`} />
      </div>
      <Panel className="mt-6 animate-rise">
        <p className="text-lg leading-relaxed">{step.prompt}</p>
        <textarea
          className="mt-4 min-h-28 w-full rounded-xl border border-line bg-white p-3"
          placeholder={step.placeholder}
          value={answers[step.key] ?? ""}
          onChange={(e) => setAnswers((a) => ({ ...a, [step.key]: e.target.value }))}
          aria-label={step.prompt}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="accent" onClick={() => next(false)}>
            Continue
          </Button>
          {step.optional ? (
            <Button type="button" variant="ghost" onClick={() => next(true)}>
              Skip for now
            </Button>
          ) : null}
        </div>
      </Panel>
      <p className="muted mt-4 text-sm">
        You can skip non-critical sections and return later once you create an account.
      </p>
    </main>
  );
}

function num(v?: string) {
  if (!v) return 0;
  return Number(String(v).replace(/,/g, "")) || 0;
}
