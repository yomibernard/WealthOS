import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { requireFlag } from "@/lib/feature-flags";
import { updateInboxItem } from "@/services/inbox";

const schema = z.object({
  status: z.enum(["read", "unread", "dismissed", "acted"]),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const flag = requireFlag("wealthInbox");
  if (!flag.ok) return NextResponse.json({ error: flag.error }, { status: 503 });

  const { id } = await params;
  try {
    const body = schema.parse(await req.json());
    const item = await updateInboxItem(user.id, id, body.status);
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed." },
      { status: 400 },
    );
  }
}
