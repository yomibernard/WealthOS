import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { GenerateWeeklyDigestButton } from "@/components/WeeklyDigestClient";
import { ShareWithAdviser } from "@/components/ShareWithAdviser";
import { getSessionUser } from "@/lib/session";
import { getFeatureFlags } from "@/lib/feature-flags";
import { loadLatestWeeklyDigest } from "@/services/weekly-digest";
import { listLinkedAdviser } from "@/services/adviser-share";

export default async function WeeklyDigestPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");

  const flags = getFeatureFlags();
  if (!flags.weeklyDigest) {
    return (
      <main>
        <PageHeader title="Weekly digest" subtitle="This capability is temporarily unavailable." />
      </main>
    );
  }

  const [{ stored, generatedAt, live }, link] = await Promise.all([
    loadLatestWeeklyDigest(user.id),
    listLinkedAdviser(user.id),
  ]);
  const view = stored ?? live;

  return (
    <main>
      <PageHeader
        title="Weekly wealth digest"
        subtitle="One calm summary of position, data quality, funding, and inbox — informational only."
      />

      <Panel className="space-y-3">
        <GenerateWeeklyDigestButton />
        {generatedAt ? (
          <p className="muted text-sm">
            Last saved digest: {new Date(generatedAt).toLocaleString("en-NG")}
          </p>
        ) : (
          <p className="muted text-sm">No saved digest yet — generate to create a notification and snapshot.</p>
        )}
      </Panel>

      {view ? (
        <>
          <Panel className="mt-4 space-y-2">
            <p className="eyebrow">This week</p>
            <h2 className="font-display text-2xl">{view.headline}</h2>
          </Panel>

          <div className="mt-3 space-y-3">
            {view.sections.map((s) => (
              <Panel key={s.id} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-xl">{s.title}</h3>
                  <Badge tone={s.tone === "watch" ? "warn" : "default"}>
                    {s.tone === "watch" ? "Look" : s.tone === "ok" ? "Steady" : "Info"}
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed">{s.body}</p>
                {s.href ? (
                  <Link href={s.href} className="text-sm font-semibold text-accent">
                    Open →
                  </Link>
                ) : null}
              </Panel>
            ))}
          </div>

          <Panel className="mt-4 space-y-2">
            <p className="eyebrow">Suggested next looks</p>
            <ul className="space-y-2">
              {view.nextSteps.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="font-medium text-accent underline-offset-2 hover:underline">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="muted mt-3 text-sm">{view.disclaimer}</p>
          </Panel>
        </>
      ) : (
        <Panel className="mt-4">
          <p className="muted text-sm">Unable to compose a live digest right now.</p>
        </Panel>
      )}

      {flags.adviserCollab ? (
        <Panel className="mt-4 space-y-2">
          <p className="eyebrow">Share</p>
          <ShareWithAdviser
            defaultPack="weekly_digest"
            adviserName={link?.adviser.name ?? null}
          />
        </Panel>
      ) : null}

      <p className="muted mt-4 text-sm">
        Related: <Link href="/app/reports">Monthly reports</Link> ·{" "}
        <Link href="/app/inbox">Wealth Inbox</Link>
      </p>
    </main>
  );
}
