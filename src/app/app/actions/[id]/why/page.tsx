import { redirect } from "next/navigation";
import { PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function WhyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const rec = await prisma.recommendation.findFirst({ where: { id, userId: user.id } });
  if (!rec) redirect("/app/actions");

  return (
    <main>
      <PageHeader title="Why this recommendation?" subtitle="Transparent rationale and scoring context." />
      <Panel className="space-y-3">
        <p>{rec.why}</p>
        <p className="muted text-sm">
          Ranked by financial impact, urgency, risk reduction, goal impact, liquidity, preference,
          suitability, data confidence and vulnerability care — not revenue opportunity.
        </p>
        <p className="text-sm">
          Model {rec.modelVersion} · Policy {rec.policyVersion} · Score {rec.score.toFixed(1)}
        </p>
      </Panel>
    </main>
  );
}
