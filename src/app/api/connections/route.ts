import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { requireFlag } from "@/lib/feature-flags";
import { rateLimit } from "@/lib/rate-limit";
import {
  availableDemoBanks,
  connectDemoBank,
  listConnections,
} from "@/services/connections";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const flag = requireFlag("openBankingDemo");
  if (!flag.ok) return NextResponse.json({ error: flag.error }, { status: 503 });

  const connections = await listConnections(user.id);
  return NextResponse.json({ connections, banks: availableDemoBanks() });
}

const postSchema = z.object({
  bankCode: z.string().min(1),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const flag = requireFlag("openBankingDemo");
  if (!flag.ok) return NextResponse.json({ error: flag.error }, { status: 503 });

  const limited = rateLimit(`connections:connect:${user.id}`, 10, 60_000);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many connection attempts. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  try {
    const body = postSchema.parse(await req.json());
    const connection = await connectDemoBank(user.id, body.bankCode);
    return NextResponse.json(connection);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not connect." },
      { status: 400 },
    );
  }
}
