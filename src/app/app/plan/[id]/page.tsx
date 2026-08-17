import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { GoalJourneyExplorer } from "@/components/plan/GoalJourneyExplorer";
import { DigitalTwinExplorer } from "@/components/plan/DigitalTwinExplorer";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { buildHomeDashboard } from "@/services/wealth";

export default async function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const goal = await prisma.goal.findFirst({ where: { id, userId: user.id } });
  if (!goal) redirect("/app/plan");
  const dash = await buildHomeDashboard(user.id);

  return (
    <main>
      <PageHeader
        title={goal.name}
        subtitle={`${goal.type.replaceAll("_", " ")} · visual journey & twin`}
      />

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

      {dash ? (
        <DigitalTwinExplorer baseNetWorthNgn={dash.netWorth.netWorthNgn} />
      ) : null}

      <Link href="/app/plan/funding" className="btn btn-soft mt-4 w-full">
        Open funding pulse
      </Link>
      <Link href="/app/plan" className="btn btn-ghost mt-2 w-full">
        Back to Plan
      </Link>
    </main>
  );
}
