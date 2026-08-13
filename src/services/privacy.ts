import { prisma } from "@/lib/db";
import {
  assertNoPasswordHash,
  buildCadenceSummary,
  classifySnapshotType,
  omitCredentialFields,
  type NoteExportRow,
  type SnapshotExportRow,
} from "@/engines/privacy-export";
import { buildPrivacyInboxDraft, buildPrivacyRequestsPulse } from "@/engines/privacy-requests";
import { buildCaseCareAckCue } from "@/engines/escalation-ops";
import { createUserNotification } from "@/services/notifications";
import { createInboxFromDrafts } from "@/services/inbox";

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
      inboxItems: true,
      estateItems: true,
      suitabilityAssessments: true,
      adviserNotesReceived: {
        orderBy: { createdAt: "desc" },
        take: 100,
      },
      adviserLinks: {
        include: {
          adviser: { select: { id: true, name: true, email: true, role: true } },
        },
      },
    },
  });
  if (!user) return null;

  const [snapshots, prefs, privacyRequests, shareAudits] = await Promise.all([
    prisma.wealthSnapshot.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notificationPreference.findUnique({ where: { userId } }),
    prisma.privacyRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.auditEvent.findMany({
      where: {
        userId,
        eventType: {
          in: [
            "CUSTOMER_SHARED_WITH_ADVISER",
            "ADVISER_NUDGE_SENT",
            "WEEKLY_WEALTH_DIGEST",
            "MONTHLY_WEALTH_REPORT",
            "PRIVACY_EXPORT_DOWNLOADED",
            "PRIVACY_REQUEST_CREATED",
            "ESCALATION_CREATED",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const snapshotRows: SnapshotExportRow[] = snapshots.map((s) => ({
    id: s.id,
    createdAt: s.createdAt.toISOString(),
    netWorthNgn: s.netWorthNgn,
    confidence: s.confidence,
    healthScore: s.healthScore,
    payloadJson: s.payloadJson,
  }));

  const noteRows: NoteExportRow[] = user.adviserNotesReceived.map((n) => ({
    id: n.id,
    kind: n.kind,
    title: n.title,
    body: n.body,
    status: n.status,
    sharedWithCustomer: n.sharedWithCustomer,
    createdAt: n.createdAt.toISOString(),
  }));

  const cadence = buildCadenceSummary(snapshotRows, noteRows);

  const wealthSnapshots = snapshotRows.map((s) => ({
    id: s.id,
    type: classifySnapshotType(s.payloadJson),
    createdAt: s.createdAt,
    netWorthNgn: s.netWorthNgn,
    confidence: s.confidence,
    healthScore: s.healthScore,
    payload: (() => {
      try {
        return JSON.parse(s.payloadJson || "{}");
      } catch {
        return { raw: s.payloadJson };
      }
    })(),
  }));

  // Explicit omit — never export credential material
  const safeUser = omitCredentialFields({
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
    inboxItems: user.inboxItems,
    estateItems: user.estateItems,
    suitabilityAssessments: user.suitabilityAssessments,
    linkedAdvisers: user.adviserLinks.map((l) => l.adviser),
    adviserNotes: noteRows,
  });

  const pack = {
    exportedAt: new Date().toISOString(),
    purpose: "Customer data access / portability package",
    retentionNote:
      "Some records may be retained where required for audit, fraud prevention or legal obligation even after a deletion request.",
    includes: [
      "wealth_graph",
      "goals",
      "consents",
      "notifications",
      "inbox",
      "escalations",
      "monthly_reports",
      "weekly_digests",
      "adviser_shares",
      "adviser_nudges",
      "notification_preferences",
      "privacy_requests",
      "cadence_audit",
    ],
    cadence,
    wealthSnapshots,
    notificationPreferences: prefs
      ? {
          critical: prefs.critical,
          important: prefs.important,
          advisory: prefs.advisory,
          informational: prefs.informational,
          updatedAt: prefs.updatedAt.toISOString(),
        }
      : null,
    privacyRequests,
    cadenceAudit: shareAudits.map((a) => ({
      id: a.id,
      eventType: a.eventType,
      entityType: a.entityType,
      entityId: a.entityId,
      createdAt: a.createdAt.toISOString(),
      payload: (() => {
        try {
          return JSON.parse(a.payloadJson || "{}");
        } catch {
          return {};
        }
      })(),
    })),
    customer: safeUser,
  };

  if (!assertNoPasswordHash(pack)) {
    throw new Error("Privacy export aborted: credential material detected.");
  }

  return pack;
}

export async function loadPrivacyRequestsPulse(userId: string) {
  const rows = await prisma.privacyRequest.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
  return buildPrivacyRequestsPulse(rows);
}

export async function listPrivacyRequestsForAdmin(take = 100) {
  const rows = await prisma.privacyRequest.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });

  const customerIds = [...new Set(rows.map((r) => r.userId))];
  const [customers, careAcks] = await Promise.all([
    customerIds.length === 0
      ? Promise.resolve([])
      : prisma.user.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, name: true, email: true },
        }),
    customerIds.length === 0
      ? Promise.resolve([])
      : prisma.adviserNote.findMany({
          where: { customerId: { in: customerIds }, kind: "care_ack" },
          select: { customerId: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        }),
  ]);

  const customerById = new Map(customers.map((c) => [c.id, c]));
  const lastAckByCustomer = new Map<string, string>();
  for (const n of careAcks) {
    if (!lastAckByCustomer.has(n.customerId)) {
      lastAckByCustomer.set(n.customerId, n.createdAt.toISOString());
    }
  }

  return rows.map((r) => {
    const careAck = buildCaseCareAckCue({
      status: r.status,
      lastCareAckAt: lastAckByCustomer.get(r.userId) ?? null,
    });
    const customer = customerById.get(r.userId) ?? {
      id: r.userId,
      name: "Unknown customer",
      email: "",
    };
    return {
      id: r.id,
      userId: r.userId,
      type: r.type,
      status: r.status,
      details: r.details,
      resolution: r.resolution,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      customer,
      careAck,
    };
  });
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

  await createUserNotification({
    userId,
    category: "important",
    title: "Privacy request received",
    body: `Your ${type} request is logged. Operations will review it under our retention policy.`,
  });

  await createInboxFromDrafts(userId, [
    buildPrivacyInboxDraft({
      id: req.id,
      type: req.type,
      status: req.status,
      details: req.details,
    }),
  ]);

  return req;
}

export async function notifyPrivacyRequestUpdate(input: {
  userId: string;
  id: string;
  type: string;
  status: string;
  resolution: string;
  erasureApplied?: boolean;
}) {
  if (!input.erasureApplied) {
    await createUserNotification({
      userId: input.userId,
      category: "important",
      title: "Privacy request update",
      body: `Your ${input.type} request is now ${input.status}. ${input.resolution}`,
    });
  }

  if (input.status === "completed" || input.status === "rejected") {
    await prisma.inboxItem.updateMany({
      where: {
        userId: input.userId,
        sourceType: "privacy_request",
        sourceId: input.id,
        status: { in: ["unread", "read"] },
      },
      data: { status: "acted" },
    });
  }

  if (!input.erasureApplied) {
    await createInboxFromDrafts(input.userId, [
      buildPrivacyInboxDraft({
        id: input.id,
        type: input.type,
        status: input.status,
        resolution: input.resolution,
      }),
    ]);
  }
}
