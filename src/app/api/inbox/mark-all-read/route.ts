import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { requireFlag } from "@/lib/feature-flags";
import { markAllInboxRead } from "@/services/inbox";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const flag = requireFlag("wealthInbox");
  if (!flag.ok) return NextResponse.json({ error: flag.error }, { status: 503 });

  const result = await markAllInboxRead(user.id);
  return NextResponse.json({ ok: true, ...result });
}
