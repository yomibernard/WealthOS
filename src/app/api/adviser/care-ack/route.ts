import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { requireFlag } from "@/lib/feature-flags";
import { sendCareAcknowledgment } from "@/services/adviser-care-ack";

const schema = z.object({
  customerId: z.string().min(1),
  kind: z.enum(["complaint", "support", "escalation", "privacy"]),
  message: z.string().min(3).max(500),
  itemId: z.string().optional(),
  itemTitle: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const flag = requireFlag("adviserCollab");
  if (!flag.ok) return NextResponse.json({ error: flag.error }, { status: 503 });
  if (user.role !== "ADVISER" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only advisers can send care acknowledgments." }, { status: 403 });
  }

  try {
    const body = schema.parse(await req.json());
    const result = await sendCareAcknowledgment({
      adviserId: user.id,
      adviserRole: user.role,
      adviserName: user.name,
      customerId: body.customerId,
      kind: body.kind,
      message: body.message,
      itemId: body.itemId,
      itemTitle: body.itemTitle,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not send acknowledgment." },
      { status: 400 },
    );
  }
}
