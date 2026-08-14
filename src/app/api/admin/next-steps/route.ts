import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { loadOpsNextStepsPulse } from "@/services/ops-next-steps";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const pulse = await loadOpsNextStepsPulse();
  return NextResponse.json(pulse);
}
