import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { setSession } from "@/lib/session";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const limited = rateLimit(clientKey(req, "auth-signin"), 20, 60_000);
    if (!limited.allowed) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
      );
    }

    const json = await req.json();
    const body = schema.parse(json);
    const email = body.email.trim().toLowerCase();
    const password = body.password;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt || user.status === "erased") {
      return NextResponse.json(
        { error: "We could not find that email. Check the address or create an account." },
        { status: 401 },
      );
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "That password does not match. Please try again." },
        { status: 401 },
      );
    }
    await setSession(user.id);
    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        eventType: "AUTH_SIGN_IN",
        payloadJson: JSON.stringify({ email: user.email, role: user.role }),
      },
    });
    await prisma.authSessionEvent.create({
      data: {
        userId: user.id,
        kind: "SIGN_IN",
        detail: "Password sign-in",
        userAgent: req.headers.get("user-agent")?.slice(0, 240) ?? null,
      },
    });
    return NextResponse.json({ ok: true, role: user.role, name: user.name });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Please enter a valid email and password." },
        { status: 400 },
      );
    }
    console.error("sign-in failed", err);
    return NextResponse.json(
      { error: "We could not sign you in right now. Please try again shortly." },
      { status: 400 },
    );
  }
}
