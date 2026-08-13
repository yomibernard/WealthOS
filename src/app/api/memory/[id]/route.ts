import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

const patchSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { id } = await params;
  const body = patchSchema.parse(await req.json());

  const memory = await prisma.memoryEntry.findFirst({ where: { id, userId: user.id } });
  if (!memory || !memory.editable) {
    return NextResponse.json({ error: "This memory cannot be edited." }, { status: 404 });
  }

  await prisma.memoryEntry.update({
    where: { id },
    data: { content: body.content, verified: true, source: "customer_correction" },
  });

  await prisma.auditEvent.create({
    data: {
      userId: user.id,
      eventType: "MEMORY_CORRECTED",
      entityType: "MemoryEntry",
      entityId: id,
      payloadJson: JSON.stringify({ previous: memory.content, next: body.content }),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { id } = await params;

  const memory = await prisma.memoryEntry.findFirst({ where: { id, userId: user.id } });
  if (!memory || !memory.editable) {
    return NextResponse.json({ error: "This memory cannot be removed." }, { status: 404 });
  }

  await prisma.memoryEntry.delete({ where: { id } });
  await prisma.auditEvent.create({
    data: {
      userId: user.id,
      eventType: "MEMORY_DELETED",
      entityType: "MemoryEntry",
      entityId: id,
      payloadJson: JSON.stringify({ content: memory.content }),
    },
  });

  return NextResponse.json({ ok: true });
}
