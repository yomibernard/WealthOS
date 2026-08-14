import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { markAllNotificationsRead } from "@/services/notifications";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const result = await markAllNotificationsRead(user.id);
  return NextResponse.json({ ok: true, ...result });
}
