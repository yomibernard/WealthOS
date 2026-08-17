import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, InsightPanel, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { getFeatureFlags } from "@/lib/feature-flags";
import { listAdviserNotes, buildCustomerTimeline } from "@/services/adviser-collab";
import { listLinkedAdviser } from "@/services/adviser-share";
import { ShareWithAdviser } from "@/components/ShareWithAdviser";

export default async function AdviserCollabPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  if (!getFeatureFlags().adviserCollab) {
    return (
      <main>
        <PageHeader title="Adviser collaboration" subtitle="Temporarily unavailable." />
      </main>
    );
  }

  const [notes, timeline, link] = await Promise.all([
    listAdviserNotes(user.id, { sharedOnly: true }),
    buildCustomerTimeline(user.id),
    listLinkedAdviser(user.id),
  ]);

  const visibleTimeline = timeline.filter(
    (t) => t.kind !== "note" || t.detail.includes("shared"),
  );

  const lastInteraction = visibleTimeline[0] ?? null;
  const adviserName = link?.adviser.name ?? null;
  const adviserEmail = link?.adviser.email ?? null;

  return (
    <main>
      <PageHeader
        title="Adviser collaboration"
        subtitle="A trusted relationship — profile, shared notes, and a calm timeline. Nothing executes without you."
        action={
          <Link href="/app/adviser-request" className="btn btn-soft">
            Request review
          </Link>
        }
      />

      <InsightPanel eyebrow="How this works">
        Share briefings, read shared notes, and request human review when you want a regulated
        adviser&apos;s eye — not a chat inbox.
      </InsightPanel>

      <Panel className="mb-6 mt-4 space-y-4">
        <p className="eyebrow">Your adviser</p>
        {adviserName ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-2xl">{adviserName}</p>
                {adviserEmail ? <p className="muted mt-1 text-sm">{adviserEmail}</p> : null}
              </div>
              <Badge tone="ok">Linked</Badge>
            </div>
            {lastInteraction ? (
              <p className="muted text-sm">
                Last interaction · {new Date(lastInteraction.at).toLocaleDateString("en-GB")} —{" "}
                {lastInteraction.title}
              </p>
            ) : (
              <p className="muted text-sm">No shared activity yet — share a briefing to start.</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Link href="/app/adviser-request" className="btn btn-soft">
                Message / request help
              </Link>
              <Link href="#share-briefing" className="btn btn-ghost">
                Share briefing
              </Link>
              <Link href="/app/adviser-request" className="btn btn-ghost">
                Request review
              </Link>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <p className="font-semibold">No adviser linked yet</p>
            <p className="muted text-sm leading-relaxed">
              Request human review to start a trusted relationship. Once linked, you can share
              briefings and see a shared thread here.
            </p>
            <Link href="/app/adviser-request" className="btn btn-accent inline-flex">
              Request an adviser
            </Link>
          </div>
        )}
      </Panel>

      <Panel id="share-briefing" className="mb-6 space-y-2">
        <p className="eyebrow">Share a briefing</p>
        <ShareWithAdviser defaultPack="full" adviserName={adviserName} />
      </Panel>

      <section aria-labelledby="shared-notes">
        <h2 id="shared-notes" className="font-display text-xl">
          Shared thread
        </h2>
        <div className="mt-3 space-y-3">
          {notes.length === 0 ? (
            <Panel>
              <p className="muted text-sm">
                No shared notes yet. Share a briefing above, or wait for your adviser to share a plan
                action.
              </p>
            </Panel>
          ) : (
            notes.map((n) => (
              <Panel key={n.id}>
                <div className="flex flex-wrap gap-2">
                  <Badge>{n.kind.replaceAll("_", " ")}</Badge>
                  <Badge>
                    {n.kind === "customer_share"
                      ? "you shared"
                      : n.kind === "adviser_nudge"
                        ? `nudge from ${n.adviser.name}`
                        : `from ${n.adviser.name}`}
                  </Badge>
                </div>
                <p className="mt-2 font-semibold">{n.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{n.body}</p>
                <p className="muted mt-2 text-xs">{n.createdAt.toLocaleString("en-GB")}</p>
              </Panel>
            ))
          )}
        </div>
      </section>

      <section className="mt-6" aria-labelledby="timeline">
        <h2 id="timeline" className="font-display text-xl">
          Your timeline
        </h2>
        <ol className="mt-3 space-y-3">
          {visibleTimeline.slice(0, 20).map((e) => (
            <Panel key={e.id}>
              <div className="flex flex-wrap gap-2">
                <Badge>{e.kind.replaceAll("_", " ")}</Badge>
                <span className="muted text-xs">{new Date(e.at).toLocaleDateString("en-GB")}</span>
              </div>
              <p className="mt-2 font-medium">{e.title}</p>
              <p className="muted text-sm">{e.detail}</p>
            </Panel>
          ))}
        </ol>
      </section>
    </main>
  );
}
