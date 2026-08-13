import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { setSession } from "@/lib/session";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 409 },
      );
    }
    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email,
        passwordHash,
        profileCompleteness: 10,
        consents: {
          create: {
            serviceName: "WealthAI analysis",
            dataUsed: "Profile and Wealth Graph",
            purpose: "Personalised financial intelligence",
            status: "ACTIVE",
          },
        },
      },
    });
    await setSession(user.id);
    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        eventType: "AUTH_SIGN_UP",
        payloadJson: JSON.stringify({ email: user.email }),
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "We could not create your account right now. Please try again." },
      { status: 400 },
    );
  }
}
