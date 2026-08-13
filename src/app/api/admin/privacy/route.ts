import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { applyErasure } from "@/services/erasure";
import { notifyPrivacyRequestUpdate } from "@/services/privacy";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }
  const rows = await prisma.privacyRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ requests: rows });
}

const patchSchema = z.object({
  id: z.string(),
  status: z.enum(["open", "in_progress", "completed", "rejected"]),
  resolution: z.string().min(1),
  applyErasure: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }
  const body = patchSchema.parse(await req.json());

  const existing = await prisma.privacyRequest.findUnique({ where: { id: body.id } });
  if (!existing) return NextResponse.json({ error: "Request not found." }, { status: 404 });

  let erasureApplied = false;
  if (
    body.status === "completed" &&
    existing.type === "erasure" &&
    (body.applyErasure ?? true)
  ) {
    await applyErasure(existing.userId, user.id);
    erasureApplied = true;
  }

  const updated = await prisma.privacyRequest.update({
    where: { id: body.id },
    data: {
      status: body.status,
      resolution: body.resolution,
      handledBy: user.id,
    },
  });

  await prisma.auditEvent.create({
    data: {
      userId: user.id,
      eventType: "PRIVACY_REQUEST_UPDATED",
      entityType: "PrivacyRequest",
      entityId: body.id,
      payloadJson: JSON.stringify({ ...body, erasureApplied }),
    },
  });

  await notifyPrivacyRequestUpdate({
    userId: updated.userId,
    id: updated.id,
    type: updated.type,
    status: body.status,
    resolution: body.resolution,
    erasureApplied,
  });

  return NextResponse.json({ ...updated, erasureApplied });
}
