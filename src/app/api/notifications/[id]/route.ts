import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { markNotificationRead } from "@/services/notifications";

const schema = z.object({
  read: z.literal(true),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const { id } = await ctx.params;
  try {
    schema.parse(await req.json().catch(() => ({})));
    const result = await markNotificationRead({
      userId: user.id,
      notificationId: id,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not update notification." },
      { status: 400 },
    );
  }
}
