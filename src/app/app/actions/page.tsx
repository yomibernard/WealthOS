import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, EmptyState, InsightPanel, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { ensureRecommendations } from "@/services/wealth";
import { prisma } from "@/lib/db";
import { formatNaira } from "@/lib/format";

export default async function ActionsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const proposed = await ensureRecommendations(user.id);

  const history = await prisma.recommendation.findMany({
    where: {
      userId: user.id,
      status: { in: ["ACCEPTED", "REJECTED", "EXECUTED"] },
    },
    orderBy: { updatedAt: "desc" },
    take: 12,
  });

  const doNothing = proposed.find((a) => a.actionType === "DO_NOTHING");
  const active = proposed.filter((a) => a.actionType !== "DO_NOTHING");
  const top3 = active.slice(0, 3);
  const later = active.slice(3);

  return (
    <main>
      <PageHeader
        title="Next best actions"
        subtitle="What deserves attention now — ranked by care, not product revenue."
      />

      {doNothing ? (
        <InsightPanel className="mb-4" eyebrow="No action required">
          <Link href={`/app/actions/${doNothing.id}`} className="font-semibold text-accent">
            {doNothing.title}
          </Link>
          <span className="muted"> — {doNothing.what}</span>
        </InsightPanel>
      ) : null}

      <section>
        <h2 className="font-display text-xl">Top 3 priorities</h2>
        <div className="mt-3 space-y-3">
          {top3.length ? (
            top3.map((a, i) => <ActionRow key={a.id} a={a} rank={i + 1} />)
          ) : (
            <EmptyState
              title="No urgent priorities"
              body="Engines did not surface a material gap. Doing nothing can be the prudent call."
              action={
                <Link href="/app/health" className="btn btn-soft">
                  Review Wealth Health
                </Link>
              }
            />
          )}
        </div>
      </section>

      {later.length ? (
        <section className="mt-6">
          <h2 className="font-display text-xl">Later</h2>
          <div className="mt-3 space-y-3">
            {later.map((a) => (
              <ActionRow key={a.id} a={a} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6">
        <h2 className="font-display text-xl">Completed</h2>
        <div className="mt-3 space-y-3">
          {history.length ? (
            history.map((a) => (
              <Panel key={a.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{a.status}</Badge>
                  <Badge>{a.actionType.replaceAll("_", " ")}</Badge>
                </div>
                <p className="mt-2 font-semibold">{a.title}</p>
                <Link
                  href={`/app/actions/${a.id}`}
                  className="mt-2 inline-block text-sm font-semibold text-accent"
                >
                  Open
                </Link>
              </Panel>
            ))
          ) : (
            <p className="muted text-sm">Accepted, declined, or executed actions will appear here.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function ActionRow({
  a,
  rank,
}: {
  a: {
    id: string;
    actionType: string;
    title: string;
    what: string;
    why: string;
    amount: number | null;
    confidence: number;
    score: number;
    goalLink: string | null;
  };
  rank?: number;
}) {
  return (
    <Link href={`/app/actions/${a.id}`} className="block">
      <article className="action-card transition hover:border-accent">
        <div className="flex flex-wrap items-center gap-2">
          {rank != null ? <Badge>#{rank}</Badge> : null}
          <Badge>{a.actionType.replaceAll("_", " ")}</Badge>
          <Badge tone={a.confidence < 0.6 ? "warn" : "default"}>
            Confidence {Math.round(a.confidence * 100)}%
          </Badge>
          <Badge>Urgency score {a.score.toFixed(0)}</Badge>
        </div>
        <p className="font-display mt-2 text-xl">{a.title}</p>
        <p className="muted mt-2 text-sm leading-relaxed">{a.what}</p>
        <p className="mt-2 text-sm">
          <span className="font-semibold">Why: </span>
          {a.why}
        </p>
        {a.goalLink ? (
          <p className="muted mt-1 text-sm">Goal link · {a.goalLink}</p>
        ) : null}
        {a.amount != null ? (
          <p className="mt-2 text-sm font-semibold">Estimated outcome {formatNaira(a.amount, true)}</p>
        ) : null}
        <p className="mt-3 text-sm font-semibold text-accent">Review →</p>
      </article>
    </Link>
  );
}
