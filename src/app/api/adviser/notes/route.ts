import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { requireFlag } from "@/lib/feature-flags";
import {
  assertAdviserAccess,
  createAdviserNote,
  listAdviserNotes,
} from "@/services/adviser-collab";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const flag = requireFlag("adviserCollab");
  if (!flag.ok) return NextResponse.json({ error: flag.error }, { status: 503 });

  const customerId = new URL(req.url).searchParams.get("customerId");
  if (!customerId) {
    return NextResponse.json({ error: "customerId is required." }, { status: 400 });
  }

  if (user.role === "CUSTOMER") {
    if (user.id !== customerId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    const notes = await listAdviserNotes(customerId, { sharedOnly: true });
    return NextResponse.json(notes);
  }

  if (user.role !== "ADVISER" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    await assertAdviserAccess(user.id, customerId, user.role);
    const notes = await listAdviserNotes(customerId);
    return NextResponse.json(notes);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Access denied." },
      { status: 403 },
    );
  }
}

const schema = z.object({
  customerId: z.string().min(1),
  kind: z.enum(["note", "plan_action", "call_summary"]).default("note"),
  title: z.string().min(2),
  body: z.string().min(2),
  sharedWithCustomer: z.boolean().default(false),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const flag = requireFlag("adviserCollab");
  if (!flag.ok) return NextResponse.json({ error: flag.error }, { status: 503 });
  if (user.role !== "ADVISER" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only advisers can create notes." }, { status: 403 });
  }

  try {
    const body = schema.parse(await req.json());
    await assertAdviserAccess(user.id, body.customerId, user.role);
    const note = await createAdviserNote({
      adviserId: user.id,
      customerId: body.customerId,
      kind: body.kind,
      title: body.title,
      body: body.body,
      sharedWithCustomer: body.sharedWithCustomer,
    });
    return NextResponse.json(note);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save note." },
      { status: 400 },
    );
  }
}
