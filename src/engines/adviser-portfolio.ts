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
  careTone: "ok" | "warn" | "danger";
  careLabel: string;
  sortScore: number;
};

export type PortfolioCareRadar = {
  customerCount: number;
  withCareCount: number;
  totalComplaints: number;
  totalPrivacy: number;
  summary: string;
  customers: PortfolioCustomerRow[];
};

export function scorePortfolioCare(input: PortfolioCustomerInput): PortfolioCustomerRow {
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
    careTone,
    careLabel,
    sortScore,
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
    summary,
    customers: rows,
  };
}
