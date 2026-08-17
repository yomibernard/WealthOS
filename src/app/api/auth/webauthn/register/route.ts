import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  buildRegistrationOptions,
  verifyAndStoreRegistration,
} from "@/lib/webauthn";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const options = await buildRegistrationOptions({
      id: user.id,
      email: user.email,
      name: user.name,
    });
    return NextResponse.json(options);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not start registration" },
      { status: 400 },
    );
  }
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as {
    response?: RegistrationResponseJSON;
    label?: string;
  };
  if (!body.response) {
    return NextResponse.json({ error: "Missing registration response" }, { status: 400 });
  }
  try {
    await verifyAndStoreRegistration(user.id, body.response, body.label);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verification failed" },
      { status: 400 },
    );
  }
}
