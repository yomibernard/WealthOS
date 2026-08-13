import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { recordLifeEvent } from "@/services/life-events";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const events = await prisma.lifeEvent.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(events);
}

const schema = z.object({
  type: z.string().min(2),
  label: z.string().min(2),
  date: z.string(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const body = schema.parse(await req.json());

  const { event, automation } = await recordLifeEvent({
    userId: user.id,
    type: body.type,
    label: body.label,
    date: new Date(body.date),
    notes: body.notes,
  });

  return NextResponse.json({ ...event, automation });
}
