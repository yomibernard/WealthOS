import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { storeDocumentReference } from "@/lib/document-storage";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const docs = await prisma.document.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(docs);
}

const schema = z.object({
  name: z.string().min(1),
  mimeType: z.string().default("application/pdf"),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const limited = rateLimit(clientKey(req, `docs:${user.id}`), 30, 60_000);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many uploads. Please wait a moment." }, { status: 429 });
  }

  const body = schema.parse(await req.json());
  const stored = await storeDocumentReference(
    user.id,
    body.name,
    body.mimeType,
    body.notes ?? body.name,
  );

  if (!stored.scannedClean) {
    return NextResponse.json(
      {
        error:
          "This file failed a security scan and was not stored. Please upload a clean document.",
      },
      { status: 400 },
    );
  }

  const doc = await prisma.document.create({
    data: {
      userId: user.id,
      name: body.name,
      mimeType: body.mimeType,
      storageKey: stored.storageKey,
      scannedClean: stored.scannedClean,
      encryptedAtRest: stored.encryptedAtRest,
      checksum: stored.checksum,
    },
  });

  await prisma.auditEvent.create({
    data: {
      userId: user.id,
      eventType: "DOCUMENT_STORED",
      entityType: "Document",
      entityId: doc.id,
      payloadJson: JSON.stringify({
        encryptedAtRest: stored.encryptedAtRest,
        checksum: stored.checksum,
        bytes: stored.bytes,
      }),
    },
  });

  return NextResponse.json(doc);
}
