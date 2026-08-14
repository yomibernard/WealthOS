import { prisma } from "@/lib/db";
import { evaluateLaunchGate } from "@/lib/launch-gate";
import { getFeatureFlags } from "@/lib/feature-flags";
import { buildOpsCareHandoff, buildOpsDailyBoard } from "@/engines/ops-daily";
import { classifyEscalationReason } from "@/engines/escalation-ops";
import { riskyFlagsOn } from "@/engines/flag-profiles";
import { parseCareReceipt } from "@/engines/adviser-care-ack";

export async function loadOpsDailyBoard() {
  const [
    openEscalations,
    openEscalationRows,
    openPrivacy,
    pendingChangeRequests,
    recentComplaints,
    openEscByUser,
    openPrivacyByUser,
    careAcks,
    recentCareAcks,
    recentCareReceipts,
    recentCareReminds,
    awaitingReceiptCount,
  ] = await Promise.all([
    prisma.escalation.count({
      where: { status: { in: ["open", "in_progress"] } },
    }),
    prisma.escalation.findMany({
      where: { status: { in: ["open", "in_progress"] } },
      select: { reason: true },
      take: 200,
    }),
    prisma.privacyRequest.count({
      where: { status: { in: ["open", "in_progress"] } },
    }),
    prisma.changeRequest.count({ where: { status: "pending" } }),
    prisma.escalation.findMany({
      where: {
        status: { in: ["open", "in_progress"] },
        reason: { startsWith: "COMPLAINT:" },
      },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.escalation.findMany({
      where: { status: { in: ["open", "in_progress"] } },
      select: { userId: true },
    }),
    prisma.privacyRequest.findMany({
      where: { status: { in: ["open", "in_progress"] } },
      select: { userId: true },
    }),
    prisma.adviserNote.findMany({
      where: { kind: "care_ack" },
      select: { customerId: true },
      distinct: ["customerId"],
    }),
    prisma.adviserNote.findMany({
      where: { kind: "care_ack" },
      include: {
        customer: { select: { name: true } },
        adviser: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.adviserNote.findMany({
      where: {
        kind: "care_ack",
        sharedWithCustomer: true,
        status: "seen",
      },
      include: {
        customer: { select: { name: true } },
        adviser: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.auditEvent.findMany({
      where: { eventType: "OPS_CARE_REMIND" },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.adviserNote.count({
      where: {
        kind: "care_ack",
        sharedWithCustomer: true,
        status: { not: "seen" },
      },
    }),
  ]);

  const openComplaints = openEscalationRows.filter(
    (e) => classifyEscalationReason(e.reason) === "complaint",
  ).length;

  const openCareCustomerIds = new Set<string>();
  for (const e of openEscByUser) openCareCustomerIds.add(e.userId);
  for (const p of openPrivacyByUser) openCareCustomerIds.add(p.userId);
  const ackedCustomerIds = new Set(careAcks.map((n) => n.customerId));
  const unackedCareCustomers = [...openCareCustomerIds].filter(
    (id) => !ackedCustomerIds.has(id),
  ).length;

  const launch = evaluateLaunchGate();
  const blockers = launch.checks
    .filter((c) => c.severity === "blocker" && !c.ok)
    .map((c) => c.id);
  const flags = getFeatureFlags();
  const risky = riskyFlagsOn(flags);

  const board = buildOpsDailyBoard({
    openEscalations,
    openComplaints,
    openPrivacy,
    pendingChangeRequests,
    launchBlocked: !launch.ok,
    launchBlockers: blockers,
    riskyFlagsOn: risky.length,
    unackedCareCustomers,
  });

  const customerIdsFromReminds = [
    ...new Set(
      recentCareReminds
        .map((e) => e.entityId)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];
  const remindCustomers =
    customerIdsFromReminds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: customerIdsFromReminds } },
          select: { id: true, name: true },
        })
      : [];
  const remindCustomerName = new Map(remindCustomers.map((c) => [c.id, c.name]));

  const careHandoff = buildOpsCareHandoff({
    unackedCareCustomers,
    awaitingReceiptCount,
    recentAcks: recentCareAcks.map((n) => ({
      id: n.id,
      customerName: n.customer.name,
      adviserName: n.adviser.name,
      title: n.title,
      createdAt: n.createdAt.toISOString(),
    })),
    recentReceipts: recentCareReceipts.map((n) => {
      const receipt = parseCareReceipt(n.body);
      return {
        id: n.id,
        customerName: n.customer.name,
        adviserName: n.adviser.name,
        title: n.title,
        seenAt: receipt.seenAt ?? n.updatedAt.toISOString(),
        thanksPreview: receipt.thanksPreview,
      };
    }),
    recentReminds: recentCareReminds.map((e) => {
      let payload: {
        customerName?: string;
        adminName?: string;
        notificationCreated?: boolean;
      } = {};
      try {
        payload = JSON.parse(e.payloadJson) as typeof payload;
      } catch {
        payload = {};
      }
      const customerId = e.entityId ?? "";
      return {
        id: e.id,
        customerName:
          payload.customerName ??
          remindCustomerName.get(customerId) ??
          (customerId ? `Customer ${customerId.slice(0, 8)}…` : "Customer"),
        adminName: payload.adminName ?? e.user?.name ?? "Ops",
        createdAt: e.createdAt.toISOString(),
        notificationCreated: Boolean(payload.notificationCreated),
      };
    }),
  });

  const flagEntries = Object.entries(flags).map(([key, on]) => ({ key, on }));

  return {
    generatedAt: new Date().toISOString(),
    ...board,
    careHandoff,
    launch: {
      ok: launch.ok,
      profile: launch.profile,
      blockers,
    },
    topComplaints: recentComplaints.map((c) => ({
      id: c.id,
      reason: c.reason,
      status: c.status,
      customerName: c.user.name,
      customerEmail: c.user.email,
      createdAt: c.createdAt.toISOString(),
    })),
    counts: {
      openEscalations,
      openComplaints,
      openPrivacy,
      pendingChangeRequests,
      unackedCareCustomers,
      awaitingReceiptCount,
    },
    flags: flagEntries,
  };
}
