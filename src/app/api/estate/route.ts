import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { requireFlag } from "@/lib/feature-flags";
import { analyseEstate } from "@/engines/estate";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const flag = requireFlag("estateLite");
  if (!flag.ok) return NextResponse.json({ error: flag.error }, { status: 503 });

  const [items, household, assets] = await Promise.all([
    prisma.estateItem.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }),
    prisma.householdMember.findMany({ where: { userId: user.id } }),
    prisma.asset.findMany({ where: { userId: user.id } }),
  ]);

  const intel = analyseEstate(items, {
    dependantCount: household.filter((h) => h.dependant).length,
    hasLifeCover: assets.some((a) => a.category === "INSURANCE"),
    hasProperty: assets.some((a) => a.category === "PROPERTY"),
    hasBusiness: assets.some((a) => a.category === "BUSINESS"),
    hasPension: assets.some((a) => a.category === "PENSION"),
  });

  return NextResponse.json({ items, intel });
}

const schema = z.object({
  kind: z.string().min(2),
  label: z.string().min(2),
  status: z.enum(["missing", "draft", "documented", "reviewed"]).default("draft"),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const flag = requireFlag("estateLite");
  if (!flag.ok) return NextResponse.json({ error: flag.error }, { status: 503 });

  const body = schema.parse(await req.json());
  const item = await prisma.estateItem.create({
    data: {
      userId: user.id,
      kind: body.kind,
      label: body.label,
      status: body.status,
      notes: body.notes,
      lastReviewedAt: body.status === "reviewed" ? new Date() : null,
    },
  });

  await prisma.auditEvent.create({
    data: {
      userId: user.id,
      eventType: "ESTATE_ITEM_CREATED",
      entityType: "EstateItem",
      entityId: item.id,
      payloadJson: JSON.stringify({ kind: body.kind, status: body.status }),
    },
  });

  return NextResponse.json(item);
}
