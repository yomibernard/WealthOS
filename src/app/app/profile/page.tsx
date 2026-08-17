import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, ProgressBar } from "@/components/ui";
import { ProfileAvatarEditor } from "@/components/profile/ProfileAvatar";
import { getSessionUser } from "@/lib/session";
import { getFeatureFlags } from "@/lib/feature-flags";
import { syncProfileCompleteness } from "@/services/profile-completeness";
import { listLinkedAdviser } from "@/services/adviser-share";
import { ShareWithAdviser } from "@/components/ShareWithAdviser";
import { prisma } from "@/lib/db";

function wealthPersona(score: number, risk: string | null) {
  if (score >= 80) return "Established wealth profile";
  if (risk === "aggressive" || risk === "growth") return "Growth-oriented wealth profile";
  if (risk === "conservative") return "Capital-preservation profile";
  return "Mass affluent wealth profile";
}

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");

  const [report, link, full, passkeys, primaryGoal, householdCount, connections] =
    await Promise.all([
      syncProfileCompleteness(user.id),
      listLinkedAdviser(user.id),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { avatarStorageKey: true, baseCurrency: true },
      }),
      prisma.webAuthnCredential.count({ where: { userId: user.id } }),
      prisma.goal.findFirst({ where: { userId: user.id }, orderBy: { priority: "asc" } }),
      prisma.householdMember.count({ where: { userId: user.id } }),
      prisma.connection.count({ where: { userId: user.id } }),
    ]);
  if (!report) redirect("/auth/sign-in");
  const flags = getFeatureFlags();
  const avatarSrc = full?.avatarStorageKey
    ? `/api/media?key=${encodeURIComponent(full.avatarStorageKey)}`
    : null;

  return (
    <main>
      <PageHeader
        title="Profile"
        subtitle="Your financial identity centre — photo optional, completeness clear."
      />

      <section className="hero-metric space-y-4">
        <ProfileAvatarEditor name={user.name} initialSrc={avatarSrc} />
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight">{user.name}</h2>
          <p className="mt-1 text-ink-soft">
            {wealthPersona(report.score, user.riskTolerance)}
          </p>
        </div>
        <ProgressBar value={report.score} label={`Profile completeness ${report.score}%`} />
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-[var(--radius-sm)] border border-line bg-white p-3 text-sm">
            <p className="muted text-xs font-semibold">Primary goal</p>
            <p className="mt-1 font-semibold">{primaryGoal?.name ?? "Not set yet"}</p>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-line bg-white p-3 text-sm">
            <p className="muted text-xs font-semibold">Risk profile</p>
            <p className="mt-1 font-semibold capitalize">
              {user.riskTolerance?.replaceAll("_", " ") ?? "Not set"}
            </p>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-line bg-white p-3 text-sm">
            <p className="muted text-xs font-semibold">Primary currency</p>
            <p className="mt-1 font-semibold">{full?.baseCurrency ?? user.baseCurrency}</p>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-line bg-white p-3 text-sm">
            <p className="muted text-xs font-semibold">Security</p>
            <p className="mt-1 font-semibold">
              {passkeys > 0 ? "Biometric / passkey enabled" : "Password only"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge>{householdCount} household</Badge>
          <Badge>{connections} connection(s)</Badge>
          <Badge tone={report.missing.length ? "warn" : "default"}>
            {report.missing.length} profile gaps
          </Badge>
        </div>
        {report.nextHref ? (
          <Link href={report.nextHref} className="btn btn-primary w-full sm:w-auto">
            Review my financial profile
          </Link>
        ) : (
          <Link href="/onboarding/fact-find" className="btn btn-soft w-full sm:w-auto">
            Review my financial profile
          </Link>
        )}
      </section>

      <section className="action-card mt-4 space-y-3">
        <p className="eyebrow">Checklist</p>
        <ul className="divide-y divide-line">
          {report.checks.map((c) => (
            <li key={c.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div>
                <p className="font-medium">
                  {c.done ? "✓ " : "○ "}
                  {c.label}
                </p>
                <p className="muted text-sm">{c.hint}</p>
              </div>
              {c.done ? (
                <Badge>Done</Badge>
              ) : (
                <Link href={c.href} className="btn btn-ghost text-sm">
                  Fix
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link href="/app/security" className="btn btn-soft flex-1">
          Security & biometrics
        </Link>
        <Link href="/app/trust" className="btn btn-ghost flex-1">
          Trust Centre
        </Link>
      </div>

      {flags.adviserCollab ? (
        <section className="supporting-panel mt-4 space-y-2">
          <p className="eyebrow">Share with adviser</p>
          <ShareWithAdviser defaultPack="profile" adviserName={link?.adviser.name ?? null} />
        </section>
      ) : null}
    </main>
  );
}
