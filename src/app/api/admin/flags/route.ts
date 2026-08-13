import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { loadFlagProfileBoard } from "@/services/flag-profiles";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }
  return NextResponse.json(loadFlagProfileBoard());
}
