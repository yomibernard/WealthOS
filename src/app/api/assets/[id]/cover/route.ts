import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { storeMediaBlob, softDeleteDocumentFile } from "@/lib/document-storage";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const asset = await prisma.asset.findFirst({ where: { id, userId: user.id } });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as { dataUrl?: string };
  const match = body.dataUrl ? /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(body.dataUrl) : null;
  if (!match) return NextResponse.json({ error: "Invalid image payload" }, { status: 400 });
  const mimeType = match[1].toLowerCase();
  if (!ALLOWED.has(mimeType)) {
    return NextResponse.json({ error: "Use JPEG, PNG or WebP" }, { status: 400 });
  }
  try {
    const stored = await storeMediaBlob(user.id, mimeType, Buffer.from(match[2], "base64"));
    const prev = asset.coverStorageKey;
    await prisma.asset.update({
      where: { id },
      data: { coverStorageKey: stored.storageKey },
    });
    await prisma.document.create({
      data: {
        userId: user.id,
        assetId: id,
        name: `Cover: ${asset.name}`,
        mimeType,
        storageKey: stored.storageKey,
        checksum: stored.checksum,
        scannedClean: true,
        encryptedAtRest: true,
      },
    });
    if (prev && prev !== stored.storageKey) {
      await softDeleteDocumentFile(prev).catch(() => undefined);
    }
    return NextResponse.json({
      ok: true,
      src: `/api/media?key=${encodeURIComponent(stored.storageKey)}`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const asset = await prisma.asset.findFirst({ where: { id, userId: user.id } });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.asset.update({ where: { id }, data: { coverStorageKey: null } });
  if (asset.coverStorageKey) {
    await softDeleteDocumentFile(asset.coverStorageKey).catch(() => undefined);
  }
  return NextResponse.json({ ok: true });
}
