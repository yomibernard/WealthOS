import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { loadOpsDailyBoard } from "@/services/ops-daily";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }
  const board = await loadOpsDailyBoard();
  return NextResponse.json(board);
}
