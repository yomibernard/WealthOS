import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const body = await req.json();
  const completeness = Math.min(
    95,
    20 + Object.values(body).filter((v) => String(v || "").trim()).length * 12,
  );

  await prisma.user.update({
    where: { id: user.id },
    data: {
      employmentStatus: body.employment || user.name,
      riskTolerance: body.risk || undefined,
      profileCompleteness: completeness,
    },
  });

  if (body.aspiration) {
    await prisma.memoryEntry.create({
      data: {
        userId: user.id,
        category: "goal",
        content: String(body.aspiration),
        source: "fact-find",
        verified: true,
      },
    });
  }

  if (body.income) {
    await prisma.income.create({
      data: {
        userId: user.id,
        type: "salary",
        label: "Primary income",
        amount: Number(body.income) || 0,
        frequency: "monthly",
      },
    });
  }

  return NextResponse.json({ ok: true, completeness });
}
