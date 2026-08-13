import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { loadCareUpdatePulse } from "@/services/adviser-care-ack";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Customers only." }, { status: 403 });
  }

  const pulse = await loadCareUpdatePulse(user.id);
  return NextResponse.json(pulse);
}
