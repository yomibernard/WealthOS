import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { latestFxTable, refreshFxRates } from "@/integrations/fx";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }
  const rates = await latestFxTable();
  return NextResponse.json({ rates });
}

export async function POST() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const result = await refreshFxRates();
  await prisma.auditEvent.create({
    data: {
      userId: user.id,
      eventType: "FX_REFRESH",
      payloadJson: JSON.stringify({
        count: result.count,
        quotes: result.quotes.map((q) => ({
          pair: `${q.from}/${q.to}`,
          rate: q.rate,
          source: q.source,
        })),
      }),
    },
  });

  return NextResponse.json(result);
}
