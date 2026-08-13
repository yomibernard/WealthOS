import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { buildHomeDashboard, ensureRecommendations } from "@/services/wealth";
import { refreshInbox } from "@/services/inbox";
import { formatNaira, greetingForHour } from "@/lib/format";
import { getFeatureFlags } from "@/lib/feature-flags";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");

  await ensureRecommendations(user.id);
  const dash = await buildHomeDashboard(user.id);
  if (!dash) redirect("/auth/sign-in");

  const flags = getFeatureFlags();
  const inbox = flags.wealthInbox ? await refreshInbox(user.id) : { unread: 0 };

  const hour = new Date().getHours();
  const change = dash.monthChange;

  return (
    <main>
      <header className="animate-rise pt-2">
        <p className="eyebrow">Home</p>
        <h1 className="font-display mt-1 text-3xl">{greetingForHour(hour, dash.name)}</h1>
        {flags.wealthInbox ? (
          <Link
            href="/app/inbox"
            className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-accent"
          >
            Wealth Inbox
            {inbox.unread > 0 ? <Badge tone="warn">{inbox.unread} unread</Badge> : null}
          </Link>
        ) : null}
      </header>

      <Panel className="mt-5 animate-rise transition hover:border-accent">
        <Link href="/app/wealth/net-worth" className="block">
          <p className="eyebrow">Net worth</p>
          <p className="font-display mt-1 text-4xl tracking-tight">
            {formatNaira(dash.netWorth.netWorthNgn, true)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {change != null ? (
              <Badge tone={change >= 0 ? "default" : "warn"}>
                {change >= 0 ? "+" : ""}
                {formatNaira(change, true)} this month
              </Badge>
            ) : (
              <Badge>Building history</Badge>
            )}
            <Badge tone={dash.netWorth.confidence >= 0.75 ? "default" : "warn"}>
              Confidence {Math.round(dash.netWorth.confidence * 100)}%
            </Badge>
          </div>
        </Link>
        {dash.netWorth.confidence < 0.75 || dash.netWorth.staleAssetIds.length > 0 ? (
          <Link
            href="/app/wealth/confidence"
            className="mt-3 inline-flex text-sm font-semibold text-accent"
          >
            Fix data quality
            {dash.netWorth.staleAssetIds.length
              ? ` · ${dash.netWorth.staleAssetIds.length} stale`
              : ""}
          </Link>
        ) : null}
      </Panel>

      <div className="mt-3 grid grid-cols-2 gap-3 animate-rise-delay">
        <Link href="/app/health">
          <Panel className="h-full transition hover:border-accent">
            <p className="eyebrow">Wealth Health</p>
            <p className="font-display mt-1 text-3xl">{dash.health.overall}</p>
            <p className="muted text-sm">/ 100</p>
          </Panel>
        </Link>
        <Link href="/app/cashflow">
          <Panel className="h-full transition hover:border-accent">
            <p className="eyebrow">Liquidity</p>
            <p className="font-display mt-1 text-3xl">{dash.emergencyMonths.toFixed(1)}</p>
            <p className="muted text-sm">months · cash flow</p>
          </Panel>
        </Link>
      </div>

      <Panel className="mt-3">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Goals</p>
          <Link href="/app/plan" className="text-sm font-semibold text-accent">
            Plan
          </Link>
        </div>
        <ul className="mt-3 space-y-2">
          {dash.goals.length ? (
            dash.goals.map((g) => (
              <li key={g.name} className="flex items-center justify-between gap-3 text-sm">
                <span>{g.name}</span>
                <span className="font-semibold">{Math.round(g.progress)}%</span>
              </li>
            ))
          ) : (
            <li className="muted text-sm">No goals yet — create one in Plan.</li>
          )}
        </ul>
        {dash.goals.some((g) => g.progress < 85) ? (
          <Link href="/app/plan/funding" className="btn btn-ghost mt-3 w-full">
            Review goal funding
          </Link>
        ) : null}
      </Panel>

      <Panel className="mt-3">
        <p className="eyebrow">Needs your attention</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          {dash.attention.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
        <Link href="/app/actions" className="btn btn-primary mt-4 w-full">
          Review my actions
        </Link>
      </Panel>

      {flags.monthlyReports ? (
        <Link href="/app/reports" className="btn btn-ghost mt-3 w-full">
          Monthly wealth report
        </Link>
      ) : null}

      <Link
        href="/app/ai"
        className="btn btn-soft mt-4 w-full"
        aria-label="Ask WealthAI"
      >
        Ask WealthAI
      </Link>
    </main>
  );
}
