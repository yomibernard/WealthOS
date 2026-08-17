import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, EmptyState, InsightPanel, PageHeader, Panel, ProgressBar } from "@/components/ui";
import { GoalFundingControls } from "@/components/GoalFundingClient";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { buildFundingPulse, type GoalFundingPulse } from "@/engines/goal-funding";
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

function GoalFundingCard({ g }: { g: GoalFundingPulse }) {
  return (
    <Panel className="space-y-2">
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
  );
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

  const onTrack = pulse.goals.filter((g) => g.status === "ahead" || g.status === "on_track");
  const needsAttention = pulse.goals.filter((g) => g.status === "behind");
  const offTrack = pulse.goals.filter((g) => g.status === "critical" || g.status === "expired");

  return (
    <main>
      <PageHeader
        title="Goal funding pulse"
        subtitle="Portfolio-style view of who is funded — labels over traffic-light guilt."
      />

      <Panel className="space-y-2">
        <p className="text-sm leading-relaxed">{pulse.summary}</p>
        <div className="flex flex-wrap gap-2">
          <Badge>{onTrack.length} on track</Badge>
          <Badge tone={needsAttention.length ? "warn" : "default"}>
            {needsAttention.length} need attention
          </Badge>
          <Badge tone={offTrack.length ? "danger" : "default"}>
            {offTrack.length} off track
          </Badge>
          <Badge>Current {formatNaira(pulse.totalCurrentMonthly, true)}/mo</Badge>
        </div>
        <Link href="/app/plan/new" className="btn btn-ghost mt-2 inline-flex">
          Add a goal
        </Link>
      </Panel>

      <InsightPanel className="mt-4" eyebrow="How to read this">
        Status comes from illustrative projections (contributions, timing, assumed returns) — not a
        promise, and not a product order.
      </InsightPanel>

      {!pulse.goals.length ? (
        <div className="mt-4">
          <EmptyState
            title="No goals yet"
            body="Create a goal to see funding groups."
            action={
              <Link href="/app/plan/new" className="btn btn-accent">
                Create a goal
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <FundingGroup title="Fully on track" items={onTrack} empty="None in this band right now." />
          <FundingGroup
            title="Needs attention"
            items={needsAttention}
            empty="Nothing in the middle band."
          />
          <FundingGroup title="Off track" items={offTrack} empty="Nothing critically behind." />
        </>
      )}

      <p className="muted mt-4 text-sm">
        <Link href="/app/plan">← Back to Plan</Link>
      </p>
    </main>
  );
}

function FundingGroup({
  title,
  items,
  empty,
}: {
  title: string;
  items: GoalFundingPulse[];
  empty: string;
}) {
  return (
    <section className="mt-5">
      <h2 className="font-display text-xl">{title}</h2>
      <div className="mt-3 space-y-3">
        {items.length ? (
          items.map((g) => <GoalFundingCard key={g.id} g={g} />)
        ) : (
          <p className="muted text-sm">{empty}</p>
        )}
      </div>
    </section>
  );
}
