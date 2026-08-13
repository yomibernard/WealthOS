import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { requireFlag } from "@/lib/feature-flags";
import { listInbox, refreshInbox } from "@/services/inbox";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const flag = requireFlag("wealthInbox");
  if (!flag.ok) return NextResponse.json({ error: flag.error }, { status: 503 });

  const url = new URL(req.url);
  if (url.searchParams.get("refresh") === "1") {
    await refreshInbox(user.id);
  }

  const items = await listInbox(user.id);
  const unread = items.filter((i) => i.status === "unread").length;
  return NextResponse.json({ items, unread });
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const flag = requireFlag("wealthInbox");
  if (!flag.ok) return NextResponse.json({ error: flag.error }, { status: 503 });

  const result = await refreshInbox(user.id);
  const items = await listInbox(user.id);
  return NextResponse.json({ ...result, items });
}
