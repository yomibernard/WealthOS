import { redirect } from "next/navigation";
import { PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { DEFAULT_HEALTH_WEIGHTS } from "@/engines/wealth-health";
import { SUITABILITY_VERSION } from "@/engines/suitability";
import { NBFA_VERSION } from "@/engines/nbfa";

export default async function AdminRulesPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/auth/sign-in");
  const config = await prisma.healthScoreConfig.findFirst({ where: { active: true } });

  return (
    <main className="page-wide">
      <PageHeader
        title="Rules & model config"
        subtitle="Versioned methodologies. Production edits require maker-checker."
      />
      <Panel>
        <p className="font-semibold">Wealth Health weights ({config?.version ?? "health-1.0"})</p>
        <pre className="mt-2 overflow-auto rounded-xl bg-surface p-3 text-xs">
          {config?.weightsJson ?? JSON.stringify(DEFAULT_HEALTH_WEIGHTS, null, 2)}
        </pre>
      </Panel>
      <Panel className="mt-3">
        <p className="font-semibold">Engine versions</p>
        <ul className="mt-2 space-y-1 text-sm">
          <li>Suitability: {SUITABILITY_VERSION}</li>
          <li>NBFA: {NBFA_VERSION}</li>
        </ul>
      </Panel>
    </main>
  );
}
