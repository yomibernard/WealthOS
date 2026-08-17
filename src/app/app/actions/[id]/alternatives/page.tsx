import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, InsightPanel, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function AlternativesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const rec = await prisma.recommendation.findFirst({ where: { id, userId: user.id } });
  if (!rec) redirect("/app/actions");
  const alternatives = (JSON.parse(rec.alternativesJson || "[]") as string[]).slice(0, 4);

  return (
    <main>
      <PageHeader
        title="Alternatives"
        subtitle={`Other reasonable options beside “${rec.title}”.`}
      />

      <InsightPanel eyebrow="Why the preferred ranks higher">
        {rec.why} Score {rec.score.toFixed(1)} · confidence {Math.round(rec.confidence * 100)}%.
        Ranking is care-weighted, not product-revenue-weighted.
      </InsightPanel>

      <Panel className="mt-4">
        <div className="flex flex-wrap gap-2">
          <Badge>Preferred</Badge>
          <Badge>{rec.actionType.replaceAll("_", " ")}</Badge>
        </div>
        <p className="font-display mt-2 text-xl">{rec.title}</p>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="muted">Outcome</dt>
            <dd className="font-semibold">{rec.what}</dd>
          </div>
          <div>
            <dt className="muted">Risk</dt>
            <dd className="font-semibold">{rec.risks}</dd>
          </div>
          <div>
            <dt className="muted">Liquidity</dt>
            <dd className="font-semibold">{rec.liquidityNote ?? "See recommendation detail"}</dd>
          </div>
          <div>
            <dt className="muted">Cost</dt>
            <dd className="font-semibold">{rec.costsNote ?? "No separate cost line modelled"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="muted">Goal impact</dt>
            <dd className="font-semibold">{rec.goalLink ?? "Not tied to a single goal"}</dd>
          </div>
        </dl>
      </Panel>

      <div className="mt-4 space-y-3">
        {alternatives.length ? (
          alternatives.map((a, i) => (
            <Panel key={a}>
              <p className="eyebrow">Alternative {i + 1}</p>
              <p className="mt-1 font-semibold">{a}</p>
              <p className="muted mt-2 text-sm leading-relaxed">
                Compared qualitatively to the preferred action on outcome, risk, liquidity, cost, and
                goal fit. Engines surface these as reasonable options — not product shelves.
              </p>
            </Panel>
          ))
        ) : (
          <Panel>
            <p className="muted text-sm">No alternative strings were stored for this recommendation.</p>
          </Panel>
        )}
      </div>

      <Link href={`/app/actions/${rec.id}`} className="btn btn-ghost mt-4 w-full">
        Back to recommendation
      </Link>
    </main>
  );
}
