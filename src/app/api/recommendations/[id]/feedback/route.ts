import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { createAndSubmitExecution } from "@/services/execution";

const MATERIAL_TYPES = new Set([
  "DEPLOY_IDLE_CASH",
  "REPAY_DEBT",
  "INCREASE_FX_EXPOSURE",
  "BUY_PROTECTION",
  "INCREASE_GOAL_CONTRIBUTION",
]);

const schema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
  reason: z.string().optional(),
  stepUpCode: z.string().optional(),
  requestExecution: z.boolean().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { id } = await params;
  const body = schema.parse(await req.json());

  const rec = await prisma.recommendation.findFirst({ where: { id, userId: user.id } });
  if (!rec) return NextResponse.json({ error: "Recommendation not found." }, { status: 404 });

  const material = MATERIAL_TYPES.has(rec.actionType);
  if (body.status === "ACCEPTED" && material) {
    if (body.stepUpCode !== "123456") {
      return NextResponse.json(
        {
          error:
            "Step-up authentication required for this material action. Enter the confirmation code and try again.",
        },
        { status: 401 },
      );
    }
  }

  await prisma.recommendation.update({
    where: { id },
    data: {
      status: body.status,
      rejectionReason: body.status === "REJECTED" ? body.reason || "Not for me" : null,
    },
  });

  if (body.status === "REJECTED" && body.reason) {
    await prisma.memoryEntry.create({
      data: {
        userId: user.id,
        category: "rejected_recommendation",
        content: `${rec.actionType}: ${body.reason}`,
        source: "customer_feedback",
        verified: true,
      },
    });
  }

  let execution: Awaited<ReturnType<typeof createAndSubmitExecution>> | null = null;
  if (body.status === "ACCEPTED" && material && body.requestExecution) {
    try {
      execution = await createAndSubmitExecution(
        {
          id: rec.id,
          userId: user.id,
          actionType: rec.actionType,
          title: rec.title,
          amount: rec.amount,
          amountCurrency: rec.amountCurrency,
          regulatoryStatus: rec.regulatoryStatus,
        },
        true,
      );
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : "Partner execution is unavailable right now.",
        },
        { status: 503 },
      );
    }
  }

  await prisma.auditEvent.create({
    data: {
      userId: user.id,
      eventType: "RECOMMENDATION_FEEDBACK",
      entityType: "Recommendation",
      entityId: id,
      payloadJson: JSON.stringify({
        status: body.status,
        reason: body.reason,
        material,
        stepUpUsed: Boolean(body.stepUpCode),
        requestExecution: Boolean(body.requestExecution),
        instructionId: execution?.instruction.id,
        receiptId: execution?.receipt.id,
        fundsMoved: false,
      }),
    },
  });

  return NextResponse.json({
    ok: true,
    material,
    execution: execution
      ? {
          instructionId: execution.instruction.id,
          receiptId: execution.receipt.id,
          status: execution.confirmation.status,
          message: execution.confirmation.message,
          partnerRef: execution.confirmation.partnerRef,
          fundsMoved: false,
        }
      : null,
  });
}
