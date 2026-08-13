import { prisma } from "@/lib/db";
import {
  canDeliver,
  displayCategory,
  type NotificationCategory,
} from "@/lib/notification-prefs";
import { buildAdviserNotificationPulse } from "@/engines/adviser-notifications";

export async function createUserNotification(input: {
  userId: string;
  category: NotificationCategory | string;
  title: string;
  body: string;
  /** When true, still create even if prefs would suppress (reserved for future critical paths). */
  force?: boolean;
}) {
  const category = displayCategory(input.category);
  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId: input.userId },
  });

  if (!input.force && !canDeliver(prefs, category)) {
    return { created: false as const, reason: "suppressed_by_preferences" as const };
  }

  const note = await prisma.notification.create({
    data: {
      userId: input.userId,
      category,
      title: input.title,
      body: input.body.slice(0, 1800),
    },
  });

  return { created: true as const, notification: note };
}

export async function listUserNotifications(userId: string, take = 50) {
  const prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
  const notes = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
  return notes.filter((n) => canDeliver(prefs, n.category));
}

export async function loadAdviserNotificationPulse(adviserId: string) {
  const notes = await listUserNotifications(adviserId, 50);
  return buildAdviserNotificationPulse(
    notes.map((n) => ({
      id: n.id,
      category: n.category,
      title: n.title,
      body: n.body,
      read: n.read,
      createdAt: n.createdAt,
    })),
  );
}

export async function markNotificationRead(input: {
  userId: string;
  notificationId: string;
}) {
  const note = await prisma.notification.findFirst({
    where: { id: input.notificationId, userId: input.userId },
  });
  if (!note) throw new Error("Notification not found.");
  if (note.read) return { id: note.id, alreadyRead: true as const };
  await prisma.notification.update({
    where: { id: note.id },
    data: { read: true },
  });
  return { id: note.id, alreadyRead: false as const };
}
