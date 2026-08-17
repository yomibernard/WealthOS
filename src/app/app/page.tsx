import Link from "next/link";
import { redirect } from "next/navigation";
import { BiometricPromptBanner } from "@/components/security/BiometricPromptBanner";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardNetWorthCard } from "@/components/dashboard/DashboardNetWorthCard";
import { DashboardHealthCard } from "@/components/dashboard/DashboardHealthCard";
import { DashboardAllocationCard } from "@/components/dashboard/DashboardAllocationCard";
import { DashboardAttentionRow } from "@/components/dashboard/DashboardAttentionRow";
import { DashboardAiInsightCard } from "@/components/dashboard/DashboardAiInsightCard";
import { DashboardGoalsSection } from "@/components/dashboard/DashboardGoalsSection";
import { DashboardAssetsSection } from "@/components/dashboard/DashboardAssetsSection";
import { getSessionUser } from "@/lib/session";
import {
  buildHomeDashboard,
  ensureRecommendations,
  loadHomeAssetShowcase,
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
import { formatNaira } from "@/lib/format";
import { getFeatureFlags } from "@/lib/feature-flags";
import { buildWealthMapSegments, healthShortLabel } from "@/engines/wealth-visuals";

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
  const [
    profile,
    cases,
    privacyPulse,
    carePulse,
    notifyPulse,
    nextSteps,
    visuals,
    passkeyCount,
    showcaseAssets,
  ] = await Promise.all([
    syncProfileCompleteness(user.id),
    loadCustomerCasesPulse(user.id),
    loadPrivacyRequestsPulse(user.id),
    loadCareUpdatePulse(user.id),
    loadCustomerNotificationPulse(user.id),
    loadNextStepsPulse(user.id),
    loadWealthVisualContext(user.id),
    prisma.webAuthnCredential.count({ where: { userId: user.id } }),
    loadHomeAssetShowcase(user.id),
  ]);

  const avatarSrc = user.avatarStorageKey
    ? `/api/media?key=${encodeURIComponent(user.avatarStorageKey)}`
    : null;

  const hour = new Date().getHours();
  const insight = buildGroundedInsight({
    monthChange: dash.monthChange,
    propertyPercent: dash.propertyPercent,
    emergencyMonths: dash.emergencyMonths,
    healthOverall: dash.health.overall,
    confidence: dash.netWorth.confidence,
  });

  const segments = buildWealthMapSegments(
    dash.netWorth.assetBreakdown,
    dash.netWorth.totalLiabilitiesNgn,
  );

  const attentionItems = nextSteps.items.slice(0, 3).map((item) => ({
    id: item.id,
    title: item.title,
    detail: item.detail,
    href: item.href,
  }));

  const secondarySignals = [
    carePulse.headline ? { href: carePulse.primaryHref, label: carePulse.headline } : null,
    notifyPulse.headline ? { href: notifyPulse.primaryHref, label: notifyPulse.headline } : null,
    cases.headline ? { href: cases.primaryHref, label: cases.headline } : null,
    privacyPulse.headline ? { href: privacyPulse.primaryHref, label: privacyPulse.headline } : null,
  ].filter(Boolean) as { href: string; label: string }[];

  const healthInsight = `Score ${dash.health.overall}/100 · ${healthShortLabel(dash.health.overall)}. ${
    dash.emergencyMonths < 3
      ? "Liquidity is the dimension to watch first."
      : "Review dimensions before considering new products."
  }`;

  const impactLine =
    dash.actions[0]?.amount != null
      ? `Potential focus: ${dash.actions[0].title}`
      : dash.monthChange != null
        ? `Latest snapshot move: ${dash.monthChange >= 0 ? "+" : ""}${formatNaira(dash.monthChange, true)}`
        : null;

  const lastLogin = new Date().toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const inboxUnreadHref = "/app/inbox?status=unread";

  return (
    <main className="dash-home">
      <DashboardHeader
        name={dash.name}
        hour={hour}
        avatarSrc={avatarSrc}
        profileScore={profile?.score ?? null}
        biometricsEnabled={passkeyCount > 0}
        unreadCount={inbox.unread}
      />

      <BiometricPromptBanner hasPasskey={passkeyCount > 0} />

      <section className="dash-hero-grid mt-5" aria-label="Wealth overview">
        <DashboardNetWorthCard
          currentNetWorthNgn={dash.netWorth.netWorthNgn}
          snapshots={visuals.snapshots}
          rates={visuals.rates}
          changeNgn={dash.monthChange}
          changePct={dash.changePct}
        />
        <DashboardHealthCard overall={dash.health.overall} insight={healthInsight} />
        <DashboardAllocationCard
          segments={segments}
          totalAssetsNgn={dash.netWorth.totalAssetsNgn}
        />
      </section>

      <div className="dash-mid-grid mt-5">
        <div className="space-y-5 min-w-0">
          {/* Needs your attention — next-steps pulse */}
          <DashboardAttentionRow items={attentionItems} />
          <DashboardGoalsSection goals={dash.goals} />
        </div>
        <DashboardAiInsightCard insight={insight} impactLine={impactLine} />
      </div>

      <div className="mt-5">
        <DashboardAssetsSection assets={showcaseAssets} />
      </div>

      {secondarySignals.length ? (
        <section className="dash-card mt-5" aria-label="Also for you">
          <p className="dash-card-label">Also for you</p>
          <ul className="mt-3 space-y-2">
            {secondarySignals.map((s) => (
              <li key={s.href + s.label}>
                <Link href={s.href} className="text-sm font-semibold text-accent hover:underline">
                  {s.label}
                </Link>
              </li>
            ))}
            {inbox.unread > 0 ? (
              <li>
                <Link
                  href={inboxUnreadHref}
                  className="text-sm font-semibold text-accent hover:underline"
                >
                  Wealth Inbox · {inbox.unread} unread
                </Link>
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

      {(dash.netWorth.confidence < 0.75 || dash.netWorth.staleAssetIds.length > 0) && (
        <p className="mt-4 text-sm">
          <Link href="/app/wealth/confidence" className="font-semibold text-accent">
            Review data quality
            {dash.netWorth.staleAssetIds.length
              ? ` · ${dash.netWorth.staleAssetIds.length} stale valuation(s)`
              : ""}
          </Link>
        </p>
      )}

      <footer className="dash-footer">
        <span>Session active · {lastLogin}</span>
        <Link href="/app/support">Help & support</Link>
      </footer>
    </main>
  );
}
