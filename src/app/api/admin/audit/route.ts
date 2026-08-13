import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { AUDIT_CATEGORIES, type AuditCategory } from "@/engines/audit-export";
import { exportAuditPackage, listAuditEvents } from "@/services/audit-export";

function parseCategory(raw: string | null): AuditCategory | "all" {
  if (!raw || raw === "all") return "all";
  return (AUDIT_CATEGORIES as string[]).includes(raw) ? (raw as AuditCategory) : "all";
}

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const url = new URL(req.url);
  const category = parseCategory(url.searchParams.get("category"));
  const eventType = url.searchParams.get("eventType") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;
  const take = Number(url.searchParams.get("take") ?? "100");
  const download = url.searchParams.get("download") === "1";

  if (download) {
    const pack = await exportAuditPackage({
      category,
      eventType,
      q,
      take: Number.isFinite(take) ? take : 500,
      adminId: user.id,
    });
    const stamp = pack.exportedAt.slice(0, 10);
    return new NextResponse(JSON.stringify(pack, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="wealthos-audit-export-${stamp}.json"`,
      },
    });
  }

  const list = await listAuditEvents({
    category,
    eventType,
    q,
    take: Number.isFinite(take) ? take : 100,
  });

  return NextResponse.json(list);
}
