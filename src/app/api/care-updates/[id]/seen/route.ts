import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { markCareUpdateSeen } from "@/services/adviser-care-ack";

const schema = z.object({
  thanks: z.string().max(200).optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Customers only." }, { status: 403 });
  }

  const { id } = await ctx.params;
  try {
    const body = schema.parse(await req.json().catch(() => ({})));
    const result = await markCareUpdateSeen({
      customerId: user.id,
      noteId: id,
      thanks: body.thanks,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not mark as seen." },
      { status: 400 },
    );
  }
}
