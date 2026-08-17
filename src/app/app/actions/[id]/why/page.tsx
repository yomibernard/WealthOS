import Link from "next/link";
import { redirect } from "next/navigation";
import { InsightPanel, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function WhyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const rec = await prisma.recommendation.findFirst({ where: { id, userId: user.id } });
  if (!rec) redirect("/app/actions");
  const assumptions = JSON.parse(rec.assumptionsJson || "{}") as Record<string, unknown>;

  return (
    <main>
      <PageHeader
        title="Why this recommendation?"
        subtitle="Plain-language rationale — not algorithm jargon."
      />

      <InsightPanel eyebrow="We are recommending this because…">
        {rec.why}
      </InsightPanel>

      <Panel className="mt-4 space-y-4">
        <section>
          <p className="eyebrow">Customer data used</p>
          <p className="mt-1 text-sm leading-relaxed">
            Your Wealth Graph estimates, Wealth Health cues, and any linked goal funding that
            engines already calculated. WealthAI only explains those results.
          </p>
        </section>
        {rec.goalLink ? (
          <section>
            <p className="eyebrow">Goal</p>
            <p className="mt-1">{rec.goalLink}</p>
          </section>
        ) : (
          <section>
            <p className="eyebrow">Goal</p>
            <p className="muted mt-1 text-sm">Not tied to a single named goal.</p>
          </section>
        )}
        <section>
          <p className="eyebrow">Risk & suitability lens</p>
          <p className="mt-1 text-sm leading-relaxed">{rec.risks}</p>
        </section>
        {rec.liquidityNote ? (
          <section>
            <p className="eyebrow">Relevant exposures</p>
            <p className="mt-1 text-sm leading-relaxed">{rec.liquidityNote}</p>
          </section>
        ) : null}
        <section>
          <p className="eyebrow">Reasoning</p>
          <p className="mt-1 text-sm leading-relaxed">
            Ranked by financial impact, urgency, risk reduction, goal impact, liquidity, preference,
            suitability, data confidence, and vulnerability care — not revenue opportunity.
          </p>
        </section>
        <section>
          <p className="eyebrow">Assumptions</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {Object.entries(assumptions).length ? (
              Object.entries(assumptions).map(([k, v]) => (
                <li key={k}>
                  {k.replaceAll("_", " ")}:{" "}
                  {typeof v === "object" ? JSON.stringify(v) : String(v)}
                </li>
              ))
            ) : (
              <li>No extra assumption payload beyond the scored recommendation.</li>
            )}
          </ul>
        </section>
        <p className="muted text-xs">
          Model {rec.modelVersion} · Policy {rec.policyVersion} · Score {rec.score.toFixed(1)}
        </p>
      </Panel>

      <Link href={`/app/actions/${rec.id}`} className="btn btn-ghost mt-4 w-full">
        Back to recommendation
      </Link>
    </main>
  );
}
