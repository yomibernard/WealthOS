/**
 * Environment-driven feature flags for safe rollouts.
 */

export type FeatureFlags = {
  partnerExecution: boolean;
  wealthGuardUploads: boolean;
  monthlyReports: boolean;
  llmPolish: boolean;
  openBankingDemo: boolean;
  household: boolean;
  propertyIntel: boolean;
  businessIntel: boolean;
  insuranceIntel: boolean;
  pensionIntel: boolean;
  wealthInbox: boolean;
  lifeEventAuto: boolean;
  estateLite: boolean;
  adviserCollab: boolean;
  taxLite: boolean;
  cryptoLite: boolean;
  lendingLite: boolean;
};

function envFlag(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

export function getFeatureFlags(): FeatureFlags {
  return {
    partnerExecution: envFlag("FF_PARTNER_EXECUTION", true),
    wealthGuardUploads: envFlag("FF_WEALTHGUARD_UPLOADS", true),
    monthlyReports: envFlag("FF_MONTHLY_REPORTS", true),
    llmPolish: envFlag("FF_LLM_POLISH", Boolean(process.env.OPENAI_API_KEY)),
    openBankingDemo: envFlag("FF_OPEN_BANKING_DEMO", true),
    household: envFlag("FF_HOUSEHOLD", true),
    propertyIntel: envFlag("FF_PROPERTY_INTEL", true),
    businessIntel: envFlag("FF_BUSINESS_INTEL", true),
    insuranceIntel: envFlag("FF_INSURANCE_INTEL", true),
    pensionIntel: envFlag("FF_PENSION_INTEL", true),
    wealthInbox: envFlag("FF_WEALTH_INBOX", true),
    lifeEventAuto: envFlag("FF_LIFE_EVENT_AUTO", true),
    estateLite: envFlag("FF_ESTATE_LITE", true),
    adviserCollab: envFlag("FF_ADVISER_COLLAB", true),
    taxLite: envFlag("FF_TAX_LITE", true),
    cryptoLite: envFlag("FF_CRYPTO_LITE", true),
    lendingLite: envFlag("FF_LENDING_LITE", true),
  };
}

export function requireFlag(flag: keyof FeatureFlags): { ok: true } | { ok: false; error: string } {
  const flags = getFeatureFlags();
  if (flags[flag]) return { ok: true };
  return {
    ok: false,
    error: `This capability (${flag}) is temporarily unavailable.`,
  };
}
