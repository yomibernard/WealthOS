import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function AdminMonitoringPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/auth/sign-in");

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [aiEvents, recEvents, wgEvents, escalations, feedback] = await Promise.all([
    prisma.auditEvent.findMany({
      where: { eventType: "AI_RESPONSE", createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.recommendation.findMany({
      where: { createdAt: { gte: since } },
      select: { status: true, confidence: true, actionType: true },
    }),
    prisma.wealthGuardAnalysis.findMany({
      where: { createdAt: { gte: since } },
      select: { overallOutcome: true, returnClaim: true },
    }),
    prisma.escalation.count({ where: { createdAt: { gte: since } } }),
    prisma.recommendation.groupBy({
      by: ["status"],
      _count: true,
      where: { createdAt: { gte: since } },
    }),
  ]);

  let llmPolished = 0;
  let lowConfidence = 0;
  let escalateCount = 0;
  for (const e of aiEvents) {
    try {
      const p = JSON.parse(e.payloadJson) as {
        confidence?: number;
        escalate?: boolean;
        llmPolished?: boolean;
      };
      if (p.llmPolished) llmPolished += 1;
      if ((p.confidence ?? 1) < 0.5) lowConfidence += 1;
      if (p.escalate) escalateCount += 1;
    } catch {
      // ignore malformed
    }
  }

  const accepted = feedback.find((f) => f.status === "ACCEPTED")?._count ?? 0;
  const rejected = feedback.find((f) => f.status === "REJECTED")?._count ?? 0;
  const proposed = feedback.find((f) => f.status === "PROPOSED")?._count ?? 0;
  const doNothing = recEvents.filter((r) => r.actionType === "DO_NOTHING").length;
  const significantWarnings = wgEvents.filter((w) =>
    w.overallOutcome.includes("Significant"),
  ).length;

  const groundedRate =
    aiEvents.length === 0 ? 100 : Math.round(((aiEvents.length - lowConfidence) / aiEvents.length) * 100);

  return (
    <main className="page-wide">
      <PageHeader
        title="AI & model monitoring"
        subtitle="Trailing 30 days. Optimise for grounded answers and trust — not transaction volume."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Panel>
          <p className="eyebrow">AI responses</p>
          <p className="font-display text-3xl">{aiEvents.length}</p>
        </Panel>
        <Panel>
          <p className="eyebrow">Grounded-confidence rate</p>
          <p className="font-display text-3xl">{groundedRate}%</p>
          <p className="muted text-sm">Share with confidence ≥ 50%</p>
        </Panel>
        <Panel>
          <p className="eyebrow">Human escalations</p>
          <p className="font-display text-3xl">{escalations}</p>
          <Badge tone="warn">From cases {escalateCount} AI-flagged</Badge>
        </Panel>
        <Panel>
          <p className="eyebrow">LLM polish used</p>
          <p className="font-display text-3xl">{llmPolished}</p>
        </Panel>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Panel>
          <p className="eyebrow">Recommendation acceptance</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>Accepted: {accepted}</li>
            <li>Rejected: {rejected}</li>
            <li>Still proposed: {proposed}</li>
            <li>Do-nothing candidates generated: {doNothing}</li>
          </ul>
        </Panel>
        <Panel>
          <p className="eyebrow">WealthGuard outcomes</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>Analyses: {wgEvents.length}</li>
            <li>Significant warning indicators: {significantWarnings}</li>
            <li>
              Very unusual returns:{" "}
              {wgEvents.filter((w) => w.returnClaim === "Very unusual").length}
            </li>
          </ul>
        </Panel>
        <Panel>
          <p className="eyebrow">Quality targets</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>Unsupported claim rate — monitor via audit sampling</li>
            <li>Suitability bypass attempts — ComplianceAI refusals</li>
            <li>Customer correction rate — Memory + reject reasons</li>
          </ul>
        </Panel>
      </div>
    </main>
  );
}
