import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { getFeatureFlags } from "@/lib/feature-flags";
import { listAdviserNotes, buildCustomerTimeline } from "@/services/adviser-collab";

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

  const [notes, timeline] = await Promise.all([
    listAdviserNotes(user.id, { sharedOnly: true }),
    buildCustomerTimeline(user.id),
  ]);

  const visibleTimeline = timeline.filter(
    (t) => t.kind !== "note" || t.detail.includes("shared"),
  );

  return (
    <main>
      <PageHeader
        title="Adviser collaboration"
        subtitle="Shared notes and a read-only timeline of material planning events."
        action={
          <Link href="/app/adviser-request" className="btn btn-soft">
            Request adviser
          </Link>
        }
      />

      <section aria-labelledby="shared-notes">
        <h2 id="shared-notes" className="font-display text-xl">
          Shared with you
        </h2>
        <div className="mt-3 space-y-3">
          {notes.length === 0 ? (
            <Panel>
              <p className="muted text-sm">
                No shared adviser notes yet. When your adviser shares a plan action, it appears here
                and in Wealth Inbox.
              </p>
            </Panel>
          ) : (
            notes.map((n) => (
              <Panel key={n.id}>
                <div className="flex flex-wrap gap-2">
                  <Badge>{n.kind.replaceAll("_", " ")}</Badge>
                  <Badge>from {n.adviser.name}</Badge>
                </div>
                <p className="mt-2 font-semibold">{n.title}</p>
                <p className="mt-1 text-sm leading-relaxed">{n.body}</p>
                <p className="muted mt-2 text-xs">
                  {n.createdAt.toLocaleString("en-GB")}
                </p>
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
                <span className="muted text-xs">
                  {new Date(e.at).toLocaleDateString("en-GB")}
                </span>
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
