/**
 * Adviser portfolio care radar — rank customers by open care load.
 */

export type PortfolioCustomerInput = {
  id: string;
  name: string;
  email: string;
  profileCompleteness: number;
  openEscalations: number;
  openComplaints: number;
  openPrivacy: number;
};

export type PortfolioCustomerRow = PortfolioCustomerInput & {
  careCount: number;
  openSupport: number;
  careTone: "ok" | "warn" | "danger";
  careLabel: string;
  sortScore: number;
};

export type PortfolioCareFilter =
  | "all"
  | "care"
  | "complaints"
  | "privacy"
  | "support";

export const PORTFOLIO_CARE_FILTERS: PortfolioCareFilter[] = [
  "all",
  "care",
  "complaints",
  "privacy",
  "support",
];

export type PortfolioCareRadar = {
  customerCount: number;
  withCareCount: number;
  totalComplaints: number;
  totalPrivacy: number;
  totalSupport: number;
  summary: string;
  customers: PortfolioCustomerRow[];
};

export function scorePortfolioCare(input: PortfolioCustomerInput): PortfolioCustomerRow {
  const openSupport = Math.max(0, input.openEscalations - input.openComplaints);
  const careCount = input.openEscalations + input.openPrivacy;
  const sortScore =
    input.openComplaints * 10 + input.openPrivacy * 5 + input.openEscalations * 2;

  let careTone: "ok" | "warn" | "danger" = "ok";
  let careLabel = "Clear";
  if (input.openComplaints > 0) {
    careTone = "danger";
    careLabel = `${input.openComplaints} complaint${input.openComplaints === 1 ? "" : "s"}`;
  } else if (input.openPrivacy > 0) {
    careTone = "warn";
    careLabel = `${input.openPrivacy} privacy`;
  } else if (input.openEscalations > 0) {
    careTone = "warn";
    careLabel = `${input.openEscalations} case${input.openEscalations === 1 ? "" : "s"}`;
  }

  return {
    ...input,
    careCount,
    openSupport,
    careTone,
    careLabel,
    sortScore,
  };
}

export function parsePortfolioCareFilter(raw: string | undefined | null): PortfolioCareFilter {
  if (raw && (PORTFOLIO_CARE_FILTERS as string[]).includes(raw)) {
    return raw as PortfolioCareFilter;
  }
  return "all";
}

export function customerMatchesCareFilter(
  row: PortfolioCustomerRow,
  filter: PortfolioCareFilter,
): boolean {
  switch (filter) {
    case "care":
      return row.careCount > 0;
    case "complaints":
      return row.openComplaints > 0;
    case "privacy":
      return row.openPrivacy > 0;
    case "support":
      return row.openSupport > 0;
    case "all":
    default:
      return true;
  }
}

export function filterPortfolioCareRadar(
  radar: PortfolioCareRadar,
  filter: PortfolioCareFilter,
): PortfolioCareRadar {
  if (filter === "all") return radar;

  const customers = radar.customers.filter((r) => customerMatchesCareFilter(r, filter));
  const withCareCount = customers.filter((r) => r.careCount > 0).length;
  const totalComplaints = customers.reduce((n, r) => n + r.openComplaints, 0);
  const totalPrivacy = customers.reduce((n, r) => n + r.openPrivacy, 0);
  const totalSupport = customers.reduce((n, r) => n + r.openSupport, 0);

  const labels: Record<Exclude<PortfolioCareFilter, "all">, string> = {
    care: "needing care",
    complaints: "with open complaints",
    privacy: "with open privacy requests",
    support: "with routine support cases",
  };

  let summary: string;
  if (customers.length === 0) {
    summary = `No customers ${labels[filter]} in your book.`;
  } else {
    summary = `Showing ${customers.length} of ${radar.customerCount} customer(s) ${labels[filter]}.`;
  }

  return {
    customerCount: radar.customerCount,
    withCareCount,
    totalComplaints,
    totalPrivacy,
    totalSupport,
    summary,
    customers,
  };
}

export function buildPortfolioCareRadar(
  customers: PortfolioCustomerInput[],
): PortfolioCareRadar {
  const rows = customers.map(scorePortfolioCare).sort((a, b) => {
    if (b.sortScore !== a.sortScore) return b.sortScore - a.sortScore;
    return a.name.localeCompare(b.name);
  });

  const withCareCount = rows.filter((r) => r.careCount > 0).length;
  const totalComplaints = rows.reduce((n, r) => n + r.openComplaints, 0);
  const totalPrivacy = rows.reduce((n, r) => n + r.openPrivacy, 0);
  const totalSupport = rows.reduce((n, r) => n + r.openSupport, 0);

  let summary: string;
  if (rows.length === 0) {
    summary = "No customers linked yet.";
  } else if (withCareCount === 0) {
    summary = "Care queues look clear across your book.";
  } else if (totalComplaints > 0) {
    summary = `${withCareCount} customer(s) need care — ${totalComplaints} open complaint(s) first.`;
  } else {
    summary = `${withCareCount} customer(s) have open support or privacy items.`;
  }

  return {
    customerCount: rows.length,
    withCareCount,
    totalComplaints,
    totalPrivacy,
    totalSupport,
    summary,
    customers: rows,
  };
}
