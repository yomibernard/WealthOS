import { prisma } from "@/lib/db";
import { automateLifeEvent } from "@/engines/life-events";
import { createInboxFromDrafts } from "@/services/inbox";
import { getFeatureFlags } from "@/lib/feature-flags";

export async function recordLifeEvent(input: {
  userId: string;
  type: string;
  label: string;
  date: Date;
  notes?: string;
}) {
  const automation = automateLifeEvent(input.type, input.label, input.notes);
  const flags = getFeatureFlags();

  const event = await prisma.lifeEvent.create({
    data: {
      userId: input.userId,
      type: input.type,
      label: input.label,
      date: input.date,
      notes: input.notes,
    },
  });

  await prisma.memoryEntry.create({
    data: {
      userId: input.userId,
      category: "life_event",
      content: automation.memoryNote,
      source: "life_events",
      verified: true,
    },
  });

  if (flags.lifeEventAuto) {
    await createInboxFromDrafts(
      input.userId,
      automation.inboxDrafts.map((d, idx) => ({
        ...d,
        sourceType: "life_event",
        sourceId: `${event.id}:${idx}`,
      })),
    );

    await prisma.notification.create({
      data: {
        userId: input.userId,
        category: "important",
        title: `Life event: ${input.label}`,
        body: `${automation.narrative} ${automation.disclaimer}`,
      },
    });
  }

  await prisma.auditEvent.create({
    data: {
      userId: input.userId,
      eventType: "LIFE_EVENT_CREATED",
      entityType: "LifeEvent",
      entityId: event.id,
      payloadJson: JSON.stringify({
        type: input.type,
        label: input.label,
        automation: flags.lifeEventAuto,
        engine: automation.engineVersion,
      }),
    },
  });

  return { event, automation };
}
