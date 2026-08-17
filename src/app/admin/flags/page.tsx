import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, InsightPanel, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { loadFlagProfileBoard } from "@/services/flag-profiles";
import { FLAG_ENV_KEYS } from "@/engines/flag-profiles";

const RISK_HINT: Record<string, "high" | "medium" | "low"> = {
  openBankingSim: "high",
  executionSim: "high",
  wealthAiLlm: "medium",
  adviserCollab: "medium",
  monthlyReports: "low",
  weeklyDigest: "low",
};

export default async function AdminFlagsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/auth/sign-in");
  const board = loadFlagProfileBoard();

  const safePilot = board.profiles.find((p) => p.id === "safe_pilot");
  const lockdown = board.profiles.find((p) => p.id === "incident_lockdown");
  const fullDemo = board.profiles.find((p) => p.id === "full_demo");

  return (
    <main className="page-wide">
      <PageHeader
        title="Feature flags"
        subtitle="Controlled system management. Flags are env-driven — copy a profile and redeploy. High-risk toggles are not one-click."
        action={
          <Link href="/admin/ops" className="btn btn-soft">
            Ops board
          </Link>
        }
      />

      <InsightPanel eyebrow="Safety">
        Do not flip high-risk rails casually. Prefer <strong>Safe pilot</strong> for shared demos and{" "}
        <strong>Incident lockdown</strong> when something goes wrong.
      </InsightPanel>

      <section className="mt-4 grid gap-3 lg:grid-cols-2">
        {safePilot ? (
          <Panel className="space-y-2 border-accent/40">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-xl">Safe Pilot Mode</p>
              <Badge tone={safePilot.evaluation.match ? "default" : "warn"}>
                {safePilot.evaluation.match ? "active" : "not matched"}
              </Badge>
            </div>
            <p className="muted text-sm">{safePilot.summary}</p>
            <pre className="overflow-auto rounded-xl bg-white p-3 text-xs">{safePilot.envSnippet}</pre>
          </Panel>
        ) : null}
        {lockdown ? (
          <Panel className="space-y-2 border-danger/30">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-xl">Incident Lockdown</p>
              <Badge tone={lockdown.evaluation.match ? "danger" : "default"}>
                {lockdown.evaluation.match ? "active" : "standby"}
              </Badge>
            </div>
            <p className="muted text-sm">{lockdown.summary}</p>
            <pre className="overflow-auto rounded-xl bg-white p-3 text-xs">{lockdown.envSnippet}</pre>
          </Panel>
        ) : null}
      </section>

      <Panel className="mb-4 mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">Launch profiles</p>
          {board.perfectMatchId ? (
            <Badge>matched: {board.perfectMatchId}</Badge>
          ) : (
            <Badge tone="warn">no exact profile match</Badge>
          )}
          {board.riskyOn.length ? (
            <Badge tone="warn">risky on: {board.riskyOn.join(", ")}</Badge>
          ) : (
            <Badge>no high-risk rails on</Badge>
          )}
        </div>
        <p className="muted mt-1 text-sm">{board.note}</p>
        {fullDemo ? (
          <div className="mt-3">
            <p className="font-semibold">{fullDemo.label}</p>
            <p className="muted mt-1 text-sm">{fullDemo.summary}</p>
            <Badge tone={fullDemo.evaluation.match ? "default" : "warn"}>
              {fullDemo.evaluation.match
                ? "active"
                : `${fullDemo.evaluation.matchCount}/${fullDemo.evaluation.constrainedCount}`}
            </Badge>
            <pre className="mt-3 overflow-auto rounded-xl bg-white p-3 text-xs">
              {fullDemo.envSnippet}
            </pre>
          </div>
        ) : null}
        <p className="muted mt-3 text-xs">
          Incident path: see <Link href="/admin/ops">ops board</Link> and OPS_RUNBOOK SEV table.
          Hosted smoke: <code>npm run smoke:hosted</code> after redeploy.
        </p>
      </Panel>

      <section>
        <p className="eyebrow">Current environment</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {Object.entries(board.current).map(([key, on]) => {
            const risk = RISK_HINT[key] ?? "medium";
            return (
              <Panel key={key}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{key}</p>
                    <p className="muted text-xs">
                      <code>{FLAG_ENV_KEYS[key as keyof typeof FLAG_ENV_KEYS]}</code>
                    </p>
                    <p className="muted mt-1 text-xs">
                      Risk {risk} · change via env + redeploy (not in-app toggle)
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge tone={on ? (risk === "high" ? "warn" : "default") : "default"}>
                      {on ? "on" : "off"}
                    </Badge>
                    {risk === "high" && on ? <Badge tone="warn">high risk</Badge> : null}
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      </section>
    </main>
  );
}
