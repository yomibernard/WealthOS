import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { requireFlag } from "@/lib/feature-flags";
import { assertAdviserAccess, buildCustomerTimeline } from "@/services/adviser-collab";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const flag = requireFlag("adviserCollab");
  if (!flag.ok) return NextResponse.json({ error: flag.error }, { status: 503 });

  const customerId = new URL(req.url).searchParams.get("customerId");
  if (!customerId) {
    return NextResponse.json({ error: "customerId is required." }, { status: 400 });
  }

  if (user.role === "CUSTOMER" && user.id !== customerId) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (user.role === "ADVISER" || user.role === "ADMIN") {
    try {
      await assertAdviserAccess(user.id, customerId, user.role);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Access denied." },
        { status: 403 },
      );
    }
  } else if (user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const timeline = await buildCustomerTimeline(customerId);
  // Customers only see shared-safe timeline kinds (hide internal-only note detail already filtered in notes page)
  if (user.role === "CUSTOMER") {
    return NextResponse.json(
      timeline.filter((t) => t.kind !== "note" || t.detail.includes("shared")),
    );
  }
  return NextResponse.json(timeline);
}
