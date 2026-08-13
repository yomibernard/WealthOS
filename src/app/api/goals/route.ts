import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

const schema = z.object({
  type: z.enum([
    "RETIREMENT",
    "EDUCATION",
    "PROPERTY",
    "EMERGENCY",
    "BUSINESS_CAPITAL",
    "MIGRATION",
    "REGULAR_INCOME",
    "CUSTOM",
  ]),
  name: z.string().min(1),
  targetAmount: z.number().positive(),
  targetDate: z.string(),
  monthlyContribution: z.number().nonnegative().default(0),
  existingAllocation: z.number().nonnegative().default(0),
  currency: z.string().default("NGN"),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  try {
    const body = schema.parse(await req.json());
    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        type: body.type,
        name: body.name,
        targetAmount: body.targetAmount,
        targetDate: new Date(body.targetDate),
        monthlyContribution: body.monthlyContribution,
        existingAllocation: body.existingAllocation,
        currency: body.currency,
        assumptionsJson: JSON.stringify({
          inflationAnnual: 0.15,
          expectedReturnAnnual: 0.12,
        }),
      },
    });
    return NextResponse.json({ ok: true, id: goal.id });
  } catch {
    return NextResponse.json({ error: "Could not save this goal. Please check the inputs." }, { status: 400 });
  }
}
