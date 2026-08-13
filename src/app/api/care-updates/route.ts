import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  loadCareUpdateList,
  loadCareUpdatePulse,
} from "@/services/adviser-care-ack";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Customers only." }, { status: 403 });
  }

  const list = new URL(req.url).searchParams.get("list") === "1";
  const data = list
    ? await loadCareUpdateList(user.id)
    : await loadCareUpdatePulse(user.id);
  return NextResponse.json(data);
}
