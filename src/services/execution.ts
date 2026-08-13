import { prisma } from "@/lib/db";
import {
  partnerLabel,
  resolvePartner,
  submitToPartner,
  EXECUTION_PARTNER_VERSION,
} from "@/integrations/execution-partner";
import { requireFlag } from "@/lib/feature-flags";

type Rec = {
  id: string;
  userId: string;
  actionType: string;
  title: string;
  amount: number | null;
  amountCurrency: string | null;
  regulatoryStatus: string | null;
};

export async function createAndSubmitExecution(rec: Rec, stepUpVerified: boolean) {
  const flag = requireFlag("partnerExecution");
  if (!flag.ok) {
    throw new Error(flag.error);
  }

  const partnerCode = resolvePartner(rec.actionType);

  const instruction = await prisma.executionInstruction.create({
    data: {
      userId: rec.userId,
      recommendationId: rec.id,
      partnerCode,
      actionType: rec.actionType,
      title: rec.title,
      amount: rec.amount,
      currency: rec.amountCurrency ?? "NGN",
      status: "pending_partner",
      stepUpVerified,
      suitabilityStatus: "customer_accepted_with_step_up",
      payloadJson: JSON.stringify({
        partnerLabel: partnerLabel(partnerCode),
        regulatoryStatus: rec.regulatoryStatus,
        adapter: EXECUTION_PARTNER_VERSION,
      }),
    },
  });

  await prisma.auditEvent.create({
    data: {
      userId: rec.userId,
      eventType: "EXECUTION_INSTRUCTION_CREATED",
      entityType: "ExecutionInstruction",
      entityId: instruction.id,
      payloadJson: JSON.stringify({
        recommendationId: rec.id,
        partnerCode,
        stepUpVerified,
      }),
    },
  });

  const confirmation = await submitToPartner({
    instructionId: instruction.id,
    partnerCode,
    actionType: rec.actionType,
    title: rec.title,
    amount: rec.amount,
    currency: rec.amountCurrency ?? "NGN",
    customerRef: rec.userId,
  });

  const status =
    confirmation.status === "accepted"
      ? "partner_accepted"
      : confirmation.status === "queued"
        ? "partner_queued"
        : "partner_rejected";

  await prisma.executionInstruction.update({
    where: { id: instruction.id },
    data: { status },
  });

  const receipt = await prisma.executionReceipt.create({
    data: {
      instructionId: instruction.id,
      partnerCode,
      partnerRef: confirmation.partnerRef,
      status: confirmation.status,
      message: confirmation.message,
      confirmedAt: confirmation.confirmedAt,
      rawJson: JSON.stringify(confirmation.raw),
    },
  });

  await prisma.recommendation.update({
    where: { id: rec.id },
    data: { status: confirmation.status === "rejected" ? "ACCEPTED" : "EXECUTED" },
  });

  await prisma.auditEvent.create({
    data: {
      userId: rec.userId,
      eventType: "EXECUTION_RECEIPT",
      entityType: "ExecutionReceipt",
      entityId: receipt.id,
      payloadJson: JSON.stringify({
        instructionId: instruction.id,
        partnerRef: confirmation.partnerRef,
        status: confirmation.status,
        fundsMoved: false,
      }),
    },
  });

  await prisma.notification.create({
    data: {
      userId: rec.userId,
      category: confirmation.status === "rejected" ? "Important" : "Informational",
      title: "Partner execution update",
      body: confirmation.message,
    },
  });

  return { instruction, receipt, confirmation };
}
