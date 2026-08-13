/**
 * WealthGuard analysis engine v1.0
 * Never auto-labels Safe / Guaranteed / Scam / Fraud without authoritative evidence.
 */

export const WEALTHGUARD_VERSION = "wealthguard-1.0";

export type ExtractedOffer = {
  provider?: string;
  product?: string;
  promisedReturn?: string;
  minimum?: string;
  liquidity?: string;
  fees?: string;
  custody?: string;
  regulatoryClaims?: string;
  terms?: string;
  risks?: string;
};

export type WealthGuardResult = {
  extracted: ExtractedOffer;
  providerVerification: "Verified" | "Not found" | "Unable to verify";
  transparency: "High" | "Medium" | "Low";
  returnClaim: "Typical" | "Elevated" | "Very unusual";
  overallOutcome: "Lower concern" | "Further checks required" | "Significant warning indicators";
  explanation: string;
  warningIndicators: string[];
  version: string;
};

const KNOWN_PROVIDERS = [
  "stanbic ibtc",
  "arm investment",
  "arm",
  "meristem",
  "chapel hill denham",
  "united capital",
  "aiico",
  "leadway",
  "axa mansard",
  "gtbank",
  "gtb",
  "access bank",
  "zenith bank",
  "uba",
  "fidelity bank",
  "cowrywise",
  "piggyvest",
  "risevest",
  "bamboo",
  "chaka",
  "sec nigeria",
  "pencom",
].map((s) => s.trim().toLowerCase());

export function extractOfferFromText(text: string): ExtractedOffer {
  const lower = text.toLowerCase();
  const returnMatch = text.match(/(\d{1,3}(?:\.\d+)?)\s*%\s*(?:p\.?a\.?|per\s*annum|monthly|return)?/i);
  const minMatch = text.match(
    /(?:minimum|min\.?|from)\s*(?:of\s*)?(?:₦|ngn|n)?\s*([\d,]+(?:\.\d+)?\s*(?:m|million)?)/i,
  );
  const providerMatch =
    text.match(/(?:provider|from|by|offered by)\s*[:\-]?\s*([A-Za-z0-9 &.-]{3,60})/i) ||
    text.match(/\b([A-Z][A-Za-z0-9 &.-]{2,40})\b/);

  return {
    provider: providerMatch?.[1]?.trim(),
    product: lower.includes("money market")
      ? "Money market fund"
      : lower.includes("mutual fund")
        ? "Mutual fund"
        : lower.includes("treasury") || lower.includes("t-bill")
          ? "Treasury bill"
          : lower.includes("crypto")
            ? "Crypto-related offer"
            : "Unspecified investment offer",
    promisedReturn: returnMatch ? `${returnMatch[1]}%` : undefined,
    minimum: minMatch ? minMatch[0] : undefined,
    liquidity: /lock.?in|cannot withdraw|90 days|180 days|illiquid/i.test(text)
      ? "Restricted / lock-in language detected"
      : /t\+?1|same day|flexible withdrawal/i.test(text)
        ? "Flexible language detected"
        : undefined,
    fees: /fee|management charge|entry|exit/i.test(text) ? "Fee language present" : "Fees not clearly stated",
    custody: /custody|custodian|cscs|trustee/i.test(text)
      ? "Custody language present"
      : "Custody not clearly stated",
    regulatoryClaims: /sec|sec[- ]registered|licensed|guaranteed by cbn|naicom|pencom/i.test(text)
      ? "Regulatory claim language detected"
      : "No clear regulatory claim found",
    risks: /risk of loss|capital at risk|not guaranteed/i.test(text)
      ? "Some risk disclosure present"
      : "Risk disclosure weak or absent",
    terms: text.slice(0, 500),
  };
}

export type AnalyseOfferOptions = {
  knownProviders?: string[];
  providerVerification?: WealthGuardResult["providerVerification"];
  providerDetail?: string;
};

