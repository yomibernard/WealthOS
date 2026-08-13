import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
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

  return (
    <main>
      <PageHeader title={rec.title} subtitle="Explainable recommendation" />
      <Panel className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge>{rec.actionType.replaceAll("_", " ")}</Badge>
          <Badge>Confidence {Math.round(rec.confidence * 100)}%</Badge>
        </div>
        <section>
          <p className="eyebrow">What</p>
          <p className="mt-1">{rec.what}</p>
        </section>
        {rec.amount != null ? (
          <section>
            <p className="eyebrow">Amount</p>
            <p className="mt-1 font-semibold">{formatNaira(rec.amount, true)}</p>
          </section>
        ) : null}
        <section>
          <p className="eyebrow">Why</p>
          <p className="mt-1">{rec.why}</p>
        </section>
        {rec.goalLink ? (
          <section>
            <p className="eyebrow">Goal</p>
            <p className="mt-1">{rec.goalLink}</p>
          </section>
        ) : null}
        <section>
          <p className="eyebrow">Risks</p>
          <p className="mt-1">{rec.risks}</p>
        </section>
        {rec.liquidityNote ? (
          <section>
            <p className="eyebrow">Liquidity</p>
            <p className="mt-1">{rec.liquidityNote}</p>
          </section>
        ) : null}
        {rec.costsNote ? (
          <section>
            <p className="eyebrow">Costs</p>
            <p className="mt-1">{rec.costsNote}</p>
          </section>
        ) : null}
        <section>
          <p className="eyebrow">Alternatives</p>
          <ul className="mt-1 list-disc pl-5">
            {alternatives.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
        {rec.providerNote ? (
          <section>
            <p className="eyebrow">Provider</p>
            <p className="mt-1">{rec.providerNote}</p>
          </section>
        ) : null}
        {rec.regulatoryStatus ? (
          <section>
            <p className="eyebrow">Regulatory status</p>
            <p className="mt-1">{rec.regulatoryStatus}</p>
          </section>
        ) : null}
        <section>
          <p className="eyebrow">Assumptions</p>
          <pre className="mt-1 overflow-auto rounded-xl bg-surface p-3 text-xs">
            {JSON.stringify(assumptions, null, 2)}
          </pre>
        </section>
        <section>
          <p className="eyebrow">Consent</p>
          <p className="mt-1">
            {rec.consentRequired
              ? "Explicit approval required before any material execution."
              : "No execution step for this action."}
          </p>
        </section>
      </Panel>

      <Link href={`/app/actions/${rec.id}/why`} className="btn btn-soft mt-4 w-full">
        Why this recommendation?
      </Link>
      <Link href={`/app/actions/${rec.id}/alternatives`} className="btn btn-ghost mt-2 w-full">
        View alternatives
      </Link>

      <ActionFeedback
        recommendationId={rec.id}
        actionType={rec.actionType}
        title={rec.title}
      />
    </main>
  );
}
