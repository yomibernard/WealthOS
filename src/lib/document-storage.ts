/**
 * Secure document storage abstraction.
 * Demo writes encrypted-at-rest markers + checksums under .data/docs (gitignored).
 */

import { createHash, randomUUID } from "crypto";
import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";

const ROOT = path.join(process.cwd(), ".data", "docs");

export type StoredDocument = {
  storageKey: string;
  checksum: string;
  encryptedAtRest: boolean;
  scannedClean: boolean;
  bytes: number;
};

function scanForMalwareMarkers(content: Buffer | string): boolean {
  const text = typeof content === "string" ? content : content.toString("utf8");
  // Demo heuristic — real scanner would be ClamAV/S3 malware protection
  if (/X5O!P%@AP|EICAR-STANDARD-ANTIVIRUS-TEST-FILE/i.test(text)) return false;
  if (/<script[\s>]|javascript:/i.test(text) && text.length < 500) return false;
  return true;
}

export async function storeDocumentReference(
  userId: string,
  name: string,
  mimeType: string,
  contentNote: string,
): Promise<StoredDocument> {
  await mkdir(path.join(ROOT, userId), { recursive: true });
  const id = randomUUID();
  const storageKey = `${userId}/${id}`;
  const payload = JSON.stringify({
    name,
    mimeType,
    contentNote,
    encryptedAtRest: true,
    storedAt: new Date().toISOString(),
  });
  // Demo "encryption at rest": store as base64 envelope (not production crypto)
  const envelope = Buffer.from(
    JSON.stringify({
      alg: "demo-envelope-v1",
      ciphertext: Buffer.from(payload, "utf8").toString("base64"),
    }),
    "utf8",
  );

  const scannedClean = scanForMalwareMarkers(contentNote);
  const checksum = createHash("sha256").update(envelope).digest("hex");
  await writeFile(path.join(ROOT, storageKey), envelope);

  return {
    storageKey,
    checksum,
    encryptedAtRest: true,
    scannedClean,
    bytes: envelope.length,
  };
}

export async function readDocumentEnvelope(storageKey: string): Promise<string | null> {
  try {
    const raw = await readFile(path.join(ROOT, storageKey), "utf8");
    const parsed = JSON.parse(raw) as { ciphertext?: string };
    if (!parsed.ciphertext) return null;
    return Buffer.from(parsed.ciphertext, "base64").toString("utf8");
  } catch {
    return null;
  }
}

export async function softDeleteDocumentFile(storageKey: string): Promise<void> {
  try {
    await unlink(path.join(ROOT, storageKey));
  } catch {
    // already gone
  }
}

/** Store binary media (profile/asset images). Not a public CDN URL. */
export async function storeMediaBlob(
  userId: string,
  mimeType: string,
  bytes: Buffer,
): Promise<StoredDocument> {
  if (!mimeType.startsWith("image/")) {
    throw new Error("Only image media is supported");
  }
  if (bytes.length > 1_500_000) {
    throw new Error("Image too large (max ~1.5MB after compression)");
  }
  await mkdir(path.join(ROOT, userId), { recursive: true });
  const id = randomUUID();
  const storageKey = `${userId}/${id}`;
  const scannedClean = scanForMalwareMarkers(bytes);
  if (!scannedClean) throw new Error("Media failed safety scan");
  const envelope = Buffer.from(
    JSON.stringify({
      alg: "demo-media-v1",
      mimeType,
      ciphertext: bytes.toString("base64"),
      storedAt: new Date().toISOString(),
    }),
    "utf8",
  );
  const checksum = createHash("sha256").update(envelope).digest("hex");
  await writeFile(path.join(ROOT, storageKey), envelope);
  return {
    storageKey,
    checksum,
    encryptedAtRest: true,
    scannedClean: true,
    bytes: envelope.length,
  };
}

export async function readMediaBlob(
  storageKey: string,
): Promise<{ mimeType: string; bytes: Buffer } | null> {
  try {
    const raw = await readFile(path.join(ROOT, storageKey), "utf8");
    const parsed = JSON.parse(raw) as { alg?: string; mimeType?: string; ciphertext?: string };
    if (parsed.alg !== "demo-media-v1" || !parsed.ciphertext || !parsed.mimeType) return null;
    return {
      mimeType: parsed.mimeType,
      bytes: Buffer.from(parsed.ciphertext, "base64"),
    };
  } catch {
    return null;
  }
}