export function analyseOffer(
  text: string,
  knownProvidersOrOptions: string[] | AnalyseOfferOptions = KNOWN_PROVIDERS,
): WealthGuardResult {
  const options: AnalyseOfferOptions = Array.isArray(knownProvidersOrOptions)
    ? { knownProviders: knownProvidersOrOptions }
    : knownProvidersOrOptions;
  const knownProviders = options.knownProviders ?? KNOWN_PROVIDERS;

  const extracted = extractOfferFromText(text);
  const warningIndicators: string[] = [];
  const lower = text.toLowerCase();

  let providerVerification: WealthGuardResult["providerVerification"] =
    options.providerVerification ?? "Unable to verify";
  const registryNote: string | undefined = options.providerDetail;

  if (!options.providerVerification) {
    if (extracted.provider) {
      const p = extracted.provider.toLowerCase();
      if (knownProviders.some((k) => p.includes(k) || k.includes(p))) {
        providerVerification = "Verified";
      } else {
        providerVerification = "Not found";
        warningIndicators.push("Provider name not found in WealthOS reference list.");
      }
    } else {
      warningIndicators.push("Provider not identified in the submitted material.");
    }
  } else if (!extracted.provider) {
    warningIndicators.push("Provider not identified in the submitted material.");
  } else if (providerVerification === "Not found") {
    warningIndicators.push("Provider name not found in the regulatory reference adapter.");
  } else if (providerVerification === "Unable to verify") {
    warningIndicators.push("Provider registry unavailable — verification deferred.");
  }

  let transparency: WealthGuardResult["transparency"] = "Medium";
  const clarityScore =
    (extracted.fees && !extracted.fees.includes("not clearly") ? 1 : 0) +
    (extracted.custody && !extracted.custody.includes("not clearly") ? 1 : 0) +
    (extracted.liquidity ? 1 : 0) +
    (extracted.risks && extracted.risks.includes("present") ? 1 : 0);
  if (clarityScore >= 3) transparency = "High";
  else if (clarityScore <= 1) {
    transparency = "Low";
    warningIndicators.push("Key terms (fees, custody, liquidity or risk) are unclear.");
  }

  let returnClaim: WealthGuardResult["returnClaim"] = "Typical";
  const pct = extracted.promisedReturn
    ? parseFloat(extracted.promisedReturn.replace("%", ""))
    : NaN;
  if (!Number.isNaN(pct)) {
    if (pct >= 40 || /per month|monthly return|guaranteed\s+\d/i.test(text)) {
      returnClaim = "Very unusual";
      warningIndicators.push("Promised return appears very unusual versus typical regulated products.");
    } else if (pct >= 25) {
      returnClaim = "Elevated";
      warningIndicators.push("Return claim is elevated; request audited track record.");
    }
  }

  if (/guaranteed returns?|risk[- ]free|double your money|100%\s*safe/i.test(lower)) {
    warningIndicators.push("Absolute guarantee or 'risk-free' language detected.");
    returnClaim = "Very unusual";
  }
  if (/whatsapp|only today|urgent|secret tip|send bitcoin/i.test(lower)) {
    warningIndicators.push("Pressure, informal channel or crypto-send language detected.");
  }
  if (extracted.product === "Crypto-related offer") {
    warningIndicators.push("Crypto-related offers are outside WealthOS MVP execution scope.");
  }

  let overallOutcome: WealthGuardResult["overallOutcome"] = "Lower concern";
  if (warningIndicators.length >= 3 || returnClaim === "Very unusual") {
    overallOutcome = "Significant warning indicators";
  } else if (
    warningIndicators.length >= 1 ||
    providerVerification !== "Verified" ||
    transparency === "Low" ||
    returnClaim === "Elevated"
  ) {
    overallOutcome = "Further checks required";
  }

  const explanation = [
    `Provider verification: ${providerVerification}.`,
    registryNote,
    `Product transparency: ${transparency}.`,
    `Return claim: ${returnClaim}.`,
    overallOutcome === "Lower concern"
      ? "Fewer warning indicators were detected, but you should still read official documents and confirm the provider's licence independently."
      : overallOutcome === "Further checks required"
        ? "Several items need verification before any commitment. WealthOS does not label this as safe or as fraud."
        : "Multiple warning indicators were found. Do not commit funds until a regulated professional and official sources confirm legitimacy.",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    extracted,
    providerVerification,
    transparency,
    returnClaim,
    overallOutcome,
    explanation,
    warningIndicators,
    version: WEALTHGUARD_VERSION,
  };
}
