/**
 * Net Worth Engine v1.0
 * attributable assets − attributable liabilities
 * Formula: Σ(value × ownership%/100 × FX) − Σ(balance × ownership%/100 × FX)
 */

import { convertAmount, type FxRateRow, FX_ENGINE_VERSION } from "./fx";
import { daysSince } from "@/lib/format";

export const NET_WORTH_ENGINE_VERSION = "networth-1.0";

export type NetWorthAssetInput = {
  id: string;
  value: number;
  currency: string;
  ownershipPercent: number;
  confidence: number;
  lastValuationDate: Date;
  verificationStatus: string;
  category: string;
};

export type NetWorthLiabilityInput = {
  id: string;
  balance: number;
  currency: string;
  ownershipPercent: number;
  confidence: number;
  lastValuationDate: Date;
};

export type NetWorthResult = {
  totalAssetsNgn: number;
  totalLiabilitiesNgn: number;
  netWorthNgn: number;
  confidence: number;
  missingFx: string[];
  staleAssetIds: string[];
  negativeBalances: string[];
  assetBreakdown: { category: string; valueNgn: number; percent: number }[];
  currencyExposure: { currency: string; valueNgn: number; percent: number }[];
  engineVersion: string;
  fxEngineVersion: string;
};

export function calculateNetWorth(
  assets: NetWorthAssetInput[],
  liabilities: NetWorthLiabilityInput[],
  rates: FxRateRow[],
  options?: { staleDays?: number; now?: Date },
): NetWorthResult {
  const now = options?.now ?? new Date();
  const staleDays = options?.staleDays ?? 180;
  const missingFx: string[] = [];
  const staleAssetIds: string[] = [];
  const negativeBalances: string[] = [];

  let totalAssetsNgn = 0;
  let assetConfidenceWeight = 0;
  let assetConfidenceSum = 0;
  const byCategory = new Map<string, number>();
  const byCurrency = new Map<string, number>();

  for (const asset of assets) {
    const converted = convertAmount(asset.value, asset.currency, "NGN", rates);
    if (!converted) {
      missingFx.push(`${asset.id}:${asset.currency}`);
      continue;
    }
    const attributable = converted.value * (asset.ownershipPercent / 100);
    if (attributable < 0) negativeBalances.push(asset.id);
    totalAssetsNgn += attributable;
    byCategory.set(asset.category, (byCategory.get(asset.category) ?? 0) + attributable);
    byCurrency.set(asset.currency, (byCurrency.get(asset.currency) ?? 0) + attributable);

    let conf = asset.confidence;
    if (daysSince(asset.lastValuationDate, now) > staleDays) {
      staleAssetIds.push(asset.id);
      conf *= 0.7;
    }
    if (asset.verificationStatus === "ESTIMATED") conf *= 0.9;
    assetConfidenceWeight += Math.abs(attributable);
    assetConfidenceSum += Math.abs(attributable) * conf;
  }

  let totalLiabilitiesNgn = 0;
  let liabConfidenceWeight = 0;
  let liabConfidenceSum = 0;

  for (const liability of liabilities) {
    const converted = convertAmount(liability.balance, liability.currency, "NGN", rates);
    if (!converted) {
      missingFx.push(`${liability.id}:${liability.currency}`);
      continue;
    }
    const attributable = converted.value * (liability.ownershipPercent / 100);
    totalLiabilitiesNgn += attributable;
    liabConfidenceWeight += Math.abs(attributable);
    liabConfidenceSum += Math.abs(attributable) * liability.confidence;
  }

  const netWorthNgn = totalAssetsNgn - totalLiabilitiesNgn;
  const totalWeight = assetConfidenceWeight + liabConfidenceWeight;
  const confidence =
    totalWeight === 0
      ? 0
      : Math.round(
          ((assetConfidenceSum + liabConfidenceSum) / totalWeight) *
            (missingFx.length ? 0.85 : 1) *
            100,
        ) / 100;

  const assetBreakdown = [...byCategory.entries()]
    .map(([category, valueNgn]) => ({
      category,
      valueNgn,
      percent: totalAssetsNgn > 0 ? (valueNgn / totalAssetsNgn) * 100 : 0,
    }))
    .sort((a, b) => b.valueNgn - a.valueNgn);

  const currencyExposure = [...byCurrency.entries()]
    .map(([currency, valueNgn]) => ({
      currency,
      valueNgn,
      percent: totalAssetsNgn > 0 ? (valueNgn / totalAssetsNgn) * 100 : 0,
    }))
    .sort((a, b) => b.valueNgn - a.valueNgn);

  return {
    totalAssetsNgn,
    totalLiabilitiesNgn,
    netWorthNgn,
    confidence: Math.max(0, Math.min(1, confidence)),
    missingFx,
    staleAssetIds,
    negativeBalances,
    assetBreakdown,
    currencyExposure,
    engineVersion: NET_WORTH_ENGINE_VERSION,
    fxEngineVersion: FX_ENGINE_VERSION,
  };
}
