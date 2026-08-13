import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

const schema = z.object({
  status: z.enum(["ACTIVE", "PAUSED", "REVOKED"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { id } = await params;
  const body = schema.parse(await req.json());

  const consent = await prisma.consent.findFirst({ where: { id, userId: user.id } });
  if (!consent) return NextResponse.json({ error: "Consent not found." }, { status: 404 });

  await prisma.consent.update({
    where: { id },
    data: { status: body.status },
  });

  await prisma.auditEvent.create({
    data: {
      userId: user.id,
      eventType: "CONSENT_UPDATED",
      entityType: "Consent",
      entityId: id,
      payloadJson: JSON.stringify({ status: body.status, serviceName: consent.serviceName }),
    },
  });

  return NextResponse.json({ ok: true });
}
