import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { MemoryEditor } from "@/components/MemoryEditor";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function MemoryPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");

  const memories = await prisma.memoryEntry.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main>
      <PageHeader
        title="AI Memory"
        subtitle="Governed financial memory — source, confidence and editable facts you can correct."
      />
      <div className="space-y-3">
        {memories.length ? (
          memories.map((m) => (
            <Panel key={m.id}>
              <div className="flex flex-wrap gap-2">
                <Badge>{m.category}</Badge>
                <Badge tone={m.verified ? "default" : "warn"}>
                  {m.verified ? "Verified" : "Unverified"}
                </Badge>
                <Badge>Confidence {Math.round(m.confidence * 100)}%</Badge>
              </div>
              <p className="mt-2 font-medium">{m.content}</p>
              <p className="muted mt-1 text-sm">
                Source: {m.source} ·{" "}
                {m.updatedAt.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              {m.editable ? <MemoryEditor memoryId={m.id} content={m.content} /> : null}
            </Panel>
          ))
        ) : (
          <Panel>
            <p className="muted">
              No remembered facts yet. WealthAI and the fact-find will store goals, preferences and
              constraints here.
            </p>
          </Panel>
        )}
      </div>
    </main>
  );
}
