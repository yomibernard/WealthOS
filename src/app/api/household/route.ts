import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { requireFlag } from "@/lib/feature-flags";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const flag = requireFlag("household");
  if (!flag.ok) return NextResponse.json({ error: flag.error }, { status: 503 });

  const members = await prisma.householdMember.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(members);
}

const schema = z.object({
  name: z.string().min(1),
  relationship: z.string().min(1),
  dependant: z.boolean().default(false),
  dateOfBirth: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const flag = requireFlag("household");
  if (!flag.ok) return NextResponse.json({ error: flag.error }, { status: 503 });

  const body = schema.parse(await req.json());
  const member = await prisma.householdMember.create({
    data: {
      userId: user.id,
      name: body.name,
      relationship: body.relationship,
      dependant: body.dependant,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
    },
  });

  await prisma.memoryEntry.create({
    data: {
      userId: user.id,
      category: "household",
      content: `${body.name} (${body.relationship})${body.dependant ? " — dependant" : ""}`,
      source: "household",
      verified: true,
    },
  });

  return NextResponse.json(member);
}
