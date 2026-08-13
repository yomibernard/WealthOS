import { prisma } from "@/lib/db";

/** Portable customer data package for access requests (NDPR-oriented MVP). */
export async function exportCustomerData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      incomes: true,
      expenses: true,
      assets: true,
      liabilities: true,
      goals: true,
      riskProfile: true,
      consents: true,
      memories: true,
      documents: true,
      recommendations: true,
      notifications: true,
      escalations: true,
      lifeEvents: true,
      householdMembers: true,
    },
  });
  if (!user) return null;

  // Explicit omit — never export credential material
  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    baseCurrency: user.baseCurrency,
    dateOfBirth: user.dateOfBirth,
    employmentStatus: user.employmentStatus,
    riskTolerance: user.riskTolerance,
    investmentExperience: user.investmentExperience,
    liquidityNeeds: user.liquidityNeeds,
    profileCompleteness: user.profileCompleteness,
    vulnerableFlag: user.vulnerableFlag,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    incomes: user.incomes,
    expenses: user.expenses,
    assets: user.assets,
    liabilities: user.liabilities,
    goals: user.goals,
    riskProfile: user.riskProfile,
    consents: user.consents,
    memories: user.memories,
    documents: user.documents,
    recommendations: user.recommendations,
    notifications: user.notifications,
    escalations: user.escalations,
    lifeEvents: user.lifeEvents,
    householdMembers: user.householdMembers,
  };

  return {
    exportedAt: new Date().toISOString(),
    purpose: "Customer data access / portability package",
    retentionNote:
      "Some records may be retained where required for audit, fraud prevention or legal obligation even after a deletion request.",
    customer: safeUser,
  };
}

export async function createPrivacyRequest(
  userId: string,
  type: "access" | "erasure" | "rectification" | "objection",
  details?: string,
) {
  const req = await prisma.privacyRequest.create({
    data: { userId, type, details, status: "open" },
  });

  await prisma.auditEvent.create({
    data: {
      userId,
      eventType: "PRIVACY_REQUEST_CREATED",
      entityType: "PrivacyRequest",
      entityId: req.id,
      payloadJson: JSON.stringify({ type, details }),
    },
  });

  await prisma.notification.create({
    data: {
      userId,
      category: "Important",
      title: "Privacy request received",
      body: `Your ${type} request is logged. Operations will review it under our retention policy.`,
    },
  });

  return req;
}
