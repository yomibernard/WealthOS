import { prisma } from "@/lib/db";
import {
  canDeliver,
  displayCategory,
  type NotificationCategory,
} from "@/lib/notification-prefs";

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
