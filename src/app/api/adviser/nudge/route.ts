import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { requireFlag } from "@/lib/feature-flags";
import { sendAdviserNudge } from "@/services/adviser-nudge";

const schema = z.object({
  customerId: z.string().min(1),
  nudgeType: z.enum([
    "refresh_data",
    "complete_profile",
    "generate_digest",
    "review_funding",
    "review_actions",
  ]),
  personalNote: z.string().max(400).optional(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const flag = requireFlag("adviserCollab");
  if (!flag.ok) return NextResponse.json({ error: flag.error }, { status: 503 });

  if (user.role !== "ADVISER" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only advisers can send nudges." }, { status: 403 });
  }

  try {
    const body = schema.parse(await req.json());
    const result = await sendAdviserNudge({
      adviserId: user.id,
      adviserRole: user.role,
      adviserName: user.name,
      customerId: body.customerId,
      nudgeType: body.nudgeType,
      personalNote: body.personalNote,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not send nudge." },
      { status: 400 },
    );
  }
}
