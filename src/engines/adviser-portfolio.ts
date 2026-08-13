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
  lastCareAckAt?: string | null;
  /** Shared care_ack notes not yet marked seen by the customer */
  unseenCareAckCount?: number;
};

export type PortfolioCustomerRow = PortfolioCustomerInput & {
  careCount: number;
  openSupport: number;
  careTone: "ok" | "warn" | "danger";
  careLabel: string;
  ackCue: string;
  needsFirstAck: boolean;
  awaitingReceipt: boolean;
  sortScore: number;
};

export type PortfolioCareFilter =
  | "all"
  | "care"
  | "complaints"
  | "privacy"
  | "support"
  | "unacked"
  | "awaiting";

export const PORTFOLIO_CARE_FILTERS: PortfolioCareFilter[] = [
  "all",
  "care",
  "complaints",
  "privacy",
  "support",
  "unacked",
  "awaiting",
];

export type PortfolioCareRadar = {
  customerCount: number;
  withCareCount: number;
  unackedCareCount: number;
  awaitingReceiptCount: number;
  totalComplaints: number;
  totalPrivacy: number;
  totalSupport: number;
  summary: string;
  customers: PortfolioCustomerRow[];
};

export function formatCareAckCue(
  lastCareAckAt: string | null | undefined,
  now = new Date(),
  awaitingReceipt = false,
): string {
  if (!lastCareAckAt) return "No care ack yet";
  const then = new Date(lastCareAckAt);
  if (Number.isNaN(then.getTime())) return "No care ack yet";
  const days = Math.floor((now.getTime() - then.getTime()) / 86_400_000);
  let base: string;
  if (days <= 0) base = "Acked today";
  else if (days === 1) base = "Acked yesterday";
  else if (days < 7) base = `Acked ${days}d ago`;
  else base = `Acked ${then.toLocaleDateString("en-GB")}`;
  return awaitingReceipt ? `${base} · awaiting receipt` : base;
}

export function scorePortfolioCare(
  input: PortfolioCustomerInput,
  now = new Date(),
): PortfolioCustomerRow {
  const openSupport = Math.max(0, input.openEscalations - input.openComplaints);
  const careCount = input.openEscalations + input.openPrivacy;
  const lastCareAckAt = input.lastCareAckAt ?? null;
  const unseenCareAckCount = Math.max(0, input.unseenCareAckCount ?? 0);
  const needsFirstAck = careCount > 0 && !lastCareAckAt;
  const awaitingReceipt = unseenCareAckCount > 0;
  const sortScore =
    input.openComplaints * 10 +
    input.openPrivacy * 5 +
    input.openEscalations * 2 +
    (needsFirstAck ? 1 : 0) +
    (awaitingReceipt ? 0.5 : 0);

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
    lastCareAckAt,
    unseenCareAckCount,
    careCount,
    openSupport,
    careTone,
    careLabel,
    ackCue:
      careCount > 0 || awaitingReceipt
        ? formatCareAckCue(lastCareAckAt, now, awaitingReceipt)
        : "—",
    needsFirstAck,
    awaitingReceipt,
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
    case "unacked":
      return row.needsFirstAck;
    case "awaiting":
      return row.awaitingReceipt;
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
  const unackedCareCount = customers.filter((r) => r.needsFirstAck).length;
  const awaitingReceiptCount = customers.filter((r) => r.awaitingReceipt).length;
  const totalComplaints = customers.reduce((n, r) => n + r.openComplaints, 0);
  const totalPrivacy = customers.reduce((n, r) => n + r.openPrivacy, 0);
  const totalSupport = customers.reduce((n, r) => n + r.openSupport, 0);

  const labels: Record<Exclude<PortfolioCareFilter, "all">, string> = {
    care: "needing care",
    complaints: "with open complaints",
    privacy: "with open privacy requests",
    support: "with routine support cases",
    unacked: "needing a first care acknowledgment",
    awaiting: "awaiting a customer care receipt",
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
    unackedCareCount,
    awaitingReceiptCount,
    totalComplaints,
    totalPrivacy,
    totalSupport,
    summary,
    customers,
  };
}

export function buildPortfolioCareRadar(
  customers: PortfolioCustomerInput[],
  now = new Date(),
): PortfolioCareRadar {
  const rows = customers.map((c) => scorePortfolioCare(c, now)).sort((a, b) => {
    if (b.sortScore !== a.sortScore) return b.sortScore - a.sortScore;
    if (a.needsFirstAck !== b.needsFirstAck) return a.needsFirstAck ? -1 : 1;
    if (a.awaitingReceipt !== b.awaitingReceipt) return a.awaitingReceipt ? -1 : 1;
    const aAck = a.lastCareAckAt ?? "";
    const bAck = b.lastCareAckAt ?? "";
    if (aAck !== bAck) return aAck.localeCompare(bAck);
    return a.name.localeCompare(b.name);
  });

  const withCareCount = rows.filter((r) => r.careCount > 0).length;
  const unackedCareCount = rows.filter((r) => r.needsFirstAck).length;
  const awaitingReceiptCount = rows.filter((r) => r.awaitingReceipt).length;
  const totalComplaints = rows.reduce((n, r) => n + r.openComplaints, 0);
  const totalPrivacy = rows.reduce((n, r) => n + r.openPrivacy, 0);
  const totalSupport = rows.reduce((n, r) => n + r.openSupport, 0);

  let summary: string;
  if (rows.length === 0) {
    summary = "No customers linked yet.";
  } else if (withCareCount === 0 && awaitingReceiptCount === 0) {
    summary = "Care queues look clear across your book.";
  } else if (unackedCareCount > 0) {
    summary = `${withCareCount} customer(s) need care — ${unackedCareCount} still need a first acknowledgment.`;
  } else if (awaitingReceiptCount > 0) {
    summary = `${awaitingReceiptCount} customer(s) awaiting a care receipt (seen).`;
  } else if (totalComplaints > 0) {
    summary = `${withCareCount} customer(s) need care — ${totalComplaints} open complaint(s) first.`;
  } else {
    summary = `${withCareCount} customer(s) have open support or privacy items.`;
  }

  return {
    customerCount: rows.length,
    withCareCount,
    unackedCareCount,
    awaitingReceiptCount,
    totalComplaints,
    totalPrivacy,
    totalSupport,
    summary,
    customers: rows,
  };
}
