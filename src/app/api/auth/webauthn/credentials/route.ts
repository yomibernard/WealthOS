import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [credentials, events] = await Promise.all([
    prisma.webAuthnCredential.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        label: true,
        deviceType: true,
        backedUp: true,
        createdAt: true,
        lastUsedAt: true,
      },
    }),
    prisma.authSessionEvent.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);
  return NextResponse.json({ credentials, events });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const row = await prisma.webAuthnCredential.findFirst({
    where: { id, userId: user.id },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.webAuthnCredential.delete({ where: { id } });
  await prisma.authSessionEvent.create({
    data: { userId: user.id, kind: "WEBAUTHN_REMOVED", detail: row.label ?? row.id },
  });
  return NextResponse.json({ ok: true });
}
