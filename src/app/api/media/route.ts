import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { readMediaBlob } from "@/lib/document-storage";

async function canReadMediaKey(user: {
  id: string;
  role: string;
}, key: string): Promise<boolean> {
  if (key.startsWith(`${user.id}/`)) return true;
  if (user.role !== "ADVISER" && user.role !== "ADMIN") return false;

  const ownerId = key.split("/")[0];
  if (!ownerId) return false;

  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { id: true, role: true },
  });
  if (!owner || owner.role !== "CUSTOMER") return false;
  if (user.role === "ADMIN") return true;

  const link = await prisma.adviserCustomer.findFirst({
    where: { adviserId: user.id, customerId: ownerId },
    select: { id: true },
  });
  return Boolean(link);
}

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const key = new URL(req.url).searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!(await canReadMediaKey(user, key))) {
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
