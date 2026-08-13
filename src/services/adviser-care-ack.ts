import { prisma } from "@/lib/db";
import { assertAdviserAccess, createAdviserNote } from "@/services/adviser-collab";
import { createUserNotification } from "@/services/notifications";
import { createInboxFromDrafts } from "@/services/inbox";
import {
  appendCareReceipt,
  buildCareAckDraft,
  buildCareAckHistory,
  buildCareUpdateList,
  buildCareUpdatePulse,
  isCareAckSeen,
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
      status: n.status,
    })),
    limit,
  );
}

async function loadRecentCareAckNotes(customerId: string) {
  return prisma.adviserNote.findMany({
    where: {
      customerId,
      kind: "care_ack",
      sharedWithCustomer: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { adviser: { select: { name: true } } },
  });
}

export async function loadCareUpdatePulse(customerId: string) {
  const notes = await loadRecentCareAckNotes(customerId);
  return buildCareUpdatePulse(
    notes.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      createdAt: n.createdAt,
      adviserName: n.adviser.name,
      status: n.status,
    })),
  );
}

/** Recent care updates including seen receipts (Support / Privacy lists). */
export async function loadCareUpdateList(customerId: string) {
  const notes = await loadRecentCareAckNotes(customerId);
  return buildCareUpdateList(
    notes.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      createdAt: n.createdAt,
      adviserName: n.adviser.name,
      status: n.status,
    })),
  );
}

/** Customer marks a care acknowledgment as seen (optional thanks). Does not close ops. */
export async function markCareUpdateSeen(input: {
  customerId: string;
  noteId: string;
  thanks?: string | null;
}) {
  const note = await prisma.adviserNote.findFirst({
    where: {
      id: input.noteId,
      customerId: input.customerId,
      kind: "care_ack",
      sharedWithCustomer: true,
    },
  });
  if (!note) throw new Error("Care update not found.");

  if (isCareAckSeen(note.status)) {
    return { noteId: note.id, alreadySeen: true as const };
  }

  const seenAt = new Date().toISOString();
  const body = appendCareReceipt(note.body, seenAt, input.thanks);

  await prisma.adviserNote.update({
    where: { id: note.id },
    data: { status: "seen", body },
  });

  await prisma.inboxItem.updateMany({
    where: {
      userId: input.customerId,
      sourceType: "care_ack",
      sourceId: note.id,
      status: { in: ["unread", "read"] },
    },
    data: { status: "acted" },
  });

  await prisma.auditEvent.create({
    data: {
      userId: input.customerId,
      eventType: "CUSTOMER_CARE_RECEIPT",
      entityType: "AdviserNote",
      entityId: note.id,
      payloadJson: JSON.stringify({
        thanks: Boolean((input.thanks ?? "").trim()),
      }),
    },
  });

  return { noteId: note.id, alreadySeen: false as const, seenAt };
}
