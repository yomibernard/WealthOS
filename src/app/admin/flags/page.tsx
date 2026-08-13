import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { loadFlagProfileBoard } from "@/services/flag-profiles";
import { FLAG_ENV_KEYS } from "@/engines/flag-profiles";

export default async function AdminFlagsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/auth/sign-in");
  const board = loadFlagProfileBoard();

  return (
    <main className="page-wide">
      <PageHeader
        title="Feature flags"
        subtitle="Environment-driven rollouts. Copy a profile into host env and redeploy — flags are not toggled in-app."
      />

      <Panel className="mb-4">
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
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {board.profiles.map((p) => (
            <Panel key={p.id} className="border border-line bg-surface/40">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{p.label}</p>
                <Badge tone={p.evaluation.match ? "default" : "warn"}>
                  {p.evaluation.match
                    ? "active"
                    : `${p.evaluation.matchCount}/${p.evaluation.constrainedCount}`}
                </Badge>
              </div>
              <p className="muted mt-1 text-sm">{p.summary}</p>
              {p.evaluation.mismatches.length ? (
                <ul className="mt-2 space-y-1 text-xs">
                  {p.evaluation.mismatches.map((m) => (
                    <li key={m.key}>
                      <code>{m.env}</code> want {String(m.expected)}, have {String(m.actual)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-accent">Current env matches this profile.</p>
              )}
              <pre className="mt-3 overflow-auto rounded-xl bg-white p-3 text-xs">{p.envSnippet}</pre>
            </Panel>
          ))}
        </div>
        <p className="muted mt-3 text-xs">
          Incident path: see <Link href="/admin/ops">ops board</Link> and OPS_RUNBOOK SEV table.
          Hosted smoke: <code>npm run smoke:hosted</code> after redeploy.
        </p>
      </Panel>

      <div className="grid gap-3 md:grid-cols-2">
        {Object.entries(board.current).map(([key, on]) => (
          <Panel key={key}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{key}</p>
                <p className="muted text-xs">
                  <code>{FLAG_ENV_KEYS[key as keyof typeof FLAG_ENV_KEYS]}</code>
                </p>
              </div>
              <Badge tone={on ? "default" : "warn"}>{on ? "on" : "off"}</Badge>
            </div>
          </Panel>
        ))}
      </div>
    </main>
  );
}
