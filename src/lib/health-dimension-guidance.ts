/** Copy helpers for Wealth Health dimension detail — grounded in engine keys, not invented scores. */

export type DimensionGuidance = {
  whyMatters: string;
  whatGoodLooksLike: string;
  recommendedActions: string[];
};

const GUIDANCE: Record<string, DimensionGuidance> = {
  liquidity: {
    whyMatters:
      "Cash runway determines how calmly you can absorb shocks before selling longer-term assets.",
    whatGoodLooksLike: "Typically 3–6+ months of essential expenses in high-liquidity holdings.",
    recommendedActions: [
      "Confirm cash and near-cash balances",
      "Review spending that drains the reserve",
      "See next-best actions before buying products",
    ],
  },
  savings: {
    whyMatters: "A steady surplus funds goals and rebuilds liquidity after life events.",
    whatGoodLooksLike: "A positive savings rate that is sustainable for your income and dependants.",
    recommendedActions: [
      "Refresh income and expense entries",
      "Link surplus to a named goal",
      "Avoid product pitches until the rate is clear",
    ],
  },
  debt: {
    whyMatters: "High-cost or concentrated debt can erase gains elsewhere in the Wealth Graph.",
    whatGoodLooksLike: "Manageable balances with clear repayment paths and no surprise interest drag.",
    recommendedActions: [
      "Update loan balances and rates",
      "Prioritise high-interest lines if the engines surface them",
      "Ask WealthAI to explain — not invent — debt maths",
    ],
  },
  diversification: {
    whyMatters: "Concentration in one asset class or currency amplifies single-point risk.",
    whatGoodLooksLike: "No single class dominates to the point it crowds out resilience.",
    recommendedActions: [
      "Review allocation and currency exposure",
      "Refresh stale valuations on the largest holding",
      "Consider diversification only after diagnosis",
    ],
  },
  goalReadiness: {
    whyMatters: "Goals turn net worth into a plan — underfunded targets need attention, not products first.",
    whatGoodLooksLike: "Named goals with realistic funding progress against your timeline.",
    recommendedActions: [
      "Update goal targets and contributions",
      "Run a scenario before changing contributions",
      "Open recommendations only after diagnosis",
    ],
  },
  protection: {
    whyMatters: "Protection gaps can force fire-sales of productive assets when life events hit.",
    whatGoodLooksLike: "Appropriate life/health cover for dependants and income risk — not over-insured.",
    recommendedActions: [
      "Record existing cover honestly",
      "Review dependants and income replacement needs",
      "Seek advice before buying new policies",
    ],
  },
  retirement: {
    whyMatters: "Retirement readiness needs time and funding — waiting quietly is sometimes valid.",
    whatGoodLooksLike: "A credible path toward your retirement target without forcing unsuitable products.",
    recommendedActions: [
      "Confirm pension and long-horizon allocations",
      "Pressure-test retirement age in scenarios",
      "NBFA may recommend doing nothing if urgency is low",
    ],
  },
  estate: {
    whyMatters: "Estate readiness protects people you care for when you cannot act.",
    whatGoodLooksLike: "Beneficiaries and key documents are recorded and current.",
    recommendedActions: [
      "Confirm beneficiary information",
      "Note estate documents you already hold",
      "Use Support if you need human help — queues stay open properly",
    ],
  },
};

export function getDimensionGuidance(key: string): DimensionGuidance {
  return (
    GUIDANCE[key] ?? {
      whyMatters: "This dimension contributes to your governed Wealth Health score.",
      whatGoodLooksLike: "A stronger score with clear data coverage — never a peer ranking.",
      recommendedActions: [
        "Refresh related holdings",
        "Review next-best financial actions",
        "Open the full Wealth Health overview",
      ],
    }
  );
}
