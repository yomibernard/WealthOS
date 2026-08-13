/**
 * Customer → adviser share pack v1.0
 * Calm briefing text only — no product solicitation.
 */

export const ADVISER_SHARE_VERSION = "adviser-share-1.0";

export type SharePackType = "weekly_digest" | "profile" | "funding" | "full";

export type SharePackInput = {
  customerName: string;
  packType: SharePackType;
  netWorthNgn: number;
  confidence: number;
  healthScore: number;
  profileScore: number;
  behindGoalCount: number;
  monthlyFundingGapNgn: number;
  staleAssetCount: number;
  digestHeadline?: string | null;
  profileSummary?: string | null;
  fundingSummary?: string | null;
  noteFromCustomer?: string | null;
};

export type SharePack = {
  version: string;
  packType: SharePackType;
  title: string;
  body: string;
};

export function buildAdviserSharePack(input: SharePackInput): SharePack {
  const lines: string[] = [
    `${input.customerName} shared a WealthOS briefing (${input.packType.replaceAll("_", " ")}).`,
    `Position: estimated net worth ₦${Math.round(input.netWorthNgn).toLocaleString("en-NG")} (confidence ~${Math.round(input.confidence * 100)}%), Wealth Health ${input.healthScore}/100.`,
  ];

  if (input.packType === "weekly_digest" || input.packType === "full") {
    lines.push(
      input.digestHeadline
        ? `Weekly digest: ${input.digestHeadline}`
        : "Weekly digest: not generated yet — live position included above.",
    );
  }

  if (input.packType === "profile" || input.packType === "full") {
    lines.push(
      `Profile completeness: ${input.profileScore}%${
        input.profileSummary ? ` — ${input.profileSummary}` : ""
      }`,
    );
    if (input.staleAssetCount > 0) {
      lines.push(`Data quality: ${input.staleAssetCount} stale valuation(s) flagged.`);
    }
  }

  if (input.packType === "funding" || input.packType === "full") {
    lines.push(
      input.fundingSummary ??
        (input.behindGoalCount
          ? `${input.behindGoalCount} goal(s) behind; modelled gap ~₦${Math.round(input.monthlyFundingGapNgn).toLocaleString("en-NG")}/mo.`
          : "Goal funding looks broadly on track under illustrative assumptions."),
    );
  }

  if (input.noteFromCustomer?.trim()) {
    lines.push(`Customer note: ${input.noteFromCustomer.trim().slice(0, 500)}`);
  }

  lines.push(
    "This pack is informational for human review. Suitability, consent, and doing-nothing remain valid.",
  );

  const titles: Record<SharePackType, string> = {
    weekly_digest: "Customer shared weekly digest",
    profile: "Customer shared profile status",
    funding: "Customer shared funding pulse",
    full: "Customer shared wealth briefing",
  };

  return {
    version: ADVISER_SHARE_VERSION,
    packType: input.packType,
    title: titles[input.packType],
    body: lines.join("\n\n"),
  };
}
