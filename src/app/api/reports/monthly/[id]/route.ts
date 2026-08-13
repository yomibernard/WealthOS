import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getMonthlyReportSnapshot } from "@/services/wealth-report";
import { requireFlag } from "@/lib/feature-flags";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const flag = requireFlag("monthlyReports");
  if (!flag.ok) return NextResponse.json({ error: flag.error }, { status: 503 });

  const { id } = await params;
  const report = await getMonthlyReportSnapshot(user.id, id);
  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }
  return NextResponse.json({ report });
}
