import { redirect } from "next/navigation";
import { ScenarioStudio } from "@/components/plan/ScenarioStudio";
import { getSessionUser } from "@/lib/session";
import { buildHomeDashboard } from "@/services/wealth";

export default async function ScenariosPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const dash = await buildHomeDashboard(user.id);
  if (!dash) redirect("/auth/sign-in");

  return (
    <main>
      <ScenarioStudio baseNetWorthNgn={dash.netWorth.netWorthNgn} />
    </main>
  );
}
