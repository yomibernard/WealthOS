import { prisma } from "@/lib/db";

export async function assertAdviserAccess(adviserId: string, customerId: string, role: string) {
  if (role === "ADMIN") return true;
  const link = await prisma.adviserCustomer.findUnique({
    where: { adviserId_customerId: { adviserId, customerId } },
  });
  if (!link) throw new Error("You are not linked to this customer.");
  return true;
}

export async function listAdviserNotes(customerId: string, opts?: { sharedOnly?: boolean }) {
  return prisma.adviserNote.findMany({
    where: {
      customerId,
      ...(opts?.sharedOnly ? { sharedWithCustomer: true } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { adviser: { select: { name: true } } },
  });
}

export async function createAdviserNote(input: {
  adviserId: string;
  customerId: string;
  kind: string;
  title: string;
  body: string;
  sharedWithCustomer: boolean;
}) {
  const note = await prisma.adviserNote.create({
    data: {
      adviserId: input.adviserId,
      customerId: input.customerId,
      kind: input.kind,
      title: input.title,
      body: input.body,
      sharedWithCustomer: input.sharedWithCustomer,
      status: "open",
    },
  });

  await prisma.auditEvent.create({
    data: {
      userId: input.adviserId,
      eventType: "ADVISER_NOTE_CREATED",
      entityType: "AdviserNote",
      entityId: note.id,
      payloadJson: JSON.stringify({
        customerId: input.customerId,
        shared: input.sharedWithCustomer,
        kind: input.kind,
      }),
    },
  });

  if (input.sharedWithCustomer) {
    await prisma.notification.create({
      data: {
        userId: input.customerId,
        category: "important",
        title: `Adviser shared: ${input.title}`,
        body: input.body.slice(0, 280),
      },
    });
    await prisma.inboxItem
      .upsert({
        where: {
          userId_sourceType_sourceId: {
            userId: input.customerId,
            sourceType: "adviser_note",
            sourceId: note.id,
          },
        },
        create: {
          userId: input.customerId,
          category: "adviser",
          priority: "important",
          title: input.title,
          body: input.body.slice(0, 280),
          href: "/app/adviser-collab",
          sourceType: "adviser_note",
          sourceId: note.id,
          status: "unread",
        },
        update: {
          title: input.title,
          body: input.body.slice(0, 280),
          status: "unread",
        },
      })
      .catch(() => null);
  }

  return note;
}

export type TimelineEvent = {
  id: string;
  at: string;
  kind: string;
  title: string;
  detail: string;
};

/** Customer collaboration timeline for adviser + customer views. */
export async function buildCustomerTimeline(customerId: string): Promise<TimelineEvent[]> {
  const [lifeEvents, notes, escalations, recommendations, audit] = await Promise.all([
    prisma.lifeEvent.findMany({
      where: { userId: customerId },
      orderBy: { date: "desc" },
      take: 12,
    }),
    prisma.adviserNote.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { adviser: { select: { name: true } } },
    }),
    prisma.escalation.findMany({
      where: { userId: customerId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.recommendation.findMany({
      where: { userId: customerId },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.auditEvent.findMany({
      where: {
        userId: customerId,
        eventType: { in: ["LIFE_EVENT_CREATED", "connection.sync", "PRIVACY_EXPORT"] },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const events: TimelineEvent[] = [];

  for (const e of lifeEvents) {
    events.push({
      id: `life:${e.id}`,
      at: e.date.toISOString(),
      kind: "life_event",
      title: e.label,
      detail: e.type.replaceAll("_", " "),
    });
  }
  for (const n of notes) {
    events.push({
      id: `note:${n.id}`,
      at: n.createdAt.toISOString(),
      kind: n.kind,
      title: n.title,
      detail: `${n.adviser.name}${n.sharedWithCustomer ? " · shared" : " · internal"}`,
    });
  }
  for (const e of escalations) {
    events.push({
      id: `esc:${e.id}`,
      at: e.createdAt.toISOString(),
      kind: "escalation",
      title: e.reason,
      detail: `${e.level} · ${e.status}`,
    });
  }
  for (const r of recommendations) {
    events.push({
      id: `rec:${r.id}`,
      at: r.updatedAt.toISOString(),
      kind: "recommendation",
      title: r.title,
      detail: r.status,
    });
  }
  for (const a of audit) {
    events.push({
      id: `audit:${a.id}`,
      at: a.createdAt.toISOString(),
      kind: "audit",
      title: a.eventType,
      detail: a.entityType ?? "",
    });
  }

  return events.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 40);
}
