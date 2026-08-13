import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { listUserNotifications } from "@/services/notifications";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const notes = await listUserNotifications(user.id);
  return NextResponse.json(
    notes.map((n) => ({
      id: n.id,
      category: n.category,
      title: n.title,
      body: n.body,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
  );
}
