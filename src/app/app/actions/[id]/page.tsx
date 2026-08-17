import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionCard, Badge, InsightPanel, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatNaira } from "@/lib/format";
import { ActionFeedback } from "@/components/ActionFeedback";

export default async function ActionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const rec = await prisma.recommendation.findFirst({ where: { id, userId: user.id } });
  if (!rec) redirect("/app/actions");
  const alternatives = JSON.parse(rec.alternativesJson || "[]") as string[];
  const assumptions = JSON.parse(rec.assumptionsJson || "{}") as Record<string, unknown>;
  const assumptionLines = Object.entries(assumptions).map(
    ([k, v]) => `${k.replaceAll("_", " ")}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`,
  );

  const isDoNothing = rec.actionType === "DO_NOTHING";

  return (
    <main>
      <PageHeader title={rec.title} subtitle="Explainable recommendation — diagnosis before products." />

      <div className="flex flex-wrap gap-2">
        <Badge>{rec.actionType.replaceAll("_", " ")}</Badge>
        <Badge>Confidence {Math.round(rec.confidence * 100)}%</Badge>
        <Badge>Score {rec.score.toFixed(1)}</Badge>
        <Badge>{rec.status}</Badge>
      </div>

      <Panel className="mt-4 space-y-4">
        <section>
          <p className="eyebrow">Recommendation</p>
          <p className="mt-1 leading-relaxed">{rec.what}</p>
        </section>
        <section>
          <p className="eyebrow">Why</p>
          <p className="mt-1 leading-relaxed">{rec.why}</p>
        </section>
        <section>
          <p className="eyebrow">Financial impact</p>
          <p className="mt-1 leading-relaxed">
            {rec.amount != null
              ? `Modelled amount ${formatNaira(rec.amount, true)}${rec.amountCurrency ? ` (${rec.amountCurrency})` : ""}.`
              : "No single cash amount — impact is risk, liquidity, or readiness."}
            {rec.costsNote ? ` ${rec.costsNote}` : ""}
          </p>
        </section>
        <section>
          <p className="eyebrow">Risks</p>
          <p className="mt-1 leading-relaxed">{rec.risks}</p>
        </section>
        {rec.liquidityNote ? (
          <section>
            <p className="eyebrow">Liquidity</p>
            <p className="mt-1 leading-relaxed">{rec.liquidityNote}</p>
          </section>
        ) : null}
        {rec.goalLink ? (
          <section>
            <p className="eyebrow">Goal link</p>
            <p className="mt-1">{rec.goalLink}</p>
          </section>
        ) : null}
      </Panel>

      <ActionCard className="mt-3">
        <p className="eyebrow">Alternatives</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {alternatives.slice(0, 4).map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        <Link
          href={`/app/actions/${rec.id}/alternatives`}
          className="mt-3 inline-block text-sm font-semibold text-accent"
        >
          Compare alternatives
        </Link>
      </ActionCard>

      <Panel className="mt-3 space-y-3">
        <section>
          <p className="eyebrow">Data used</p>
          <p className="mt-1 text-sm leading-relaxed">
            Ranked from your Wealth Graph, health cues, and goal funding — model {rec.modelVersion},
            policy {rec.policyVersion}. AI does not invent balances.
          </p>
        </section>
        <section>
          <p className="eyebrow">Confidence</p>
          <p className="mt-1 text-sm leading-relaxed">
            {Math.round(rec.confidence * 100)}% — lower confidence means refresh data before acting.
          </p>
        </section>
        {assumptionLines.length ? (
          <section>
            <p className="eyebrow">Assumptions</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {assumptionLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ) : null}
        {rec.providerNote ? (
          <section>
            <p className="eyebrow">Provider note</p>
            <p className="mt-1 text-sm">{rec.providerNote}</p>
          </section>
        ) : null}
        {rec.regulatoryStatus ? (
          <section>
            <p className="eyebrow">Regulatory status</p>
            <p className="mt-1 text-sm">{rec.regulatoryStatus}</p>
          </section>
        ) : null}
        <section>
          <p className="eyebrow">Consent</p>
          <p className="mt-1 text-sm">
            {rec.consentRequired
              ? "Explicit approval required before any material execution."
              : "No execution step for this action."}
          </p>
        </section>
      </Panel>

      <InsightPanel className="mt-4" eyebrow="What happens if I do nothing?">
        {isDoNothing
          ? "This recommendation already favours inaction. Revisit after the next valuation cycle or if a life event changes your picture."
          : "Gaps may widen (liquidity, concentration, protection, or goal funding). Doing nothing can still be valid — WealthOS will keep ranking care, not invent urgency."}
      </InsightPanel>

      <Link href={`/app/actions/${rec.id}/why`} className="btn btn-soft mt-4 w-full">
        Why this recommendation?
      </Link>

      <ActionFeedback
        recommendationId={rec.id}
        actionType={rec.actionType}
        title={rec.title}
      />

      <Link href="/app/support" className="btn btn-ghost mt-2 w-full">
        Speak to adviser / support
      </Link>
      <Link href="/app/actions" className="btn btn-ghost mt-2 w-full">
        Back to actions
      </Link>
    </main>
  );
}
