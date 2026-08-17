import Link from "next/link";
import { healthShortLabel, scoreToArcPath } from "@/engines/wealth-visuals";

export function DashboardHealthCard({
  overall,
  insight,
}: {
  overall: number;
  insight: string;
}) {
  const label = healthShortLabel(overall);
  const arc = scoreToArcPath(overall, 80, 80, 58);

  return (
    <article className="dash-card dash-card-health">
      <p className="dash-card-label">Wealth Health</p>
      <div className="mt-3 flex flex-col items-center">
        <svg viewBox="0 0 160 160" className="h-36 w-36" role="img" aria-label={`Wealth Health ${overall} — ${label}`}>
          <circle cx="80" cy="80" r="58" fill="none" stroke="var(--line)" strokeWidth="12" />
          <path d={arc} fill="none" stroke="var(--accent)" strokeWidth="12" strokeLinecap="round" />
          <text
            x="80"
            y="78"
            textAnchor="middle"
            fill="var(--ink)"
            style={{ fontSize: "36px", fontFamily: "var(--font-display)", fontWeight: 650 }}
          >
            {overall}
          </text>
          <text
            x="80"
            y="102"
            textAnchor="middle"
            fill="var(--muted)"
            style={{ fontSize: "12px", fontWeight: 600 }}
          >
            {label}
          </text>
        </svg>
        <p className="muted mt-2 text-center text-sm leading-relaxed">{insight}</p>
        <Link href="/app/health" className="btn btn-soft mt-4 w-full justify-center">
          See full report
        </Link>
      </div>
    </article>
  );
}
