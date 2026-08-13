import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { requireFlag } from "@/lib/feature-flags";
import { rateLimit } from "@/lib/rate-limit";
import { disconnectConnection, syncConnection } from "@/services/connections";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const flag = requireFlag("openBankingDemo");
  if (!flag.ok) return NextResponse.json({ error: flag.error }, { status: 503 });

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { action?: string };
  const action = body.action ?? "sync";

  const limited = rateLimit(`connections:${action}:${user.id}`, 20, 60_000);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many sync requests. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  try {
    if (action === "disconnect") {
      const connection = await disconnectConnection(user.id, id);
      return NextResponse.json({ connection });
    }
    const result = await syncConnection(user.id, id);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Connection action failed." },
      { status: 400 },
    );
  }
}
