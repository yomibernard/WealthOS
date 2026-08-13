import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

const createSchema = z.object({
  entityType: z.string(),
  entityId: z.string(),
  action: z.string(),
  payload: z.record(z.unknown()),
  makerNote: z.string().optional(),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }
  const rows = await prisma.changeRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ requests: rows });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }
  const body = createSchema.parse(await req.json());

  const existing = await prisma.changeRequest.findFirst({
    where: {
      entityType: body.entityType,
      entityId: body.entityId,
      status: "pending",
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A pending change request already exists for this item." },
      { status: 409 },
    );
  }

  const created = await prisma.changeRequest.create({
    data: {
      entityType: body.entityType,
      entityId: body.entityId,
      action: body.action,
      payloadJson: JSON.stringify(body.payload),
      makerId: user.id,
      makerNote: body.makerNote,
      status: "pending",
    },
  });

  await prisma.auditEvent.create({
    data: {
      userId: user.id,
      eventType: "CHANGE_REQUEST_CREATED",
      entityType: "ChangeRequest",
      entityId: created.id,
      payloadJson: JSON.stringify({
        action: body.action,
        entityType: body.entityType,
        entityId: body.entityId,
      }),
    },
  });

  return NextResponse.json({ ok: true, id: created.id });
}
