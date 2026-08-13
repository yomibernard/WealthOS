/**
 * Goal funding pulse v1.0 — who is behind, and by how much monthly.
 * Illustrative projections only; not a promise of outcome.
 */

import { projectGoal, type GoalModelInput } from "@/engines/goals";

export const GOAL_FUNDING_VERSION = "goal-funding-1.0";

export type FundingStatus = "ahead" | "on_track" | "behind" | "critical" | "expired";

export type GoalFundingInput = GoalModelInput & {
  id: string;
  name: string;
  type: string;
  currency: string;
  priority: number;
};

export type GoalFundingPulse = {
  id: string;
  name: string;
  type: string;
  currency: string;
  priority: number;
  status: FundingStatus;
  progressPercent: number;
  monthsRemaining: number;
  monthlyContribution: number;
  requiredMonthly: number;
  monthlyGap: number;
  shortfall: number;
  projectedNominal: number;
  narrative: string;
};

export type FundingPulseReport = {
  version: string;
  goals: GoalFundingPulse[];
  behindCount: number;
  totalMonthlyGap: number;
  totalRequiredMonthly: number;
  totalCurrentMonthly: number;
  summary: string;
};

function statusFromForecast(
  progressPercent: number,
  monthsRemaining: number,
  shortfall: number,
): FundingStatus {
  if (monthsRemaining <= 0 && shortfall > 0) return "expired";
  if (monthsRemaining <= 0) return "on_track";
  if (progressPercent >= 110) return "ahead";
  if (progressPercent >= 85) return "on_track";
  if (progressPercent >= 55) return "behind";
  return "critical";
}

export function assessGoalFunding(goal: GoalFundingInput): GoalFundingPulse {
  const forecast = projectGoal(goal);
  const status = statusFromForecast(
    forecast.progressPercent,
    forecast.monthsRemaining,
    forecast.shortfall,
  );
  const monthlyGap = Math.max(0, forecast.requiredMonthly - goal.monthlyContribution);

  return {
    id: goal.id,
    name: goal.name,
    type: goal.type,
    currency: goal.currency,
    priority: goal.priority,
    status,
    progressPercent: forecast.progressPercent,
    monthsRemaining: forecast.monthsRemaining,
    monthlyContribution: goal.monthlyContribution,
    requiredMonthly: forecast.requiredMonthly,
    monthlyGap,
    shortfall: forecast.shortfall,
    projectedNominal: forecast.projectedNominal,
    narrative: forecast.narrative,
  };
}

export function buildFundingPulse(goals: GoalFundingInput[]): FundingPulseReport {
  const assessed = goals
    .map(assessGoalFunding)
    .sort((a, b) => {
      const rank = { critical: 0, expired: 1, behind: 2, on_track: 3, ahead: 4 };
      const d = rank[a.status] - rank[b.status];
      if (d !== 0) return d;
      return a.priority - b.priority;
    });

  const behind = assessed.filter((g) =>
    ["behind", "critical", "expired"].includes(g.status),
  );
  const totalMonthlyGap = behind.reduce((s, g) => s + g.monthlyGap, 0);
  const totalRequiredMonthly = assessed.reduce((s, g) => s + g.requiredMonthly, 0);
  const totalCurrentMonthly = assessed.reduce((s, g) => s + g.monthlyContribution, 0);

  let summary = "Goal funding looks broadly on track under current illustrative assumptions.";
  if (behind.length === 0 && assessed.length === 0) {
    summary = "No goals yet — create one in Plan to start a funding pulse.";
  } else if (behind.length > 0) {
    summary = `${behind.length} goal(s) need more funding. Closing the modelled gaps would take about ₦${Math.round(totalMonthlyGap).toLocaleString("en-NG")} more per month in total (illustrative).`;
  }

  return {
    version: GOAL_FUNDING_VERSION,
    goals: assessed,
    behindCount: behind.length,
    totalMonthlyGap,
    totalRequiredMonthly,
    totalCurrentMonthly,
    summary,
  };
}
