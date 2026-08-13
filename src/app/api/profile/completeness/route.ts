import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { syncProfileCompleteness } from "@/services/profile-completeness";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  try {
    const report = await syncProfileCompleteness(user.id);
    if (!report) return NextResponse.json({ error: "Profile unavailable." }, { status: 404 });
    return NextResponse.json(report);
  } catch {
    return NextResponse.json({ error: "Could not assess profile completeness." }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
