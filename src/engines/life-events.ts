/**
 * Life-event automation engine v1.0
 * Maps material life changes to planning checklists and inbox drafts — not auto-execution.
 */

export const LIFE_EVENT_ENGINE_VERSION = "life-event-1.0";

export type LifeEventAutomation = {
  checklist: string[];
  inboxDrafts: Array<{
    category: string;
    priority: string;
    title: string;
    body: string;
    href: string;
  }>;
  planningHints: string[];
  memoryNote: string;
  narrative: string;
  engineVersion: string;
  disclaimer: string;
};

const BASE_DISCLAIMER =
  "Automation suggests reviews only. Nothing is invested, insured, or filed without your consent.";

export function automateLifeEvent(
  type: string,
  label: string,
  notes?: string | null,
): LifeEventAutomation {
  const noteSuffix = notes?.trim() ? ` Notes: ${notes.trim()}` : "";
  const memoryNote = `${label} (${type}).${noteSuffix}`;

  switch (type) {
    case "job_change":
      return pack({
        memoryNote,
        checklist: [
          "Update income and emergency-fund target",
          "Review life and health cover versus new income",
          "Revisit retirement / RSA contribution rate",
          "Confirm employer benefits and vesting",
        ],
        inboxDrafts: [
          {
            category: "life_event",
            priority: "important",
            title: "Job change — refresh cash flow",
            body: `${label}: update income/expenses so Wealth Health and NBFA stay accurate.`,
            href: "/app/cashflow",
          },
          {
            category: "life_event",
            priority: "advisory",
            title: "Review protection after job change",
            body: "Check recorded insurance against new income and dependants.",
            href: "/app/insurance",
          },
        ],
        planningHints: ["Income shock resilience", "Benefit continuity"],
        narrative:
          "A job change usually changes surplus, emergency months, and protection needs before product choice.",
      });

    case "new_dependant":
      return pack({
        memoryNote,
        checklist: [
          "Add dependant in Household",
          "Review life cover heuristic versus income",
          "Create or refresh education goal",
          "Update will / beneficiary intentions (estate lite)",
        ],
        inboxDrafts: [
          {
            category: "life_event",
            priority: "important",
            title: "New dependant — protection review",
            body: `${label}: confirm household, life cover, and education funding assumptions.`,
            href: "/app/insurance",
          },
          {
            category: "life_event",
            priority: "advisory",
            title: "Update estate intentions",
            body: "Record or refresh will / beneficiary notes for dependants.",
            href: "/app/estate",
          },
        ],
        planningHints: ["Education funding", "Life cover adequacy"],
        narrative:
          "New dependants raise protection and long-horizon goal priority — confirm before new investing.",
      });

    case "property_purchase":
      return pack({
        memoryNote,
        checklist: [
          "Add property asset and any mortgage",
          "Check concentration and LTV in Property intelligence",
          "Confirm buildings insurance is recorded",
          "Reassess liquidity after deposit / fees",
        ],
        inboxDrafts: [
          {
            category: "life_event",
            priority: "important",
            title: "Property purchase — update Wealth Graph",
            body: `${label}: add the asset, mortgage, and refresh property intelligence.`,
            href: "/app/property",
          },
        ],
        planningHints: ["Liquidity after purchase", "Concentration risk"],
        narrative:
          "Buying property reallocates liquidity into an illiquid asset — update the graph before new commitments.",
      });

    case "relocation":
      return pack({
        memoryNote,
        checklist: [
          "Update country / residency assumptions in profile notes",
          "Review FX exposure and foreign accounts",
          "Re-check open-banking connections",
          "Confirm tax / pension access implications with a human adviser",
        ],
        inboxDrafts: [
          {
            category: "life_event",
            priority: "important",
            title: "Relocation — currency and connections",
            body: `${label}: review FX exposure, pensions, and bank connections.`,
            href: "/app/connections",
          },
        ],
        planningHints: ["Cross-border cash", "Pension access rules"],
        narrative:
          "Relocation often changes FX, banking rails, and pension access — WealthOS flags reviews, not legal advice.",
      });

    case "inheritance":
      return pack({
        memoryNote,
        checklist: [
          "Add inherited assets with provenance ESTIMATED until verified",
          "Park unexpected offers in WealthGuard before acting",
          "Update estate / will after receipt",
          "Avoid rushing into high-risk products with windfall cash",
        ],
        inboxDrafts: [
          {
            category: "life_event",
            priority: "important",
            title: "Inheritance — record assets carefully",
            body: `${label}: add holdings with clear provenance; do not skip suitability.`,
            href: "/app/wealth/add",
          },
          {
            category: "life_event",
            priority: "advisory",
            title: "Scan unfamiliar inheritance offers",
            body: "Use WealthGuard before acting on unsolicited investment pitches.",
            href: "/app/wealthguard",
          },
        ],
        planningHints: ["Windfall sequencing", "Estate update"],
        narrative:
          "Inheritances are high-emotion moments. Record assets first; suitability still applies before investing.",
      });

    case "business_event":
      return pack({
        memoryNote,
        checklist: [
          "Update business valuation / ownership",
          "Review business facilities and personal guarantees",
          "Separate operating cash from personal emergency fund",
          "Check estate / succession notes",
        ],
        inboxDrafts: [
          {
            category: "life_event",
            priority: "important",
            title: "Business event — refresh business intelligence",
            body: `${label}: update equity, debt, and income dependency views.`,
            href: "/app/business",
          },
        ],
        planningHints: ["Personal vs business liquidity", "Succession"],
        narrative:
          "Business changes can dominate personal net worth — refresh valuations and facilities promptly.",
      });

    case "job_loss":
      return pack({
        memoryNote,
        checklist: [
          "Switch plan mode to liquidity preservation",
          "Pause discretionary investing recommendations",
          "Map runway from cash + expenses",
          "Review high-interest debt payments",
        ],
        inboxDrafts: [
          {
            category: "life_event",
            priority: "critical",
            title: "Income pause — protect runway",
            body: `${label}: prioritise cash-flow and emergency months over new risk.`,
            href: "/app/cashflow",
          },
        ],
        planningHints: ["Runway", "Debt triage"],
        narrative:
          "Job loss should shift WealthOS toward stability: liquidity first, then goals — not product pushes.",
      });

    case "marriage":
      return pack({
        memoryNote,
        checklist: [
          "Update household members",
          "Align beneficiary nominations",
          "Review joint vs separate accounts in Wealth Graph",
          "Refresh estate / will intentions",
        ],
        inboxDrafts: [
          {
            category: "life_event",
            priority: "important",
            title: "Marriage — household and estate",
            body: `${label}: update household, beneficiaries, and estate checklist.`,
            href: "/app/estate",
          },
        ],
        planningHints: ["Joint goals", "Beneficiary alignment"],
        narrative:
          "Marriage is a planning trigger for household, beneficiaries, and shared goals — not automatic product switches.",
      });

    default:
      return pack({
        memoryNote,
        checklist: [
          "Confirm Wealth Graph still reflects reality",
          "Note the event for your next adviser conversation",
        ],
        inboxDrafts: [
          {
            category: "life_event",
            priority: "advisory",
            title: "Life event recorded",
            body: `${label}: review goals and recommendations when ready.`,
            href: "/app/actions",
          },
        ],
        planningHints: ["General review"],
        narrative: "Event captured. Use the checklist to decide what to update next.",
      });
  }
}

function pack(input: {
  memoryNote: string;
  checklist: string[];
  inboxDrafts: LifeEventAutomation["inboxDrafts"];
  planningHints: string[];
  narrative: string;
}): LifeEventAutomation {
  return {
    ...input,
    engineVersion: LIFE_EVENT_ENGINE_VERSION,
    disclaimer: BASE_DISCLAIMER,
  };
}
