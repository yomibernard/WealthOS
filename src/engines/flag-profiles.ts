/**
 * Recommended FF_* launch / incident profiles (env-driven; require redeploy).
 */

import type { FeatureFlags } from "@/lib/feature-flags";

export type FlagProfileId = "full_demo" | "safe_pilot" | "incident_lockdown";

/** Maps FeatureFlags keys → env var names */
export const FLAG_ENV_KEYS: Record<keyof FeatureFlags, string> = {
  partnerExecution: "FF_PARTNER_EXECUTION",
  wealthGuardUploads: "FF_WEALTHGUARD_UPLOADS",
  monthlyReports: "FF_MONTHLY_REPORTS",
  llmPolish: "FF_LLM_POLISH",
  openBankingDemo: "FF_OPEN_BANKING_DEMO",
  household: "FF_HOUSEHOLD",
  propertyIntel: "FF_PROPERTY_INTEL",
  businessIntel: "FF_BUSINESS_INTEL",
  insuranceIntel: "FF_INSURANCE_INTEL",
  pensionIntel: "FF_PENSION_INTEL",
  wealthInbox: "FF_WEALTH_INBOX",
  lifeEventAuto: "FF_LIFE_EVENT_AUTO",
  estateLite: "FF_ESTATE_LITE",
  adviserCollab: "FF_ADVISER_COLLAB",
  taxLite: "FF_TAX_LITE",
  cryptoLite: "FF_CRYPTO_LITE",
  lendingLite: "FF_LENDING_LITE",
  weeklyDigest: "FF_WEEKLY_DIGEST",
};

export type FlagProfile = {
  id: FlagProfileId;
  label: string;
  summary: string;
  /** Desired on/off; omitted keys are unconstrained */
  desired: Partial<FeatureFlags>;
};

export const FLAG_PROFILES: FlagProfile[] = [
  {
    id: "full_demo",
    label: "Full demo",
    summary: "Closed walkthrough with cadence, adviser loop, and demo rails visible.",
    desired: {
      partnerExecution: true,
      openBankingDemo: true,
      monthlyReports: true,
      weeklyDigest: true,
      adviserCollab: true,
      wealthGuardUploads: true,
    },
  },
  {
    id: "safe_pilot",
    label: "Safe pilot",
    summary: "Shared pilot URL: keep cadence/adviser; hide demo execution and LLM polish.",
    desired: {
      partnerExecution: false,
      llmPolish: false,
      openBankingDemo: true,
      monthlyReports: true,
      weeklyDigest: true,
      adviserCollab: true,
      wealthGuardUploads: true,
      cryptoLite: true,
      lendingLite: true,
    },
  },
  {
    id: "incident_lockdown",
    label: "Incident lockdown",
    summary: "SEV-1/2: disable AI polish, partner rail, uploads, and open-banking demo sync.",
    desired: {
      partnerExecution: false,
      llmPolish: false,
      wealthGuardUploads: false,
      openBankingDemo: false,
      adviserCollab: true,
      monthlyReports: true,
      weeklyDigest: true,
    },
  },
];

export type FlagMismatch = {
  key: keyof FeatureFlags;
  env: string;
  expected: boolean;
  actual: boolean;
};

export function evaluateFlagProfile(
  current: FeatureFlags,
  profile: FlagProfile,
): {
  id: FlagProfileId;
  match: boolean;
  mismatches: FlagMismatch[];
  matchCount: number;
  constrainedCount: number;
} {
  const mismatches: FlagMismatch[] = [];
  const entries = Object.entries(profile.desired) as Array<[keyof FeatureFlags, boolean]>;
  for (const [key, expected] of entries) {
    if (current[key] !== expected) {
      mismatches.push({
        key,
        env: FLAG_ENV_KEYS[key],
        expected,
        actual: current[key],
      });
    }
  }
  return {
    id: profile.id,
    match: mismatches.length === 0,
    mismatches,
    matchCount: entries.length - mismatches.length,
    constrainedCount: entries.length,
  };
}

export function bestMatchingProfile(current: FeatureFlags): {
  profileId: FlagProfileId | null;
  evaluations: ReturnType<typeof evaluateFlagProfile>[];
} {
  const evaluations = FLAG_PROFILES.map((p) => evaluateFlagProfile(current, p));
  const perfect = evaluations.find((e) => e.match);
  if (perfect) return { profileId: perfect.id, evaluations };
  // Prefer fewest mismatches among profiles
  const ranked = [...evaluations].sort(
    (a, b) => a.mismatches.length - b.mismatches.length || b.matchCount - a.matchCount,
  );
  return { profileId: ranked[0]?.mismatches.length === 0 ? ranked[0].id : null, evaluations };
}

export function envSnippetForProfile(profile: FlagProfile): string {
  return Object.entries(profile.desired)
    .map(([key, on]) => `${FLAG_ENV_KEYS[key as keyof FeatureFlags]}=${on ? "true" : "false"}`)
    .join("\n");
}

/** Flags that are especially sensitive on a shared pilot URL */
export function riskyFlagsOn(current: FeatureFlags): Array<keyof FeatureFlags> {
  const risky: Array<keyof FeatureFlags> = [];
  if (current.partnerExecution) risky.push("partnerExecution");
  if (current.llmPolish) risky.push("llmPolish");
  return risky;
}
