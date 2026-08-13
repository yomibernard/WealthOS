import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { requireFlag } from "@/lib/feature-flags";

const schema = z.object({
  status: z.enum(["missing", "draft", "documented", "reviewed"]).optional(),
  label: z.string().min(2).optional(),
  notes: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const flag = requireFlag("estateLite");
  if (!flag.ok) return NextResponse.json({ error: flag.error }, { status: 503 });

  const { id } = await params;
  const existing = await prisma.estateItem.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = schema.parse(await req.json());
  const item = await prisma.estateItem.update({
    where: { id },
    data: {
      ...body,
      lastReviewedAt:
        body.status === "reviewed" || body.status === "documented"
          ? new Date()
          : existing.lastReviewedAt,
    },
  });

  return NextResponse.json(item);
}
