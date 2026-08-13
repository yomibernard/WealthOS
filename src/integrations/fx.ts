/**
 * FX integration adapter.
 * Demo provider returns slight market-move noise around reference levels.
 * Swap implementation for a live market-data vendor without changing callers.
 */

import { prisma } from "@/lib/db";

export const FX_PROVIDER_VERSION = "fx-provider-demo-1.0";

const REFERENCE: Record<string, number> = {
  "USD:NGN": 1600,
  "GBP:NGN": 2050,
  "EUR:NGN": 1750,
};

export type FxQuote = {
  from: string;
  to: string;
  rate: number;
  asOf: Date;
  source: string;
};

export async function fetchFxQuotes(
  pairs: Array<{ from: string; to: string }> = [
    { from: "USD", to: "NGN" },
    { from: "GBP", to: "NGN" },
    { from: "EUR", to: "NGN" },
  ],
): Promise<FxQuote[]> {
  const asOf = new Date();
  return pairs.map(({ from, to }) => {
    const key = `${from}:${to}`;
    const base = REFERENCE[key] ?? 1;
    // ±0.8% demo drift so refreshes are visible but stable
    const drift = 1 + (Math.sin(asOf.getTime() / 3_600_000 + base) * 0.008);
    return {
      from,
      to,
      rate: Math.round(base * drift * 100) / 100,
      asOf,
      source: FX_PROVIDER_VERSION,
    };
  });
}

export async function refreshFxRates(): Promise<{ count: number; quotes: FxQuote[] }> {
  const quotes = await fetchFxQuotes();
  for (const q of quotes) {
    await prisma.fxRate.create({
      data: {
        from: q.from,
        to: q.to,
        rate: q.rate,
        asOf: q.asOf,
        source: q.source,
      },
    });
  }
  return { count: quotes.length, quotes };
}

export async function latestFxTable() {
  const rows = await prisma.fxRate.findMany({ orderBy: { asOf: "desc" } });
  const latest = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const key = `${row.from}:${row.to}`;
    if (!latest.has(key)) latest.set(key, row);
  }
  return [...latest.values()];
}
