import { prisma } from "@/lib/db";
import { assertAdviserAccess, createAdviserNote } from "@/services/adviser-collab";
import { createUserNotification } from "@/services/notifications";
import { createInboxFromDrafts } from "@/services/inbox";
import {
  buildCareAckDraft,
  buildCareAckHistory,
  buildCareUpdatePulse,
  type CareAckKind,
} from "@/engines/adviser-care-ack";

export async function sendCareAcknowledgment(input: {
  adviserId: string;
  adviserRole: string;
  adviserName: string;
  customerId: string;
  kind: CareAckKind;
  message: string;
  itemId?: string;
  itemTitle?: string;
}) {
  await assertAdviserAccess(input.adviserId, input.customerId, input.adviserRole);

  const customer = await prisma.user.findUnique({
    where: { id: input.customerId },
    select: { id: true, name: true },
  });
  if (!customer) throw new Error("Customer not found.");

  const draft = buildCareAckDraft({
    kind: input.kind,
    customerName: customer.name,
    adviserName: input.adviserName,
    message: input.message,
    itemTitle: input.itemTitle,
  });

  const note = await createAdviserNote({
    adviserId: input.adviserId,
    customerId: input.customerId,
    kind: "care_ack",
    title: draft.title,
    body: draft.noteBody,
    sharedWithCustomer: true,
  });

  await createUserNotification({
    userId: input.customerId,
    category: "important",
    title: draft.title,
    body: draft.notificationBody,
  });

  await createInboxFromDrafts(input.customerId, [
    {
      category: "adviser",
      priority: "important",
      title: draft.inboxTitle,
      body: draft.notificationBody,
      href: draft.href,
      sourceType: "care_ack",
      sourceId: note.id,
    },
  ]);

  await prisma.auditEvent.create({
    data: {
      userId: input.adviserId,
      eventType: "ADVISER_CARE_ACK",
      entityType: "AdviserNote",
      entityId: note.id,
      payloadJson: JSON.stringify({
        customerId: input.customerId,
        kind: input.kind,
        itemId: input.itemId ?? null,
      }),
    },
  });

  return { noteId: note.id, title: draft.title, href: draft.href };
}

export async function loadCareAckHistory(customerId: string, limit = 5) {
  const notes = await prisma.adviserNote.findMany({
    where: { customerId, kind: "care_ack" },
    orderBy: { createdAt: "desc" },
    take: Math.max(limit, 20),
    include: { adviser: { select: { name: true } } },
  });

  return buildCareAckHistory(
    notes.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      createdAt: n.createdAt,
      adviserName: n.adviser.name,
    })),
    limit,
  );
}

export async function loadCareUpdatePulse(customerId: string) {
  const notes = await prisma.adviserNote.findMany({
    where: {
      customerId,
      kind: "care_ack",
      sharedWithCustomer: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { adviser: { select: { name: true } } },
  });

  return buildCareUpdatePulse(
    notes.map((n) => ({
      title: n.title,
      body: n.body,
      createdAt: n.createdAt,
      adviserName: n.adviser.name,
    })),
  );
}
