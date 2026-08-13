import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function AdminEscalationsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/auth/sign-in");
  const rows = await prisma.escalation.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <main className="page-wide">
      <PageHeader title="Escalations" subtitle="Support, adviser and specialist queues." />
      <div className="space-y-3">
        {rows.map((e) => (
          <Panel key={e.id}>
            <div className="flex flex-wrap gap-2">
              <Badge>{e.level}</Badge>
              <Badge tone={e.status === "open" ? "warn" : "default"}>{e.status}</Badge>
            </div>
            <p className="mt-2 font-semibold">
              {e.user.name} — {e.reason}
            </p>
            <p className="muted mt-1 text-sm">{e.summary.slice(0, 240)}</p>
          </Panel>
        ))}
      </div>
    </main>
  );
}
