import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildAuthenticationOptions } from "@/lib/webauthn";

/** Begin passwordless passkey sign-in by email. */
export async function POST(req: Request) {
  const body = (await req.json()) as { email?: string };
  const email = body.email?.toLowerCase().trim();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, deletedAt: true, status: true },
  });
  if (!user || user.deletedAt || user.status === "erased") {
    return NextResponse.json({ error: "No passkey on this account" }, { status: 404 });
  }
  try {
    const options = await buildAuthenticationOptions(user.id);
    return NextResponse.json({ ...options, userId: user.id });
  } catch {
    return NextResponse.json({ error: "No passkey on this account" }, { status: 404 });
  }
}
