import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { requireFlag } from "@/lib/feature-flags";
import { generateWeeklyDigest, loadLatestWeeklyDigest } from "@/services/weekly-digest";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const flag = requireFlag("weeklyDigest");
  if (!flag.ok) return NextResponse.json({ error: flag.error }, { status: 503 });

  try {
    const data = await loadLatestWeeklyDigest(user.id);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Could not load weekly digest." }, { status: 500 });
  }
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const flag = requireFlag("weeklyDigest");
  if (!flag.ok) return NextResponse.json({ error: flag.error }, { status: 503 });

  try {
    const result = await generateWeeklyDigest(user.id);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "We could not generate your weekly digest right now." },
      { status: 500 },
    );
  }
}
