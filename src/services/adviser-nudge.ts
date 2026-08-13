import { prisma } from "@/lib/db";
import { assertAdviserAccess, createAdviserNote } from "@/services/adviser-collab";
import { buildAdviserNudge, type NudgeType } from "@/engines/adviser-nudge";

export async function sendAdviserNudge(input: {
  adviserId: string;
  adviserRole: string;
  adviserName: string;
  customerId: string;
  nudgeType: NudgeType;
  personalNote?: string;
}) {
  await assertAdviserAccess(input.adviserId, input.customerId, input.adviserRole);

  const nudge = buildAdviserNudge(
    input.nudgeType,
    input.adviserName,
    input.personalNote,
  );

  const note = await createAdviserNote({
    adviserId: input.adviserId,
    customerId: input.customerId,
    kind: "adviser_nudge",
    title: nudge.title,
    body: nudge.noteBody,
    sharedWithCustomer: true,
  });

  await prisma.inboxItem
    .updateMany({
      where: {
        userId: input.customerId,
        sourceType: "adviser_note",
        sourceId: note.id,
      },
      data: {
        category: "adviser",
        priority: nudge.priority,
        href: nudge.href,
        body: nudge.body.slice(0, 280),
      },
    })
    .catch(() => null);

  await prisma.auditEvent.create({
    data: {
      userId: input.adviserId,
      eventType: "ADVISER_NUDGE_SENT",
      entityType: "AdviserNote",
      entityId: note.id,
      payloadJson: JSON.stringify({
        customerId: input.customerId,
        nudgeType: input.nudgeType,
        version: nudge.version,
        href: nudge.href,
      }),
    },
  });

  return {
    noteId: note.id,
    nudgeType: nudge.type,
    title: nudge.title,
    href: nudge.href,
  };
}
