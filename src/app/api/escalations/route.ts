import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { buildHomeDashboard } from "@/services/wealth";
import { createUserNotification } from "@/services/notifications";
import { parseEscalationSummary } from "@/engines/escalation-ops";

const schema = z.object({
  reason: z.string().min(3).max(2000),
  level: z
    .enum(["L2_SUPPORT", "L3_ADVISER", "L4_SPECIALIST", "L5_PRIVATE_WEALTH"])
    .default("L3_ADVISER"),
  category: z.enum(["support", "complaint", "adviser"]).default("support"),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const rows = await prisma.escalation.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json(
    rows.map((e) => {
      const parsed = parseEscalationSummary(e.summary);
      return {
        id: e.id,
        level: e.level,
        reason: e.reason,
        status: e.status,
        createdAt: e.createdAt.toISOString(),
        summaryPreview: e.summary.slice(0, 180),
        resolution: parsed.resolution ?? null,
      };
    }),
  );
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const body = schema.parse(await req.json());
  const dash = await buildHomeDashboard(user.id);

  const reasonLabel =
    body.category === "complaint"
      ? `COMPLAINT: ${body.reason}`
      : body.category === "adviser"
        ? body.reason
        : `SUPPORT: ${body.reason}`;

  const escalation = await prisma.escalation.create({
    data: {
      userId: user.id,
      level: body.level,
      reason: reasonLabel,
      summary: JSON.stringify({
        category: body.category,
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
      payloadJson: JSON.stringify({
        level: body.level,
        category: body.category,
        reason: body.reason,
      }),
    },
  });

  await createUserNotification({
    userId: user.id,
    category: "important",
    title:
      body.category === "complaint"
        ? "Complaint logged"
        : body.category === "adviser"
          ? "Adviser request received"
          : "Support request received",
    body: `Case ${escalation.id.slice(0, 8)} is open at ${body.level}. We will follow up in-product.`,
  });

  return NextResponse.json({ ok: true, id: escalation.id });
}
