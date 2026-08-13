import { prisma } from "@/lib/db";
import { softDeleteDocumentFile } from "@/lib/document-storage";

/**
 * Privacy erasure workflow.
 * Anonymises customer profile and clears personal data stores.
 * Retains de-identified audit events where required for compliance.
 */
export async function applyErasure(userId: string, handledBy: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  if (user.role !== "CUSTOMER") throw new Error("Only customer accounts can be erased via this flow");

  const docs = await prisma.document.findMany({ where: { userId } });
  for (const doc of docs) {
    await softDeleteDocumentFile(doc.storageKey);
  }

  await prisma.$transaction([
    prisma.document.updateMany({
      where: { userId },
      data: { deletedAt: new Date(), name: "[redacted]", storageKey: "redacted" },
    }),
    prisma.memoryEntry.deleteMany({ where: { userId } }),
    prisma.notification.deleteMany({ where: { userId } }),
    prisma.consent.updateMany({
      where: { userId },
      data: { status: "REVOKED" },
    }),
    prisma.conversation.deleteMany({ where: { userId } }),
    prisma.recommendation.deleteMany({ where: { userId } }),
    prisma.goal.deleteMany({ where: { userId } }),
    prisma.asset.deleteMany({ where: { userId } }),
    prisma.liability.deleteMany({ where: { userId } }),
    prisma.income.deleteMany({ where: { userId } }),
    prisma.expense.deleteMany({ where: { userId } }),
    prisma.lifeEvent.deleteMany({ where: { userId } }),
    prisma.inboxItem.deleteMany({ where: { userId } }),
    prisma.estateItem.deleteMany({ where: { userId } }),
    prisma.adviserNote.deleteMany({ where: { customerId: userId } }),
    prisma.householdMember.deleteMany({ where: { userId } }),
    prisma.riskProfile.deleteMany({ where: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: {
        email: `erased+${userId.slice(0, 8)}@deleted.wealthos.local`,
        name: "Erased Customer",
        passwordHash: "!", // unusable
        status: "erased",
        deletedAt: new Date(),
        employmentStatus: null,
        riskTolerance: null,
        investmentExperience: null,
        liquidityNeeds: null,
        dateOfBirth: null,
        vulnerableFlag: false,
        profileCompleteness: 0,
      },
    }),
  ]);

  await prisma.auditEvent.create({
    data: {
      userId: handledBy,
      eventType: "PRIVACY_ERASURE_APPLIED",
      entityType: "User",
      entityId: userId,
      payloadJson: JSON.stringify({
        anonymised: true,
        retained: ["audit_events_deidentified_policy"],
      }),
    },
  });
}
