import { getFeatureFlags } from "@/lib/feature-flags";
import {
  FLAG_ENV_KEYS,
  FLAG_PROFILES,
  bestMatchingProfile,
  envSnippetForProfile,
  evaluateFlagProfile,
  riskyFlagsOn,
} from "@/engines/flag-profiles";

export function loadFlagProfileBoard() {
  const current = getFeatureFlags();
  const { profileId, evaluations } = bestMatchingProfile(current);
  const profiles = FLAG_PROFILES.map((p) => {
    const evaluation = evaluateFlagProfile(current, p);
    return {
      ...p,
      evaluation,
      envSnippet: envSnippetForProfile(p),
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    note: "Flags are environment-driven. Apply snippets in Vercel/host env, then redeploy.",
    current,
    envKeys: FLAG_ENV_KEYS,
    closestProfileId: profileId,
    perfectMatchId: evaluations.find((e) => e.match)?.id ?? null,
    riskyOn: riskyFlagsOn(current),
    profiles,
  };
}
