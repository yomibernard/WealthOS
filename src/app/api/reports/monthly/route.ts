import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { generateMonthlyWealthReport } from "@/services/wealth-report";
import { requireFlag } from "@/lib/feature-flags";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const flag = requireFlag("monthlyReports");
  if (!flag.ok) return NextResponse.json({ error: flag.error }, { status: 503 });

  try {
    const result = await generateMonthlyWealthReport(user.id);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "We could not generate your wealth report right now." },
      { status: 500 },
    );
  }
}
