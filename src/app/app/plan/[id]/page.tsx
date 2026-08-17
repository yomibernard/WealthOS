import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, InsightPanel, PageHeader, Panel } from "@/components/ui";
import { GoalJourneyExplorer } from "@/components/plan/GoalJourneyExplorer";
import { DigitalTwinExplorer } from "@/components/plan/DigitalTwinExplorer";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { buildHomeDashboard } from "@/services/wealth";
import { projectGoal } from "@/engines/goals";
import { formatCurrency } from "@/lib/format";

export default async function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const goal = await prisma.goal.findFirst({ where: { id, userId: user.id } });
  if (!goal) redirect("/app/plan");
  const dash = await buildHomeDashboard(user.id);
  const forecast = projectGoal(goal);
  const gap = Math.max(0, goal.targetAmount - goal.existingAllocation);
  const onTrack = forecast.shortfall <= 0;

  return (
    <main>
      <PageHeader
        title={goal.name}
        subtitle={`${goal.type.replaceAll("_", " ")} · visual journey & twin`}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Panel>
          <p className="eyebrow">Goal amount</p>
          <p className="font-display mt-1 text-2xl">
            {formatCurrency(goal.targetAmount, goal.currency, true)}
          </p>
        </Panel>
        <Panel>
          <p className="eyebrow">Current funding</p>
          <p className="font-display mt-1 text-2xl">
            {formatCurrency(goal.existingAllocation, goal.currency, true)}
          </p>
        </Panel>
        <Panel>
          <p className="eyebrow">Projected funding</p>
          <p className="font-display mt-1 text-2xl">
            {formatCurrency(forecast.projectedNominal, goal.currency, true)}
          </p>
        </Panel>
        <Panel>
          <p className="eyebrow">Gap</p>
          <p className="font-display mt-1 text-2xl">
            {formatCurrency(gap, goal.currency, true)}
          </p>
        </Panel>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge>
          Date{" "}
          {goal.targetDate.toLocaleDateString("en-GB", {
            month: "short",
            year: "numeric",
          })}
        </Badge>
        <Badge tone={onTrack ? "default" : "warn"}>
          {onTrack ? "Central path on track" : "Central path shortfall"}
        </Badge>
        <Badge>
          Monthly {formatCurrency(goal.monthlyContribution, goal.currency, true)}
        </Badge>
        <Badge>Progress {forecast.progressPercent}%</Badge>
      </div>

      <InsightPanel className="mt-4" eyebrow="Probability (illustrative)">
        Range {formatCurrency(forecast.projectedLow, goal.currency, true)} –{" "}
        {formatCurrency(forecast.projectedHigh, goal.currency, true)}. This is an assumption-driven
        band, not a guarantee. {forecast.narrative}
      </InsightPanel>

      <GoalJourneyExplorer
        goal={{
          id: goal.id,
          name: goal.name,
          currency: goal.currency,
          targetAmount: goal.targetAmount,
          existingAllocation: goal.existingAllocation,
          monthlyContribution: goal.monthlyContribution,
          targetDateIso: goal.targetDate.toISOString(),
        }}
      />

      <section className="mt-4 action-card">
        <p className="eyebrow">What can improve this?</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed">
          <li>
            Raise monthly funding toward{" "}
            {formatCurrency(forecast.requiredMonthly, goal.currency, true)} if the shortfall
            matters.
          </li>
          <li>Extend the horizon with the timeline slider — only if the goal date is flexible.</li>
          <li>Confirm allocations so progress is not based on stale estimates.</li>
          <li>Pressure-test affordability in the scenario modeller before changing lifestyle spend.</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/app/plan/funding" className="btn btn-soft">
            Funding pulse
          </Link>
          <Link href="/app/actions" className="btn btn-ghost">
            Next-best actions
          </Link>
          <Link href="/app/plan/scenarios" className="btn btn-ghost">
            Scenarios
          </Link>
        </div>
      </section>

      {dash ? (
        <DigitalTwinExplorer baseNetWorthNgn={dash.netWorth.netWorthNgn} />
      ) : null}

      <Link href="/app/plan" className="btn btn-ghost mt-4 w-full">
        Back to Plan
      </Link>
    </main>
  );
}
