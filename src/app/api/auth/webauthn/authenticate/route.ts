import { NextResponse } from "next/server";
import { getSessionUser, setSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { buildAuthenticationOptions, verifyAuthentication } from "@/lib/webauthn";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";

/** Challenge for the signed-in user (re-auth / step-up). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const options = await buildAuthenticationOptions(user.id);
    return NextResponse.json(options);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No passkeys available" },
      { status: 400 },
    );
  }
}

/** Verify for signed-in re-auth, or email+assertion for passwordless sign-in. */
export async function POST(req: Request) {
  const body = (await req.json()) as {
    email?: string;
    response?: AuthenticationResponseJSON;
  };
  if (!body.response) {
    return NextResponse.json({ error: "Missing assertion" }, { status: 400 });
  }

  const sessionUser = await getSessionUser();
  let userId = sessionUser?.id ?? null;

  if (!userId && body.email) {
    const found = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      select: { id: true, deletedAt: true, status: true },
    });
    if (!found || found.deletedAt || found.status === "erased") {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    userId = found.id;
  }

  if (!userId) {
    return NextResponse.json({ error: "Sign in or provide email" }, { status: 400 });
  }

  try {
    // If passwordless, options challenge must have been issued for this user first
    if (!sessionUser && body.email) {
      // Challenge was stored when client called /options with email
    }
    await verifyAuthentication(userId, body.response);
    if (!sessionUser) await setSession(userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verification failed" },
      { status: 400 },
    );
  }
}
