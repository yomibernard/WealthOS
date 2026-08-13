import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { buildHomeDashboard } from "@/services/wealth";

const schema = z.object({
  reason: z.string().min(3),
  level: z
    .enum(["L2_SUPPORT", "L3_ADVISER", "L4_SPECIALIST", "L5_PRIVATE_WEALTH"])
    .default("L3_ADVISER"),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const body = schema.parse(await req.json());
  const dash = await buildHomeDashboard(user.id);

  const escalation = await prisma.escalation.create({
    data: {
      userId: user.id,
      level: body.level,
      reason: body.reason,
      summary: JSON.stringify({
        reason: body.reason,
        netWorth: dash?.netWorth.netWorthNgn,
        health: dash?.health.overall,
        topActions: dash?.attention,
      }),
    },
  });

  await prisma.auditEvent.create({
    data: {
      userId: user.id,
      eventType: "ESCALATION_CREATED",
      entityType: "Escalation",
      entityId: escalation.id,
      payloadJson: JSON.stringify({ level: body.level, reason: body.reason }),
    },
  });

  return NextResponse.json({ ok: true, id: escalation.id });
}
