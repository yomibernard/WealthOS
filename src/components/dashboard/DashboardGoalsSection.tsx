import Link from "next/link";
import { GraduationCap, Home, MoreHorizontal, Target, TreePine } from "lucide-react";
import { formatNaira } from "@/lib/format";

export type DashboardGoal = {
  id: string;
  name: string;
  type: string;
  progress: number;
  currentAmount: number;
  targetAmount: number;
  targetDateIso: string;
  href: string;
};

function iconFor(type: string) {
  if (type === "RETIREMENT") return TreePine;
  if (type === "EDUCATION") return GraduationCap;
  if (type === "PROPERTY" || type === "HOME") return Home;
  return Target;
}

export function DashboardGoalsSection({ goals }: { goals: DashboardGoal[] }) {
  return (
    <section className="dash-section">
      <div className="flex items-end justify-between gap-2">
        <h2 className="dash-section-title">Your goals</h2>
        <Link href="/app/plan" className="dash-card-link">
          Open Plan
        </Link>
      </div>
      {goals.length === 0 ? (
        <article className="dash-card mt-3">
          <p className="muted text-sm">
            Add a goal so WealthOS can show funding progress — not product pitches.
          </p>
          <Link href="/app/plan/new" className="btn btn-accent mt-3 inline-flex">
            Add a goal
          </Link>
        </article>
      ) : (
        <div className="dash-goals-grid mt-3">
          {goals.map((g) => {
            const Icon = iconFor(g.type);
            const pct = Math.max(0, Math.min(100, Math.round(g.progress)));
            const dateLabel = new Date(g.targetDateIso).toLocaleDateString("en-GB", {
              month: "short",
              year: "numeric",
            });
            return (
              <article key={g.id} className="dash-card dash-goal-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="dash-goal-icon" aria-hidden>
                      <Icon size={16} />
                    </span>
                    <h3 className="font-semibold">{g.name}</h3>
                  </div>
                  <Link
                    href={g.href}
                    className="muted rounded-lg p-1 hover:bg-accent-soft"
                    aria-label={`Open ${g.name}`}
                  >
                    <MoreHorizontal size={16} />
                  </Link>
                </div>
                <p className="mt-3 text-sm">
                  <span className="font-semibold">{formatNaira(g.currentAmount, true)}</span>
                  <span className="muted"> of {formatNaira(g.targetAmount, true)}</span>
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" aria-hidden>
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="muted mt-2 flex justify-between text-xs">
                  <span>{pct}% funded</span>
                  <span>Target {dateLabel}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
