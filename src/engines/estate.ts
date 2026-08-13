/**
 * Estate / will lite engine v1.0
 * Readiness inventory — not legal drafting, probate, or trust administration.
 */

export const ESTATE_ENGINE_VERSION = "estate-1.0";

export type EstateItemInput = {
  id: string;
  kind: string;
  label: string;
  status: string;
  notes?: string | null;
  lastReviewedAt?: Date | null;
};

export type EstateContext = {
  dependantCount: number;
  hasLifeCover: boolean;
  hasProperty: boolean;
  hasBusiness: boolean;
  hasPension: boolean;
};

export type EstateIntelligence = {
  score: number;
  grade: "thin" | "emerging" | "structured";
  items: EstateItemInput[];
  missingKinds: string[];
  signals: string[];
  checklist: string[];
  narrative: string;
  engineVersion: string;
  disclaimer: string;
};

const CORE_KINDS = ["will", "power_of_attorney", "beneficiaries", "letter_of_wishes"] as const;

export function analyseEstate(
  items: EstateItemInput[],
  ctx: EstateContext,
): EstateIntelligence {
  const byKind = new Map(items.map((i) => [i.kind, i]));
  const missingKinds = CORE_KINDS.filter((k) => {
    const row = byKind.get(k);
    return !row || row.status === "missing";
  });

  let score = 20;
  for (const kind of CORE_KINDS) {
    const row = byKind.get(kind);
    if (!row || row.status === "missing") continue;
    if (row.status === "documented" || row.status === "reviewed") score += 18;
    else if (row.status === "draft") score += 10;
  }
  if (ctx.hasLifeCover) score += 6;
  if (ctx.dependantCount > 0 && byKind.get("beneficiaries")?.status !== "missing") score += 6;
  if (ctx.hasBusiness && byKind.get("succession")) {
    const s = byKind.get("succession")!;
    if (s.status === "documented" || s.status === "reviewed") score += 8;
    else if (s.status === "draft") score += 4;
  } else if (ctx.hasBusiness) {
    score -= 5;
  }
  score = Math.max(0, Math.min(100, score));

  const grade: EstateIntelligence["grade"] =
    score >= 70 ? "structured" : score >= 40 ? "emerging" : "thin";

  const signals: string[] = [];
  if (missingKinds.includes("will")) {
    signals.push("No will documented in WealthOS — especially urgent if you have dependants.");
  }
  if (missingKinds.includes("beneficiaries") && (ctx.hasPension || ctx.hasLifeCover)) {
    signals.push("Beneficiary nominations for pension/life cover are not confirmed here.");
  }
  if (ctx.hasProperty && missingKinds.includes("will")) {
    signals.push("Property is on the Wealth Graph without a recorded will.");
  }
  if (ctx.hasBusiness && (!byKind.get("succession") || byKind.get("succession")?.status === "missing")) {
    signals.push("Business ownership is present without a succession note.");
  }
  if (ctx.dependantCount > 0 && grade === "thin") {
    signals.push("Dependants are recorded but estate readiness looks thin.");
  }

  const checklist: string[] = [
    "Confirm a valid will exists with a qualified professional",
    "Align RSA / life beneficiaries with intentions",
    "Store copies securely; note locations in WealthOS",
  ];
  if (ctx.hasBusiness) checklist.push("Document business succession / share transfer intentions");
  if (ctx.hasProperty) checklist.push("Ensure property titles and ownership % match estate plans");

  const narrative =
    grade === "structured"
      ? "Estate records look relatively structured in WealthOS — still verify with a lawyer; this is not legal advice."
      : grade === "emerging"
        ? "Some estate building blocks are recorded, but key documents still look incomplete."
        : "Estate readiness looks thin in the app. Start with will and beneficiary clarity before optimising investments.";

  return {
    score,
    grade,
    items,
    missingKinds: [...missingKinds],
    signals,
    checklist,
    narrative,
    engineVersion: ESTATE_ENGINE_VERSION,
    disclaimer:
      "Not legal advice, will drafting, or probate services. Nigerian estate law requires qualified professionals.",
  };
}
