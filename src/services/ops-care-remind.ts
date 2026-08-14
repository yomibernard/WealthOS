import { prisma } from "@/lib/db";
import { createUserNotification } from "@/services/notifications";
import { buildOpsCareRemindDraft } from "@/engines/ops-care-remind";

async function loadUnackedCareCustomerIds(customerId?: string): Promise<string[]> {
  const [openEscByUser, openPrivacyByUser, careAcks] = await Promise.all([
    prisma.escalation.findMany({
      where: {
        status: { in: ["open", "in_progress"] },
        ...(customerId ? { userId: customerId } : {}),
      },
      select: { userId: true },
    }),
    prisma.privacyRequest.findMany({
      where: {
        status: { in: ["open", "in_progress"] },
        ...(customerId ? { userId: customerId } : {}),
      },
      select: { userId: true },
    }),
    prisma.adviserNote.findMany({
      where: { kind: "care_ack" },
      select: { customerId: true },
      distinct: ["customerId"],
    }),
  ]);

  const openCareCustomerIds = new Set<string>();
  for (const e of openEscByUser) openCareCustomerIds.add(e.userId);
  for (const p of openPrivacyByUser) openCareCustomerIds.add(p.userId);
  const ackedCustomerIds = new Set(careAcks.map((n) => n.customerId));
  return [...openCareCustomerIds].filter((id) => !ackedCustomerIds.has(id));
}

export async function sendOpsCareReminds(input: {
  adminId: string;
  adminName: string;
  customerId?: string;
}) {
  const unackedIds = await loadUnackedCareCustomerIds(input.customerId);
  if (input.customerId && !unackedIds.includes(input.customerId)) {
    throw new Error("Customer is not in the unacked care handoff list.");
  }
  if (!unackedIds.length) {
    return { reminded: 0 as const, skipped: 0 as const, results: [] as const };
  }

  const customers = await prisma.user.findMany({
    where: { id: { in: unackedIds } },
    select: {
      id: true,
      name: true,
      adviserLinks: {
        take: 1,
        orderBy: { createdAt: "asc" },
        select: { adviserId: true },
      },
    },
  });

  const results: Array<{
    customerId: string;
    customerName: string;
    adviserId: string | null;
    created: boolean;
    reason?: string;
  }> = [];

  let reminded = 0;
  let skipped = 0;

  for (const customer of customers) {
    const adviserId = customer.adviserLinks[0]?.adviserId ?? null;
    if (!adviserId) {
      skipped += 1;
      results.push({
        customerId: customer.id,
        customerName: customer.name,
        adviserId: null,
        created: false,
        reason: "no_linked_adviser",
      });
      continue;
    }

    const draft = buildOpsCareRemindDraft({
      customerId: customer.id,
      customerName: customer.name,
      adminName: input.adminName,
    });

    const note = await createUserNotification({
      userId: adviserId,
      category: "important",
      title: draft.title,
      body: draft.body,
      force: true,
    });

    await prisma.auditEvent.create({
      data: {
        userId: input.adminId,
        eventType: "OPS_CARE_REMIND",
        entityType: "User",
        entityId: customer.id,
        payloadJson: JSON.stringify({
          customerId: customer.id,
          adviserId,
          notificationCreated: note.created,
          queuesUnchanged: true,
        }),
      },
    });

    if (note.created) {
      reminded += 1;
      results.push({
        customerId: customer.id,
        customerName: customer.name,
        adviserId,
        created: true,
      });
    } else {
      skipped += 1;
      results.push({
        customerId: customer.id,
        customerName: customer.name,
        adviserId,
        created: false,
        reason: "reason" in note ? note.reason : "not_created",
      });
    }
  }

  return { reminded, skipped, results };
}
