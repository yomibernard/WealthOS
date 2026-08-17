import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { readMediaBlob } from "@/lib/document-storage";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const key = new URL(req.url).searchParams.get("key");
  if (!key || !key.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const media = await readMediaBlob(key);
  if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(new Uint8Array(media.bytes), {
    headers: {
      "Content-Type": media.mimeType,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
