import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { loadNextStepsPulse } from "@/services/next-steps";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Customer session required." }, { status: 403 });
  }

  const pulse = await loadNextStepsPulse(user.id);
  return NextResponse.json(pulse);
}
