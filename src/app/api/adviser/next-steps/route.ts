import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { loadAdviserNextStepsPulse } from "@/services/adviser-next-steps";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (user.role !== "ADVISER" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Adviser session required." }, { status: 403 });
  }

  const pulse = await loadAdviserNextStepsPulse({
    adviserId: user.id,
    role: user.role,
  });
  return NextResponse.json(pulse);
}
