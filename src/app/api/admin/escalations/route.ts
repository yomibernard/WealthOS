import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { listEscalationsForAdmin, updateEscalationCase } from "@/services/escalation-ops";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }
  const cases = await listEscalationsForAdmin();
  return NextResponse.json({ cases });
}

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["open", "in_progress", "resolved", "rejected"]),
  resolution: z.string().min(1).max(2000),
});

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const body = patchSchema.parse(await req.json());
  const result = await updateEscalationCase({
    id: body.id,
    status: body.status,
    resolution: body.resolution,
    adminId: user.id,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json(result.escalation);
}
