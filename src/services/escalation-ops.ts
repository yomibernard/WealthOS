import { prisma } from "@/lib/db";
import { createUserNotification } from "@/services/notifications";
import { createInboxFromDrafts } from "@/services/inbox";
import { buildCaseInboxDraft } from "@/engines/customer-cases";
import {
  classifyEscalationReason,
  customerCaseTitle,
  mergeEscalationResolution,
  parseEscalationSummary,
  type EscalationStatus,
} from "@/engines/escalation-ops";

export async function listEscalationsForAdmin(take = 50) {
  const rows = await prisma.escalation.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  return rows.map((e) => {
    const parsed = parseEscalationSummary(e.summary);
    return {
      id: e.id,
      level: e.level,
      reason: e.reason,
      status: e.status,
      assignedTo: e.assignedTo,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      category: classifyEscalationReason(e.reason),
      resolution: parsed.resolution ?? null,
      summaryPreview: e.summary.slice(0, 240),
      customer: e.user,
    };
  });
}

export async function updateEscalationCase(input: {
  id: string;
  status: EscalationStatus;
  resolution: string;
  adminId: string;
}) {
  const existing = await prisma.escalation.findUnique({ where: { id: input.id } });
  if (!existing) return { ok: false as const, error: "Escalation not found." };

  const summary = mergeEscalationResolution(
    existing.summary,
    input.resolution,
    input.status,
  );

  const updated = await prisma.escalation.update({
    where: { id: input.id },
    data: {
      status: input.status,
      assignedTo: input.adminId,
      summary,
    },
  });

  await prisma.auditEvent.create({
    data: {
      userId: input.adminId,
      eventType: "ESCALATION_UPDATED",
      entityType: "Escalation",
      entityId: input.id,
      payloadJson: JSON.stringify({
        status: input.status,
        resolution: input.resolution,
        customerId: existing.userId,
      }),
    },
  });

  const category = classifyEscalationReason(existing.reason);
  const resolution = parseEscalationSummary(updated.summary).resolution ?? null;

  await createUserNotification({
    userId: existing.userId,
    category: "important",
    title: customerCaseTitle(category, input.status),
    body: `Your case is now ${input.status}. ${input.resolution}`,
  });

  if (input.status === "resolved" || input.status === "rejected") {
    await prisma.inboxItem.updateMany({
      where: {
        userId: existing.userId,
        sourceType: "escalation",
        sourceId: existing.id,
        status: { in: ["unread", "read"] },
      },
      data: { status: "acted" },
    });
  }

  await createInboxFromDrafts(existing.userId, [
    buildCaseInboxDraft({
      id: updated.id,
      reason: existing.reason,
      status: updated.status,
      resolution,
    }),
  ]);

  return {
    ok: true as const,
    escalation: {
      id: updated.id,
      status: updated.status,
      assignedTo: updated.assignedTo,
      resolution,
    },
  };
}
