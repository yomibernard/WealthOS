import Link from "next/link";
import { Bell, Check, Fingerprint } from "lucide-react";
import { UserAvatar } from "@/components/profile/ProfileAvatar";
import { greetingForHour } from "@/lib/format";

export function DashboardHeader({
  name,
  hour,
  avatarSrc,
  profileScore,
  biometricsEnabled,
  unreadCount,
  currency = "NGN",
}: {
  name: string;
  hour: number;
  avatarSrc: string | null;
  profileScore: number | null;
  biometricsEnabled: boolean;
  unreadCount: number;
  currency?: string;
}) {
  const greeting = greetingForHour(hour, name);

  return (
    <header className="dash-header">
      <div className="dash-header-identity">
        <Link href="/app/profile" aria-label="Open profile" className="shrink-0">
          <UserAvatar name={name} src={avatarSrc} className="h-13 w-13 h-[52px] w-[52px] text-base" />
        </Link>
        <div>
          <h1 className="dash-greeting">{greeting}</h1>
          <p className="muted mt-1 text-sm sm:text-base">
            Here&apos;s what your wealth looks like today.
          </p>
        </div>
      </div>

      <div className="dash-status-chips" aria-label="Account status">
        {profileScore != null ? (
          <Link href="/app/profile" className="dash-chip">
            {profileScore >= 100 ? <Check size={14} aria-hidden /> : null}
            <span>Profile {profileScore}%</span>
          </Link>
        ) : null}
        <Link href="/app/security" className="dash-chip">
          <Fingerprint size={14} aria-hidden />
          <span>{biometricsEnabled ? "Biometrics on" : "Enable biometrics"}</span>
        </Link>
        <Link href="/app/wealth/net-worth" className="dash-chip" title="Display currency">
          {currency}
        </Link>
        <Link
          href={unreadCount > 0 ? "/app/inbox?status=unread" : "/app/inbox"}
          className="dash-chip dash-chip-icon"
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Inbox"}
        >
          <Bell size={16} />
          {unreadCount > 0 ? <span className="dash-chip-dot" aria-hidden /> : null}
        </Link>
      </div>
    </header>
  );
}
