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

  const [customers, escalations, privacy, careAcks] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: customerIds } },
      select: {
        id: true,
        name: true,
        email: true,
        profileCompleteness: true,
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
      select: { customerId: true, createdAt: true },
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
  for (const n of careAcks) {
    if (!lastAckByUser.has(n.customerId)) {
      lastAckByUser.set(n.customerId, n.createdAt.toISOString());
    }
  }

  const rows: PortfolioCustomerInput[] = customers.map((c) => {
    const esc = escByUser.get(c.id) ?? { open: 0, complaints: 0 };
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      profileCompleteness: c.profileCompleteness,
      openEscalations: esc.open,
      openComplaints: esc.complaints,
      openPrivacy: privacyByUser.get(c.id) ?? 0,
      lastCareAckAt: lastAckByUser.get(c.id) ?? null,
    };
  });

  return buildPortfolioCareRadar(rows);
}
