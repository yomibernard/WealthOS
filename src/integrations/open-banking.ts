/**
 * Open-banking demo adapter.
 * Simulates consent-gated account sync — no real bank credentials or fund movement.
 */

export const OPEN_BANKING_ADAPTER_VERSION = "open-banking-demo-1.0";

export type DemoBank = {
  code: string;
  name: string;
  providerLabel: string;
};

export const DEMO_BANKS: DemoBank[] = [
  { code: "gtb", name: "GTBank", providerLabel: "GTBank Open Banking (demo)" },
  { code: "access", name: "Access Bank", providerLabel: "Access Bank Open Banking (demo)" },
  { code: "zenith", name: "Zenith Bank", providerLabel: "Zenith Bank Open Banking (demo)" },
];

export type SyncOutcome = {
  status: "healthy" | "degraded" | "error";
  lastError: string | null;
  message: string;
  balancesTouched: boolean;
  adapterVersion: string;
};

/**
 * Deterministic demo sync: degraded providers stay flaky; healthy ones refresh.
 * Force errors via OPEN_BANKING_FORCE_DOWN=true.
 */
export function simulateOpenBankingSync(input: {
  providerName: string;
  previousStatus: string;
  consentActive: boolean;
}): SyncOutcome {
  if (process.env.OPEN_BANKING_FORCE_DOWN === "true") {
    return {
      status: "error",
      lastError: "Upstream open-banking rail unavailable (demo forced down).",
      message: "Sync failed — try again later.",
      balancesTouched: false,
      adapterVersion: OPEN_BANKING_ADAPTER_VERSION,
    };
  }

  if (!input.consentActive) {
    return {
      status: "error",
      lastError: "Consent is paused or revoked for this connection.",
      message: "Reconnect consent before syncing.",
      balancesTouched: false,
      adapterVersion: OPEN_BANKING_ADAPTER_VERSION,
    };
  }

  const flaky =
    /ARM|degraded/i.test(input.providerName) || input.previousStatus === "degraded";

  if (flaky) {
    return {
      status: "degraded",
      lastError: "Provider timeout — using last known balance",
      message: "Partial sync. Balances may be stale.",
      balancesTouched: false,
      adapterVersion: OPEN_BANKING_ADAPTER_VERSION,
    };
  }

  return {
    status: "healthy",
    lastError: null,
    message: "Accounts synced successfully (demo).",
    balancesTouched: true,
    adapterVersion: OPEN_BANKING_ADAPTER_VERSION,
  };
}

export function bankFromCode(code: string): DemoBank | undefined {
  return DEMO_BANKS.find((b) => b.code === code);
}
