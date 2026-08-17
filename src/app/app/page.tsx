import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ActionCard,
  Badge,
  EmptyState,
  GoalCard,
  InsightPanel,
  SupportingPanel,
} from "@/components/ui";
import { NetWorthCurve } from "@/components/charts/NetWorthCurve";
import { UserAvatar } from "@/components/profile/ProfileAvatar";
import { BiometricPromptBanner } from "@/components/security/BiometricPromptBanner";
import { getSessionUser } from "@/lib/session";
import {
  buildHomeDashboard,
  ensureRecommendations,
  loadWealthVisualContext,
} from "@/services/wealth";
import { prisma } from "@/lib/db";
import { refreshInbox } from "@/services/inbox";
import { syncProfileCompleteness } from "@/services/profile-completeness";
import { loadCustomerCasesPulse } from "@/services/customer-cases";
import { loadPrivacyRequestsPulse } from "@/services/privacy";
import { loadCareUpdatePulse } from "@/services/adviser-care-ack";
import { loadCustomerNotificationPulse } from "@/services/notifications";
import { loadNextStepsPulse } from "@/services/next-steps";
import { formatNaira, greetingForHour } from "@/lib/format";
import { getFeatureFlags } from "@/lib/feature-flags";

function buildGroundedInsight(input: {
  monthChange: number | null;
  propertyPercent: number;
  emergencyMonths: number;
  healthOverall: number;
  confidence: number;
}): string {
  const parts: string[] = [];
  if (input.monthChange != null) {
    parts.push(
      input.monthChange >= 0
        ? `Your estimated wealth moved up about ${formatNaira(input.monthChange, true)} versus your last snapshot`
        : `Your estimated wealth moved down about ${formatNaira(Math.abs(input.monthChange), true)} versus your last snapshot`,
    );
  }
  if (input.propertyPercent >= 40) {
    parts.push(
      `property still represents roughly ${Math.round(input.propertyPercent)}% of what you own — your largest concentration`,
    );
  } else if (input.emergencyMonths > 0 && input.emergencyMonths < 3) {
    parts.push(
      `cash cover looks thin at about ${input.emergencyMonths.toFixed(1)} months of expenses`,
    );
  } else if (input.confidence < 0.75) {
    parts.push("a few data gaps are still holding confidence below our preferred range");
  } else if (input.healthOverall < 70) {
    parts.push("Wealth Health shows room to strengthen a few dimensions without rushing products");
  } else {
    parts.push("your picture looks steady — a good moment to review what deserves attention next");
  }
  if (parts.length === 1) return `${parts[0]}.`;
  return `${parts[0]}, but ${parts[1]}.`;
}

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");

  await ensureRecommendations(user.id);
  const dash = await buildHomeDashboard(user.id);
  if (!dash) redirect("/auth/sign-in");

  const flags = getFeatureFlags();
  const inbox = flags.wealthInbox ? await refreshInbox(user.id) : { unread: 0 };
  const [profile, cases, privacyPulse, carePulse, notifyPulse, nextSteps, visuals, passkeyCount] =
    await Promise.all([
      syncProfileCompleteness(user.id),
      loadCustomerCasesPulse(user.id),
      loadPrivacyRequestsPulse(user.id),
      loadCareUpdatePulse(user.id),
      loadCustomerNotificationPulse(user.id),
      loadNextStepsPulse(user.id),
      loadWealthVisualContext(user.id),
      prisma.webAuthnCredential.count({ where: { userId: user.id } }),
    ]);

  const avatarSrc = user.avatarStorageKey
    ? `/api/media?key=${encodeURIComponent(user.avatarStorageKey)}`
    : null;

  const hour = new Date().getHours();
  const change = dash.monthChange;
  const insight = buildGroundedInsight({
    monthChange: change,
    propertyPercent: dash.propertyPercent,
    emergencyMonths: dash.emergencyMonths,
    healthOverall: dash.health.overall,
    confidence: dash.netWorth.confidence,
  });

  const secondarySignals = [
    profile && profile.score < 80
      ? { href: "/app/profile", label: `Complete your profile · ${profile.score}%` }
      : null,
    cases.headline ? { href: cases.primaryHref, label: cases.headline } : null,
    privacyPulse.headline ? { href: privacyPulse.primaryHref, label: privacyPulse.headline } : null,
    carePulse.headline ? { href: carePulse.primaryHref, label: carePulse.headline } : null,
    notifyPulse.headline ? { href: notifyPulse.primaryHref, label: notifyPulse.headline } : null,
    flags.weeklyDigest ? { href: "/app/digest", label: "Weekly wealth digest" } : null,
    flags.monthlyReports ? { href: "/app/reports", label: "Monthly wealth report" } : null,
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <main>
      <header className="animate-rise flex items-start justify-between gap-3 pt-2">
        <div>
          <p className="eyebrow">Home</p>
          <h1 className="font-display mt-1 text-3xl tracking-tight">
            {greetingForHour(hour, dash.name)}
          </h1>
          {flags.wealthInbox ? (
            <Link
              href={inbox.unread > 0 ? "/app/inbox?status=unread" : "/app/inbox"}
              className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-accent"
            >
              Wealth Inbox
              {inbox.unread > 0 ? <Badge tone="warn">{inbox.unread} unread</Badge> : null}
            </Link>
          ) : null}
        </div>
        <Link href="/app/profile" aria-label="Open profile">
          <UserAvatar name={dash.name} src={avatarSrc} />
        </Link>
      </header>

      <BiometricPromptBanner hasPasskey={passkeyCount > 0} />

      <InsightPanel className="mt-5 animate-rise" eyebrow="For you today">
        {insight}
      </InsightPanel>

      <div className="mt-4 animate-rise">
        <NetWorthCurve
          currentNetWorthNgn={dash.netWorth.netWorthNgn}
          snapshots={visuals.snapshots}
          rates={visuals.rates}
          changeNgn={change}
          confidencePct={Math.round(dash.netWorth.confidence * 100)}
        />
      </div>

      {(dash.netWorth.confidence < 0.75 || dash.netWorth.staleAssetIds.length > 0) && (
        <Link
          href="/app/wealth/confidence"
          className="mt-2 inline-flex text-sm font-semibold text-accent"
        >
          Review data quality
          {dash.netWorth.staleAssetIds.length
            ? ` · ${dash.netWorth.staleAssetIds.length} stale`
            : ""}
        </Link>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3 animate-rise-delay">
        <Link href="/app/health" className="block">
          <GoalCard className="h-full transition hover:border-accent">
            <p className="eyebrow">Wealth Health</p>
            <p className="font-display mt-1 text-3xl">{dash.health.overall}</p>
            <p className="muted text-sm">out of 100</p>
          </GoalCard>
        </Link>
        <Link href="/app/cashflow" className="block">
          <GoalCard className="h-full transition hover:border-accent">
            <p className="eyebrow">Liquidity</p>
            <p className="font-display mt-1 text-3xl">{dash.emergencyMonths.toFixed(1)}</p>
            <p className="muted text-sm">months of expenses</p>
          </GoalCard>
        </Link>
      </div>

      <GoalCard className="mt-3">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Goals</p>
          <Link href="/app/plan" className="text-sm font-semibold text-accent">
            Open Plan
          </Link>
        </div>
        {dash.goals.length ? (
          <ul className="mt-3 space-y-2">
            {dash.goals.map((g) => (
              <li key={g.name} className="flex items-center justify-between gap-3 text-sm">
                <span>{g.name}</span>
                <span className="font-semibold">{Math.round(g.progress)}%</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3">
            <EmptyState
              title="No goals yet"
              body="Add a goal so WealthOS can show progress and funding gaps — not product pitches."
              action={
                <Link href="/app/plan/new" className="btn btn-accent">
                  Add a goal
                </Link>
              }
              secondary={
                <Link href="/app/plan" className="text-sm font-semibold text-accent">
                  I&apos;ll do this later
                </Link>
              }
            />
          </div>
        )}
      </GoalCard>

      <ActionCard className="mt-3">
        <p className="eyebrow">Needs your attention</p>
        <p className="muted mt-1 text-sm leading-relaxed">{nextSteps.summary}</p>
        {nextSteps.items[0] ? (
          <div className="mt-4">
            <Link
              href={nextSteps.items[0].href}
              className="font-display text-xl font-semibold text-accent hover:underline"
            >
              {nextSteps.items[0].title}
            </Link>
            <p className="muted mt-2 text-sm leading-relaxed">{nextSteps.items[0].detail}</p>
          </div>
        ) : null}
        {nextSteps.items.length > 1 ? (
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
            {nextSteps.items.slice(1).map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="font-semibold text-accent hover:underline">
                  {item.title}
                </Link>
              </li>
            ))}
          </ol>
        ) : null}
        <Link href={nextSteps.primaryHref} className="btn btn-primary mt-4 w-full">
          {nextSteps.items[0]?.kind === "do_nothing"
            ? "Review my actions"
            : "Take the next step"}
        </Link>
        <Link href="/app/actions" className="btn btn-ghost mt-2 w-full">
          All recommendations
        </Link>
      </ActionCard>

      {secondarySignals.length ? (
        <SupportingPanel className="mt-4">
          <p className="eyebrow">Also for you</p>
          <ul className="mt-3 space-y-2">
            {secondarySignals.map((s) => (
              <li key={s.href + s.label}>
                <Link href={s.href} className="text-sm font-semibold text-accent hover:underline">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </SupportingPanel>
      ) : null}

      <Link href="/app/ai" className="btn btn-soft mt-4 w-full" aria-label="Ask WealthAI">
        Ask WealthAI
      </Link>
    </main>
  );
}
