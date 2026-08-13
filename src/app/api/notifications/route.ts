import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { canDeliver } from "@/lib/notification-prefs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const prefs = await prisma.notificationPreference.findUnique({ where: { userId: user.id } });
  const notes = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const filtered = notes.filter((n) => canDeliver(prefs, n.category));

  return NextResponse.json(filtered);
}
