import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { projectGoal } from "@/engines/goals";
import { formatCurrency } from "@/lib/format";

export default async function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const goal = await prisma.goal.findFirst({ where: { id, userId: user.id } });
  if (!goal) redirect("/app/plan");
  const forecast = projectGoal(goal);

  return (
    <main>
      <PageHeader title={goal.name} subtitle={`${goal.type.replaceAll("_", " ")} forecast`} />
      <Panel>
        <p className="eyebrow">Central projection</p>
        <p className="font-display mt-1 text-4xl">
          {formatCurrency(forecast.projectedNominal, goal.currency, true)}
        </p>
        <p className="muted mt-2 text-sm">
          Illustrative range {formatCurrency(forecast.projectedLow, goal.currency, true)} –{" "}
          {formatCurrency(forecast.projectedHigh, goal.currency, true)}
        </p>
        <div className="mt-3">
          <Badge>Progress {forecast.progressPercent}%</Badge>
        </div>
        <p className="mt-4 leading-relaxed">{forecast.narrative}</p>
      </Panel>
      <Panel className="mt-3">
        <p className="eyebrow">Assumptions</p>
        <ul className="mt-2 space-y-1 text-sm">
          <li>Expected return {(forecast.assumptions.expectedReturnAnnual * 100).toFixed(0)}% p.a.</li>
          <li>Inflation {(forecast.assumptions.inflationAnnual * 100).toFixed(0)}% p.a.</li>
          <li>Months remaining {forecast.monthsRemaining}</li>
          <li>Engine {forecast.engineVersion}</li>
        </ul>
        <p className="muted mt-3 text-sm">
          Scenarios are not guarantees. Change contributions or timing to explore alternatives.
        </p>
      </Panel>
      <Link href="/app/plan/scenarios" className="btn btn-ghost mt-4 w-full">
        Compare decision scenarios
      </Link>
    </main>
  );
}
