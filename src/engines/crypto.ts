/**
 * Crypto lite engine v1.0
 * Inventory + risk framing with explicit product deferral — no trading, quotes, or execution.
 */

export const CRYPTO_ENGINE_VERSION = "crypto-lite-1.0";

export type CryptoAssetInput = {
  id: string;
  name: string;
  assetType?: string;
  provider?: string | null;
  value: number;
  currency: string;
  ownershipPercent: number;
  confidence: number;
  lastValuationDate: Date;
  verificationStatus: string;
};

export type CryptoIntelligence = {
  holdings: Array<{
    id: string;
    name: string;
    ownedValueNgn: number;
    confidence: number;
    stale: boolean;
    provider: string | null;
  }>;
  totalCryptoNgn: number;
  concentrationOfAssets: number;
  staleCount: number;
  signals: string[];
  deferredCapabilities: string[];
  narrative: string;
  engineVersion: string;
  disclaimer: string;
};

function monthsSince(date: Date, now: Date): number {
  return Math.max(
    0,
    (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth()),
  );
}

export function analyseCrypto(
  holdingsIn: CryptoAssetInput[],
  totalAssetsNgn: number,
  fxToNgn: (currency: string, amount: number) => number,
  now: Date = new Date(),
): CryptoIntelligence {
  const holdings = holdingsIn.map((h) => {
    const owned = fxToNgn(h.currency, h.value) * (h.ownershipPercent / 100);
    const months = monthsSince(new Date(h.lastValuationDate), now);
    return {
      id: h.id,
      name: h.name,
      ownedValueNgn: owned,
      confidence: h.confidence,
      stale: months >= 1 || h.verificationStatus === "STALE", // crypto marks stale faster
      provider: h.provider ?? null,
    };
  });

  const totalCryptoNgn = holdings.reduce((s, h) => s + h.ownedValueNgn, 0);
  const concentrationOfAssets =
    totalAssetsNgn > 0 ? totalCryptoNgn / totalAssetsNgn : 0;
  const staleCount = holdings.filter((h) => h.stale).length;

  const signals: string[] = [];
  if (holdings.length === 0) {
    signals.push("No crypto holdings recorded — WealthOS will not invent prices or positions.");
  }
  if (concentrationOfAssets >= 0.1) {
    signals.push("Crypto is a material share of recorded assets — volatility can move net worth sharply.");
  }
  if (concentrationOfAssets >= 0.25) {
    signals.push("Crypto concentration looks high versus a diversified household balance sheet.");
  }
  if (staleCount > 0) {
    signals.push(`${staleCount} crypto valuation(s) look stale — refresh manually; we do not stream live prices.`);
  }

  const deferredCapabilities = [
    "Live exchange prices and charts",
    "Buy / sell / swap execution",
    "On-chain wallet sync",
    "Yield / staking product recommendations",
    "Guaranteed return or ‘safe crypto’ claims",
  ];

  const narrative =
    holdings.length === 0
      ? "Crypto trading and live pricing are deferred in WealthOS. You may record holdings for net-worth awareness only."
      : `Recorded crypto is about ₦${Math.round(totalCryptoNgn).toLocaleString("en-NG")} (${(concentrationOfAssets * 100).toFixed(0)}% of assets). This is inventory, not a trading desk.`;

  return {
    holdings,
    totalCryptoNgn,
    concentrationOfAssets,
    staleCount,
    signals,
    deferredCapabilities,
    narrative,
    engineVersion: CRYPTO_ENGINE_VERSION,
    disclaimer:
      "Not investment advice. Crypto is high risk. WealthOS does not execute trades, quote live markets, or recommend specific tokens. Verify platforms with SEC Nigeria / WealthGuard before acting on offers.",
  };
}
