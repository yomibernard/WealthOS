import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Badge,
  EmptyState,
  HeroMetric,
  InsightPanel,
  PageHeader,
  ProgressBar,
} from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { buildFundingPulse } from "@/engines/goal-funding";
import { formatCurrency, formatNaira } from "@/lib/format";

function trackLabel(status: string): string {
  if (status === "ahead" || status === "on_track") return "On track";
  if (status === "behind") return "Needs attention";
  if (status === "critical" || status === "expired") return "Off track";
  return status;
}

function trackTone(status: string): "default" | "warn" | "danger" {
  if (status === "critical" || status === "expired") return "danger";
  if (status === "behind") return "warn";
  return "default";
}

export default async function PlanPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const goals = await prisma.goal.findMany({
    where: { userId: user.id },
    orderBy: { priority: "asc" },
  });

  const pulse = buildFundingPulse(
    goals.map((g) => ({
      id: g.id,
      name: g.name,
      type: g.type,
      currency: g.currency,
      priority: g.priority,
      targetAmount: g.targetAmount,
      targetDate: g.targetDate,
      existingAllocation: g.existingAllocation,
      monthlyContribution: g.monthlyContribution,
    })),
  );

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalAllocated = goals.reduce((s, g) => s + g.existingAllocation, 0);
  const combinedPct =
    totalTarget > 0 ? Math.min(100, Math.round((totalAllocated / totalTarget) * 100)) : 0;

  return (
    <main>
      <PageHeader
        title="Plan"
        subtitle="Whether you are financially on track — goals first, products later."
        action={
          <Link href="/app/plan/new" className="btn btn-soft">
            New goal
          </Link>
        }
      />

      <HeroMetric
        label="Your financial future"
        value={goals.length ? `${combinedPct}% funded` : "No goals yet"}
        hint={
          goals.length ? (
            <>
              <Badge>
                Allocated {formatNaira(totalAllocated, true)} of {formatNaira(totalTarget, true)}
              </Badge>
              <Badge tone={pulse.behindCount ? "warn" : "default"}>
                {pulse.behindCount
                  ? `${pulse.behindCount} need funding attention`
                  : "Funding looks steady"}
              </Badge>
            </>
          ) : undefined
        }
      >
        {goals.length ? (
          <div className="mt-4 max-w-xl">
            <ProgressBar value={combinedPct} label="Combined goal funding (current allocations)" />
            <p className="muted mt-2 text-sm leading-relaxed">{pulse.summary}</p>
          </div>
        ) : null}
      </HeroMetric>

      {goals.length ? (
        <InsightPanel className="mt-4" eyebrow="This month">
          Contributing {formatNaira(pulse.totalCurrentMonthly, true)}/mo across goals
          {pulse.totalMonthlyGap > 0
            ? ` · modelled gap ${formatNaira(pulse.totalMonthlyGap, true)}/mo to stay on the central path`
            : " · no modelled monthly gap at current settings"}
          .
        </InsightPanel>
      ) : null}

      <section className="mt-5">
        <h2 className="font-display text-xl">Goals</h2>
        <div className="mt-3 space-y-3">
          {goals.length ? (
            pulse.goals.map((g) => (
              <Link key={g.id} href={`/app/plan/${g.id}`} className="block">
                <article className="goal-card transition hover:border-accent">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{g.name}</p>
                      <p className="muted text-sm">
                        {g.type.replaceAll("_", " ")} ·{" "}
                        {formatCurrency(g.monthlyContribution, g.currency, true)}/mo ·{" "}
                        {g.monthsRemaining} mo left
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-2xl">{g.progressPercent}%</p>
                      <Badge tone={trackTone(g.status)}>{trackLabel(g.status)}</Badge>
                    </div>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={g.progressPercent} />
                  </div>
                  {g.monthlyGap > 0 ? (
                    <p className="muted mt-2 text-xs">
                      Next contribution focus ≈ {formatCurrency(g.requiredMonthly, g.currency, true)}
                      /mo
                    </p>
                  ) : (
                    <p className="muted mt-2 text-xs">Open journey & digital twin</p>
                  )}
                </article>
              </Link>
            ))
          ) : (
            <EmptyState
              title="No goals yet"
              body="Add a goal so WealthOS can show progress, funding gaps and future scenarios — not product pitches."
              action={
                <Link href="/app/plan/new" className="btn btn-accent">
                  Add a goal
                </Link>
              }
              secondary={
                <Link href="/app/plan/scenarios" className="text-sm font-semibold text-accent">
                  Explore affordability first
                </Link>
              }
            />
          )}
        </div>
      </section>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Link href="/app/plan/scenarios" className="btn btn-soft w-full">
          Scenario modeller
        </Link>
        <Link href="/app/plan/funding" className="btn btn-ghost w-full">
          Goal funding pulse
        </Link>
      </div>
    </main>
  );
}
