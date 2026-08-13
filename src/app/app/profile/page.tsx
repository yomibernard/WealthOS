import { redirect } from "next/navigation";
import { PageHeader, Panel, ProgressBar } from "@/components/ui";
import { getSessionUser } from "@/lib/session";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");

  return (
    <main>
      <PageHeader title="Financial profile" subtitle="Completeness — not page 7 of 19." />
      <Panel>
        <ProgressBar
          value={user.profileCompleteness}
          label={`Financial Profile ${user.profileCompleteness}% complete`}
        />
        <ul className="muted mt-4 space-y-2 text-sm">
          <li>Risk tolerance: {user.riskTolerance ?? "Not set"}</li>
          <li>Investment experience: {user.investmentExperience ?? "Not set"}</li>
          <li>Liquidity needs: {user.liquidityNeeds ?? "Not set"}</li>
        </ul>
      </Panel>
    </main>
  );
}
