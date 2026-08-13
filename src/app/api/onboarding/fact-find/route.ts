import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { syncProfileCompleteness } from "@/services/profile-completeness";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const body = await req.json();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      employmentStatus: body.employment || undefined,
      riskTolerance: body.risk || undefined,
      investmentExperience: body.experience || undefined,
      liquidityNeeds: body.liquidity || undefined,
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

  const report = await syncProfileCompleteness(user.id);
  return NextResponse.json({ ok: true, completeness: report?.score ?? 0 });
}
