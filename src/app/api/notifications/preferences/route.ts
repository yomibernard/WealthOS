import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

const schema = z.object({
  critical: z.boolean(),
  important: z.boolean(),
  advisory: z.boolean(),
  informational: z.boolean(),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const prefs =
    (await prisma.notificationPreference.findUnique({ where: { userId: user.id } })) ??
    (await prisma.notificationPreference.create({
      data: { userId: user.id },
    }));

  return NextResponse.json(prefs);
}

export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const body = schema.parse(await req.json());

  // Critical cannot be fully disabled for security — keep enabled
  const prefs = await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...body, critical: true },
    update: { ...body, critical: true },
  });

  await prisma.auditEvent.create({
    data: {
      userId: user.id,
      eventType: "NOTIFICATION_PREFS_UPDATED",
      payloadJson: JSON.stringify(prefs),
    },
  });

  return NextResponse.json(prefs);
}
