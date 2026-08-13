import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { exportCustomerData } from "@/services/privacy";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const pack = await exportCustomerData(user.id);
  if (!pack) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  await prisma.auditEvent.create({
    data: {
      userId: user.id,
      eventType: "PRIVACY_EXPORT_DOWNLOADED",
      payloadJson: JSON.stringify({ at: pack.exportedAt }),
    },
  });

  return new NextResponse(JSON.stringify(pack, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="wealthos-data-export-${user.id.slice(0, 8)}.json"`,
    },
  });
}
