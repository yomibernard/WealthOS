/**
 * FX Engine v1.0
 * Converts amounts using approved rate table. Never invents rates.
 */

export type FxRateRow = {
  from: string;
  to: string;
  rate: number;
  asOf: Date;
  source: string;
};

export const FX_ENGINE_VERSION = "fx-1.0";

export function convertAmount(
  amount: number,
  from: string,
  to: string,
  rates: FxRateRow[],
  asOf?: Date,
): { value: number; rate: number; asOf: Date; source: string } | null {
  if (from === to) {
    return { value: amount, rate: 1, asOf: asOf ?? new Date(), source: "identity" };
  }

  const direct = pickLatest(rates.filter((r) => r.from === from && r.to === to), asOf);
  if (direct) {
    return {
      value: amount * direct.rate,
      rate: direct.rate,
      asOf: direct.asOf,
      source: direct.source,
    };
  }

  const inverse = pickLatest(rates.filter((r) => r.from === to && r.to === from), asOf);
  if (inverse && inverse.rate !== 0) {
    const rate = 1 / inverse.rate;
    return {
      value: amount * rate,
      rate,
      asOf: inverse.asOf,
      source: `${inverse.source}:inverse`,
    };
  }

  // Via NGN bridge
  const toNgn = pickLatest(rates.filter((r) => r.from === from && r.to === "NGN"), asOf);
  const fromNgn = pickLatest(rates.filter((r) => r.from === "NGN" && r.to === to), asOf);
  if (toNgn && fromNgn) {
    const rate = toNgn.rate * fromNgn.rate;
    return {
      value: amount * rate,
      rate,
      asOf: toNgn.asOf < fromNgn.asOf ? toNgn.asOf : fromNgn.asOf,
      source: "bridge:NGN",
    };
  }

  const fromToNgn = pickLatest(rates.filter((r) => r.from === from && r.to === "NGN"), asOf);
  const toToNgn = pickLatest(rates.filter((r) => r.from === to && r.to === "NGN"), asOf);
  if (fromToNgn && toToNgn && toToNgn.rate !== 0) {
    const rate = fromToNgn.rate / toToNgn.rate;
    return {
      value: amount * rate,
      rate,
      asOf: fromToNgn.asOf,
      source: "bridge:NGN-inverse",
    };
  }

  return null;
}

function pickLatest(rows: FxRateRow[], asOf?: Date): FxRateRow | null {
  const eligible = asOf ? rows.filter((r) => r.asOf <= asOf) : rows;
  if (!eligible.length) return null;
  return eligible.reduce((a, b) => (a.asOf >= b.asOf ? a : b));
}
