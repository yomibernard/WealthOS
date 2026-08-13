/**
 * Provider / regulatory verification adapter.
 * Demo registry stands in for SEC/PENCOM lookups until live APIs are wired.
 */

export type ProviderLookupResult = {
  status: "Verified" | "Not found" | "Unable to verify";
  regulator?: string;
  licenceNumber?: string;
  licenceStatus?: string;
  matchedName?: string;
  source: string;
};

const DEMO_REGISTRY: Array<{
  names: string[];
  regulator: string;
  licenceNumber: string;
  licenceStatus: string;
}> = [
  {
    names: ["arm", "arm investment", "arm investment managers"],
    regulator: "SEC Nigeria",
    licenceNumber: "SEC-DEMO-001",
    licenceStatus: "SEC registered",
  },
  {
    names: ["stanbic ibtc", "stanbic ibtc asset management", "stanbic ibtc pension"],
    regulator: "SEC Nigeria / PenCom",
    licenceNumber: "SEC-DEMO-002",
    licenceStatus: "SEC registered",
  },
  {
    names: ["gtbank", "gtb", "guaranty trust bank"],
    regulator: "CBN",
    licenceNumber: "CBN-DEMO-GTB",
    licenceStatus: "Licensed bank",
  },
  {
    names: ["access bank"],
    regulator: "CBN",
    licenceNumber: "CBN-DEMO-ACCESS",
    licenceStatus: "Licensed bank",
  },
  {
    names: ["leadway"],
    regulator: "NAICOM",
    licenceNumber: "NAICOM-DEMO-001",
    licenceStatus: "Licensed insurer",
  },
  {
    names: ["cowrywise", "piggyvest", "risevest", "bamboo", "chaka"],
    regulator: "SEC Nigeria",
    licenceNumber: "SEC-DEMO-FINTECH",
    licenceStatus: "Registered / partner-dependent",
  },
];

export const PROVIDER_REGISTRY_VERSION = "provider-registry-demo-1.0";

export async function lookupProvider(name?: string): Promise<ProviderLookupResult> {
  if (!name?.trim()) {
    return { status: "Unable to verify", source: PROVIDER_REGISTRY_VERSION };
  }

  // Simulate intermittent upstream unavailability for stress-testing UX
  if (process.env.PROVIDER_REGISTRY_FORCE_DOWN === "true") {
    return { status: "Unable to verify", source: `${PROVIDER_REGISTRY_VERSION}:down` };
  }

  const needle = name.toLowerCase().trim();
  const hit = DEMO_REGISTRY.find((row) =>
    row.names.some((n) => needle.includes(n) || n.includes(needle)),
  );

  if (!hit) {
    return { status: "Not found", source: PROVIDER_REGISTRY_VERSION };
  }

  return {
    status: "Verified",
    regulator: hit.regulator,
    licenceNumber: hit.licenceNumber,
    licenceStatus: hit.licenceStatus,
    matchedName: hit.names[0],
    source: PROVIDER_REGISTRY_VERSION,
  };
}
