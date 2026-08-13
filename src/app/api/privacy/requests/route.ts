import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { createPrivacyRequest } from "@/services/privacy";
import { prisma } from "@/lib/db";

const schema = z.object({
  type: z.enum(["access", "erasure", "rectification", "objection"]),
  details: z.string().max(2000).optional(),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const rows = await prisma.privacyRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const body = schema.parse(await req.json());
  const created = await createPrivacyRequest(user.id, body.type, body.details);
  return NextResponse.json(created);
}
