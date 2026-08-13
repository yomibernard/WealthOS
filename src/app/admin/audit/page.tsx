import { redirect } from "next/navigation";
import { PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function AdminAuditPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/auth/sign-in");
  const events = await prisma.auditEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main className="page-wide">
      <PageHeader title="Audit logs" subtitle="Structured events beyond plain chat logs." />
      <div className="space-y-2">
        {events.map((e) => (
          <Panel key={e.id} className="py-3">
            <p className="text-sm font-semibold">
              {e.eventType} · {e.createdAt.toLocaleString("en-GB")}
            </p>
            <pre className="muted mt-1 overflow-auto text-xs">{e.payloadJson}</pre>
          </Panel>
        ))}
      </div>
    </main>
  );
}
