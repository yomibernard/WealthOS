import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

const schema = z.object({
  decision: z.enum(["approve", "reject"]),
  checkerNote: z.string().min(1),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }
  const { id } = await params;
  const body = schema.parse(await req.json());

  const change = await prisma.changeRequest.findUnique({ where: { id } });
  if (!change || change.status !== "pending") {
    return NextResponse.json({ error: "Change request not found or already decided." }, { status: 404 });
  }

  if (change.makerId === user.id) {
    return NextResponse.json(
      { error: "Maker-checker control: you cannot approve your own change request." },
      { status: 403 },
    );
  }

  if (body.decision === "reject") {
    await prisma.changeRequest.update({
      where: { id },
      data: {
        status: "rejected",
        checkerId: user.id,
        checkerNote: body.checkerNote,
        decidedAt: new Date(),
      },
    });
    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        eventType: "CHANGE_REQUEST_REJECTED",
        entityType: "ChangeRequest",
        entityId: id,
        payloadJson: JSON.stringify({ checkerNote: body.checkerNote }),
      },
    });
    return NextResponse.json({ ok: true, status: "rejected" });
  }

  const payload = JSON.parse(change.payloadJson) as { approvalStatus?: string };

  if (change.entityType === "Product" && change.action === "SET_APPROVAL_STATUS") {
    await prisma.product.update({
      where: { id: change.entityId },
      data: { approvalStatus: payload.approvalStatus ?? "pending" },
    });
  }

  await prisma.changeRequest.update({
    where: { id },
    data: {
      status: "approved",
      checkerId: user.id,
      checkerNote: body.checkerNote,
      decidedAt: new Date(),
    },
  });

  await prisma.auditEvent.create({
    data: {
      userId: user.id,
      eventType: "CHANGE_REQUEST_APPROVED",
      entityType: change.entityType,
      entityId: change.entityId,
      payloadJson: JSON.stringify({
        changeRequestId: id,
        action: change.action,
        payload,
        checkerNote: body.checkerNote,
      }),
    },
  });

  return NextResponse.json({ ok: true, status: "approved" });
}
