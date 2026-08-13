import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel, ProgressBar } from "@/components/ui";
import { GoalFundingControls } from "@/components/GoalFundingClient";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { buildFundingPulse } from "@/engines/goal-funding";
import { formatCurrency, formatNaira } from "@/lib/format";

function statusTone(status: string): "default" | "warn" | "danger" {
  if (status === "critical" || status === "expired") return "danger";
  if (status === "behind") return "warn";
  return "default";
}

function statusLabel(status: string): string {
  switch (status) {
    case "ahead":
      return "Ahead";
    case "on_track":
      return "On track";
    case "behind":
      return "Behind";
    case "critical":
      return "Critical";
    case "expired":
      return "Past target date";
    default:
      return status;
  }
}

export default async function GoalFundingPage() {
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

  return (
    <main>
      <PageHeader
        title="Goal funding pulse"
        subtitle="Illustrative gaps only — raising contributions is a plan choice, not an order to invest."
      />

      <Panel className="space-y-2">
        <p className="text-sm leading-relaxed">{pulse.summary}</p>
        <div className="flex flex-wrap gap-2">
          <Badge tone={pulse.behindCount ? "warn" : "default"}>
            {pulse.behindCount} need funding
          </Badge>
          <Badge>Current {formatNaira(pulse.totalCurrentMonthly, true)}/mo</Badge>
          {pulse.totalMonthlyGap > 0 ? (
            <Badge tone="warn">Gap {formatNaira(pulse.totalMonthlyGap, true)}/mo</Badge>
          ) : null}
        </div>
        <Link href="/app/plan/new" className="btn btn-ghost mt-2 inline-flex">
          Add a goal
        </Link>
      </Panel>

      <div className="mt-4 space-y-3">
        {pulse.goals.length === 0 ? (
          <Panel>
            <p className="muted text-sm">No goals yet. Create one to see funding status.</p>
          </Panel>
        ) : (
          pulse.goals.map((g) => (
            <Panel key={g.id} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/app/plan/${g.id}`}
                    className="font-semibold underline-offset-2 hover:underline"
                  >
                    {g.name}
                  </Link>
                  <p className="muted text-sm">
                    {g.type.replaceAll("_", " ")} · {g.monthsRemaining} mo left ·{" "}
                    {formatCurrency(g.monthlyContribution, g.currency, true)}/mo now
                  </p>
                </div>
                <Badge tone={statusTone(g.status)}>{statusLabel(g.status)}</Badge>
              </div>
              <ProgressBar value={g.progressPercent} />
              <p className="muted text-sm">{g.narrative}</p>
              {g.monthlyGap > 0 ? (
                <p className="text-sm">
                  Suggested monthly:{" "}
                  <span className="font-semibold">
                    {formatCurrency(g.requiredMonthly, g.currency, true)}
                  </span>{" "}
                  (gap {formatCurrency(g.monthlyGap, g.currency, true)})
                </p>
              ) : (
                <p className="text-sm text-accent">No modelled monthly gap at current settings.</p>
              )}
              <GoalFundingControls
                goalId={g.id}
                currentMonthly={g.monthlyContribution}
                suggestedMonthly={g.requiredMonthly}
                currency={g.currency}
              />
            </Panel>
          ))
        )}
      </div>

      <p className="muted mt-4 text-sm">
        <Link href="/app/plan">← Back to Plan</Link>
      </p>
    </main>
  );
}
