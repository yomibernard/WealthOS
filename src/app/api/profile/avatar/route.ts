import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { storeMediaBlob, softDeleteDocumentFile } from "@/lib/document-storage";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { dataUrl?: string };
  if (!body.dataUrl?.startsWith("data:image/")) {
    return NextResponse.json({ error: "Expected a compressed image data URL" }, { status: 400 });
  }
  const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(body.dataUrl);
  if (!match) return NextResponse.json({ error: "Invalid image payload" }, { status: 400 });
  const mimeType = match[1].toLowerCase();
  if (!ALLOWED.has(mimeType)) {
    return NextResponse.json({ error: "Use JPEG, PNG or WebP" }, { status: 400 });
  }
  const bytes = Buffer.from(match[2], "base64");
  try {
    const stored = await storeMediaBlob(user.id, mimeType, bytes);
    const prev = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatarStorageKey: true },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarStorageKey: stored.storageKey },
    });
    await prisma.document.create({
      data: {
        userId: user.id,
        name: "Profile photo",
        mimeType,
        storageKey: stored.storageKey,
        checksum: stored.checksum,
        scannedClean: stored.scannedClean,
        encryptedAtRest: true,
      },
    });
    if (prev?.avatarStorageKey && prev.avatarStorageKey !== stored.storageKey) {
      await softDeleteDocumentFile(prev.avatarStorageKey).catch(() => undefined);
    }
    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        eventType: "PROFILE_AVATAR_SET",
        entityType: "User",
        entityId: user.id,
        payloadJson: JSON.stringify({ storageKey: stored.storageKey }),
      },
    });
    return NextResponse.json({ ok: true, src: `/api/media?key=${encodeURIComponent(stored.storageKey)}` });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 400 },
    );
  }
}

export async function DELETE() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { avatarStorageKey: true },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { avatarStorageKey: null },
  });
  if (row?.avatarStorageKey) {
    await softDeleteDocumentFile(row.avatarStorageKey).catch(() => undefined);
  }
  await prisma.auditEvent.create({
    data: {
      userId: user.id,
      eventType: "PROFILE_AVATAR_REMOVED",
      entityType: "User",
      entityId: user.id,
      payloadJson: "{}",
    },
  });
  return NextResponse.json({ ok: true });
}
