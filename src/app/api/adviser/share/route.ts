import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { getFeatureFlags } from "@/lib/feature-flags";
import { sharePackWithAdviser } from "@/services/adviser-share";

const schema = z.object({
  packType: z.enum(["weekly_digest", "profile", "funding", "full"]).default("full"),
  noteFromCustomer: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (user.role !== "CUSTOMER" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Customer share only." }, { status: 403 });
  }
  if (!getFeatureFlags().adviserCollab) {
    return NextResponse.json({ error: "Adviser collaboration is unavailable." }, { status: 503 });
  }

  try {
    const body = schema.parse(await req.json());
    const result = await sharePackWithAdviser({
      customerId: user.id,
      packType: body.packType,
      noteFromCustomer: body.noteFromCustomer,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Could not share with adviser." }, { status: 400 });
  }
}
