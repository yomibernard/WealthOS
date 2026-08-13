import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel, ProgressBar } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { getFeatureFlags } from "@/lib/feature-flags";
import { syncProfileCompleteness } from "@/services/profile-completeness";
import { listLinkedAdviser } from "@/services/adviser-share";
import { ShareWithAdviser } from "@/components/ShareWithAdviser";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");

  const [report, link] = await Promise.all([
    syncProfileCompleteness(user.id),
    listLinkedAdviser(user.id),
  ]);
  if (!report) redirect("/auth/sign-in");
  const flags = getFeatureFlags();

  return (
    <main>
      <PageHeader
        title="Financial profile"
        subtitle="Completeness with a clear checklist — not page 7 of 19."
      />
      <Panel className="space-y-3">
        <ProgressBar
          value={report.score}
          label={`Financial Profile ${report.score}% complete`}
        />
        <p className="text-sm leading-relaxed">{report.summary}</p>
        <div className="flex flex-wrap gap-2">
          <Badge>{report.checks.filter((c) => c.done).length} done</Badge>
          <Badge tone={report.missing.length ? "warn" : "default"}>
            {report.missing.length} remaining
          </Badge>
        </div>
        {report.nextHref ? (
          <Link href={report.nextHref} className="btn btn-primary inline-flex">
            Continue next gap
          </Link>
        ) : null}
      </Panel>

      <Panel className="mt-4 space-y-3">
        <p className="eyebrow">Checklist</p>
        <ul className="divide-y divide-line">
          {report.checks.map((c) => (
            <li key={c.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div>
                <p className="font-medium">
                  {c.done ? "✓ " : "○ "}
                  {c.label}
                </p>
                <p className="muted text-sm">{c.hint}</p>
              </div>
              {c.done ? (
                <Badge>Done</Badge>
              ) : (
                <Link href={c.href} className="btn btn-ghost text-sm">
                  Fix
                </Link>
              )}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="mt-4">
        <p className="eyebrow">Stored risk signals</p>
        <ul className="muted mt-2 space-y-2 text-sm">
          <li>Risk tolerance: {user.riskTolerance ?? "Not set"}</li>
          <li>Investment experience: {user.investmentExperience ?? "Not set"}</li>
          <li>Liquidity needs: {user.liquidityNeeds ?? "Not set"}</li>
        </ul>
        <Link href="/onboarding/fact-find" className="btn btn-soft mt-4 inline-flex">
          Update fact-find
        </Link>
      </Panel>

      {flags.adviserCollab ? (
        <Panel className="mt-4 space-y-2">
          <p className="eyebrow">Share with adviser</p>
          <ShareWithAdviser defaultPack="profile" adviserName={link?.adviser.name ?? null} />
        </Panel>
      ) : null}
    </main>
  );
}
