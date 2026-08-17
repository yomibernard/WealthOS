import { prisma } from "@/lib/db";
import {
  buildPortfolioCareRadar,
  type PortfolioCustomerInput,
} from "@/engines/adviser-portfolio";
import { classifyEscalationReason } from "@/engines/escalation-ops";

export async function loadAdviserPortfolioCareRadar(input: {
  adviserId: string;
  role: string;
}) {
  const links =
    input.role === "ADMIN"
      ? null
      : await prisma.adviserCustomer.findMany({
          where: { adviserId: input.adviserId },
          select: { customerId: true },
        });

  const customerIds =
    input.role === "ADMIN"
      ? (
          await prisma.user.findMany({
            where: { role: "CUSTOMER" },
            select: { id: true },
          })
        ).map((u) => u.id)
      : (links ?? []).map((l) => l.customerId);

  if (customerIds.length === 0) {
    return buildPortfolioCareRadar([]);
  }

  const [customers, escalations, privacy, careAcks, opsReminds, goals, snapshots] =
    await Promise.all([
      prisma.user.findMany({
        where: { id: { in: customerIds } },
        select: {
          id: true,
          name: true,
          email: true,
          profileCompleteness: true,
          riskTolerance: true,
          avatarStorageKey: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.escalation.findMany({
        where: {
          userId: { in: customerIds },
          status: { in: ["open", "in_progress"] },
        },
        select: { userId: true, reason: true },
      }),
      prisma.privacyRequest.findMany({
        where: {
          userId: { in: customerIds },
          status: { in: ["open", "in_progress"] },
        },
        select: { userId: true },
      }),
      prisma.adviserNote.findMany({
        where: {
          customerId: { in: customerIds },
          kind: "care_ack",
        },
        select: { customerId: true, createdAt: true, status: true, sharedWithCustomer: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditEvent.findMany({
        where: {
          eventType: "OPS_CARE_REMIND",
          entityId: { in: customerIds },
        },
        select: { entityId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.goal.findMany({
        where: { userId: { in: customerIds } },
        select: { userId: true, name: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.wealthSnapshot.findMany({
        where: { userId: { in: customerIds } },
        select: {
          userId: true,
          netWorthNgn: true,
          healthScore: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const escByUser = new Map<string, { open: number; complaints: number }>();
  for (const e of escalations) {
    const cur = escByUser.get(e.userId) ?? { open: 0, complaints: 0 };
    cur.open += 1;
    if (classifyEscalationReason(e.reason) === "complaint") cur.complaints += 1;
    escByUser.set(e.userId, cur);
  }

  const privacyByUser = new Map<string, number>();
  for (const p of privacy) {
    privacyByUser.set(p.userId, (privacyByUser.get(p.userId) ?? 0) + 1);
  }

  const lastAckByUser = new Map<string, string>();
  const unseenByUser = new Map<string, number>();
  for (const n of careAcks) {
    if (!lastAckByUser.has(n.customerId)) {
      lastAckByUser.set(n.customerId, n.createdAt.toISOString());
    }
    if (n.sharedWithCustomer && (n.status ?? "open").toLowerCase() !== "seen") {
      unseenByUser.set(n.customerId, (unseenByUser.get(n.customerId) ?? 0) + 1);
    }
  }

  const lastOpsRemindByUser = new Map<string, string>();
  for (const e of opsReminds) {
    if (!e.entityId || lastOpsRemindByUser.has(e.entityId)) continue;
    lastOpsRemindByUser.set(e.entityId, e.createdAt.toISOString());
  }

  const goalByUser = new Map<string, string>();
  for (const g of goals) {
    if (!goalByUser.has(g.userId)) goalByUser.set(g.userId, g.name);
  }

  const snapByUser = new Map<string, { netWorthNgn: number; healthScore: number | null }>();
  for (const s of snapshots) {
    if (snapByUser.has(s.userId)) continue;
    snapByUser.set(s.userId, {
      netWorthNgn: s.netWorthNgn,
      healthScore: s.healthScore,
    });
  }

  const rows: PortfolioCustomerInput[] = customers.map((c) => {
    const esc = escByUser.get(c.id) ?? { open: 0, complaints: 0 };
    const snap = snapByUser.get(c.id);
    const lastCareAckAt = lastAckByUser.get(c.id) ?? null;
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      profileCompleteness: c.profileCompleteness,
      riskTolerance: c.riskTolerance,
      avatarStorageKey: c.avatarStorageKey,
      openEscalations: esc.open,
      openComplaints: esc.complaints,
      openPrivacy: privacyByUser.get(c.id) ?? 0,
      lastCareAckAt,
      unseenCareAckCount: unseenByUser.get(c.id) ?? 0,
      lastOpsRemindAt: lastOpsRemindByUser.get(c.id) ?? null,
      netWorthNgn: snap?.netWorthNgn ?? null,
      healthScore: snap?.healthScore ?? null,
      primaryGoal: goalByUser.get(c.id) ?? null,
      lastContactAt: lastCareAckAt,
    };
  });

  return buildPortfolioCareRadar(rows);
}
