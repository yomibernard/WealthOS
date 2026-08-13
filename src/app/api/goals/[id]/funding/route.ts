import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { projectGoal } from "@/engines/goals";

const schema = z.object({
  monthlyContribution: z.number().min(0).max(1_000_000_000),
  applySuggested: z.boolean().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const { id } = await params;
  const goal = await prisma.goal.findFirst({ where: { id, userId: user.id } });
  if (!goal) return NextResponse.json({ error: "Goal not found." }, { status: 404 });

  try {
    const body = schema.parse(await req.json());
    const forecast = projectGoal(goal);
    const nextMonthly = body.applySuggested
      ? Math.ceil(forecast.requiredMonthly)
      : body.monthlyContribution;

    const updated = await prisma.goal.update({
      where: { id: goal.id },
      data: {
        monthlyContribution: nextMonthly,
        progressPercent: projectGoal({ ...goal, monthlyContribution: nextMonthly }).progressPercent,
      },
    });

    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        eventType: "GOAL_FUNDING_UPDATED",
        entityType: "Goal",
        entityId: updated.id,
        payloadJson: JSON.stringify({
          monthlyContribution: updated.monthlyContribution,
          previous: goal.monthlyContribution,
          applySuggested: Boolean(body.applySuggested),
        }),
      },
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        category: "Advisory",
        title: `Funding updated · ${updated.name}`,
        body: `Monthly contribution set to ₦${Math.round(updated.monthlyContribution).toLocaleString("en-NG")}. Projections remain illustrative.`,
      },
    });

    return NextResponse.json({
      ok: true,
      id: updated.id,
      monthlyContribution: updated.monthlyContribution,
      progressPercent: updated.progressPercent,
    });
  } catch {
    return NextResponse.json(
      { error: "We could not update goal funding right now." },
      { status: 400 },
    );
  }
}
