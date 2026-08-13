import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const prefs = await prisma.notificationPreference.findUnique({ where: { userId: user.id } });
  const notes = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const filtered = notes.filter((n) => {
    if (!prefs) return true;
    if (n.category === "Critical") return prefs.critical;
    if (n.category === "Important") return prefs.important;
    if (n.category === "Advisory") return prefs.advisory;
    if (n.category === "Informational") return prefs.informational;
    return true;
  });

  return NextResponse.json(filtered);
}
