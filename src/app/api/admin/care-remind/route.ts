import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { sendOpsCareReminds } from "@/services/ops-care-remind";

const schema = z.object({
  customerId: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  try {
    const body = schema.parse(await req.json().catch(() => ({})));
    const result = await sendOpsCareReminds({
      adminId: user.id,
      adminName: user.name,
      customerId: body.customerId,
    });
    return NextResponse.json({
      ok: true,
      ...result,
      note: "Reminders do not close escalation or privacy queues.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not send care remind." },
      { status: 400 },
    );
  }
}
