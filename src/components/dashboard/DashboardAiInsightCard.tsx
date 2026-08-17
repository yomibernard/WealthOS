import Link from "next/link";

export function DashboardAiInsightCard({
  insight,
  impactLine,
}: {
  insight: string;
  impactLine?: string | null;
}) {
  return (
    <article className="dash-card dash-ai-card">
      <div className="flex flex-wrap items-center gap-2">
        <p className="dash-card-label !text-white/80">WealthAI</p>
        <span className="dash-ai-badge">Insight for you</span>
      </div>
      <p className="mt-4 text-[0.98rem] leading-relaxed text-white/95">{insight}</p>
      {impactLine ? (
        <p className="mt-3 text-sm font-medium text-[color-mix(in_srgb,white_75%,#d8efe7)]">
          {impactLine}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/app/actions" className="btn bg-white text-accent hover:bg-accent-soft">
          Explore suggestion
        </Link>
        <Link
          href="/app/ai"
          className="btn border border-white/35 bg-transparent text-white hover:bg-white/10"
        >
          Ask WealthAI
        </Link>
      </div>
    </article>
  );
}
