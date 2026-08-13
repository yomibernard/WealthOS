/**
 * Regulated partner execution adapter.
 * Demo partner simulates confirmation — no real money movement, no credentials in AI path.
 */

export const EXECUTION_PARTNER_VERSION = "partner-demo-1.0";

export type PartnerInstruction = {
  instructionId: string;
  partnerCode: string;
  actionType: string;
  title: string;
  amount?: number | null;
  currency: string;
  customerRef: string;
};

export type PartnerConfirmation = {
  partnerRef: string;
  status: "accepted" | "rejected" | "queued";
  message: string;
  confirmedAt: Date;
  raw: Record<string, unknown>;
};

const PARTNERS: Record<
  string,
  { name: string; supports: string[] }
> = {
  ARM_DEMO: {
    name: "ARM Investment Managers (demo rail)",
    supports: ["DEPLOY_IDLE_CASH", "INCREASE_GOAL_CONTRIBUTION", "INCREASE_FX_EXPOSURE"],
  },
  BANK_DEMO: {
    name: "Settlement Bank (demo rail)",
    supports: ["REPAY_DEBT", "INCREASE_EMERGENCY_RESERVE"],
  },
  INSURE_DEMO: {
    name: "Licensed insurer (demo rail)",
    supports: ["BUY_PROTECTION"],
  },
};

export function resolvePartner(actionType: string): string {
  for (const [code, meta] of Object.entries(PARTNERS)) {
    if (meta.supports.includes(actionType)) return code;
  }
  return "ARM_DEMO";
}

export function partnerLabel(code: string): string {
  return PARTNERS[code]?.name ?? code;
}

/** Simulate partner acknowledgement. Never holds customer payment credentials. */
export async function submitToPartner(
  instruction: PartnerInstruction,
): Promise<PartnerConfirmation> {
  const meta = PARTNERS[instruction.partnerCode];
  if (!meta) {
    return {
      partnerRef: `rej_${instruction.instructionId.slice(0, 8)}`,
      status: "rejected",
      message: "Unknown execution partner.",
      confirmedAt: new Date(),
      raw: { version: EXECUTION_PARTNER_VERSION },
    };
  }

  if (!meta.supports.includes(instruction.actionType)) {
    return {
      partnerRef: `rej_${instruction.instructionId.slice(0, 8)}`,
      status: "rejected",
      message: `${meta.name} does not support ${instruction.actionType} on this rail.`,
      confirmedAt: new Date(),
      raw: { version: EXECUTION_PARTNER_VERSION },
    };
  }

  // Demo: queue high amounts for manual partner ops; accept typical amounts
  const queued = (instruction.amount ?? 0) >= 50_000_000;
  return {
    partnerRef: `ptr_${Date.now().toString(36)}_${instruction.instructionId.slice(0, 6)}`,
    status: queued ? "queued" : "accepted",
    message: queued
      ? `${meta.name} queued the instruction for manual review (high value). No funds moved in demo.`
      : `${meta.name} acknowledged the instruction. Demo mode — no funds were moved.`,
    confirmedAt: new Date(),
    raw: {
      version: EXECUTION_PARTNER_VERSION,
      partner: meta.name,
      actionType: instruction.actionType,
      amount: instruction.amount,
      currency: instruction.currency,
    },
  };
}
