import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader, Panel, ProgressBar } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { projectGoal } from "@/engines/goals";
import { formatCurrency } from "@/lib/format";

export default async function PlanPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const goals = await prisma.goal.findMany({
    where: { userId: user.id },
    orderBy: { priority: "asc" },
  });

  return (
    <main>
      <PageHeader
        title="Plan"
        subtitle="Goals, forecasts and scenarios — ranges, not false certainty."
        action={
          <Link href="/app/plan/new" className="btn btn-soft">
            New goal
          </Link>
        }
      />
      <div className="space-y-3">
        {goals.map((g) => {
          const forecast = projectGoal(g);
          return (
            <Link key={g.id} href={`/app/plan/${g.id}`}>
              <Panel>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{g.name}</p>
                    <p className="muted text-sm">
                      Target {formatCurrency(g.targetAmount, g.currency, true)} ·{" "}
                      {g.targetDate.toLocaleDateString("en-GB", {
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <p className="font-display text-2xl">{forecast.progressPercent}%</p>
                </div>
                <div className="mt-3">
                  <ProgressBar value={forecast.progressPercent} />
                </div>
              </Panel>
            </Link>
          );
        })}
      </div>
      <div className="mt-4 grid gap-3">
        <Link href="/app/plan/scenarios" className="btn btn-ghost w-full">
          Scenario comparison
        </Link>
        <Link href="/app/health" className="btn btn-ghost w-full">
          Wealth Health
        </Link>
      </div>
    </main>
  );
}
