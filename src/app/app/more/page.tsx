import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader, Panel } from "@/components/ui";
import { SignOutButton } from "@/components/SignOutButton";
import { getSessionUser } from "@/lib/session";

const links = [
  { href: "/app/inbox", label: "Wealth Inbox" },
  { href: "/app/reports", label: "Monthly wealth reports" },
  { href: "/app/digest", label: "Weekly wealth digest" },
  { href: "/app/plan/funding", label: "Goal funding pulse" },
  { href: "/app/health", label: "Wealth Health" },
  { href: "/app/actions", label: "Recommendations" },
  { href: "/app/wealthguard", label: "WealthGuard" },
  { href: "/app/products", label: "Product intelligence" },
  { href: "/app/executions", label: "Partner executions" },
  { href: "/app/cashflow", label: "Cash-flow intelligence" },
  { href: "/app/property", label: "Property intelligence" },
  { href: "/app/business", label: "Business intelligence" },
  { href: "/app/insurance", label: "Insurance inventory" },
  { href: "/app/pension", label: "Pension aggregation" },
  { href: "/app/life-events", label: "Life events" },
  { href: "/app/estate", label: "Estate & will lite" },
  { href: "/app/household", label: "Household" },
  { href: "/app/consent", label: "Consent Centre" },
  { href: "/app/privacy", label: "Privacy Centre" },
  { href: "/app/memory", label: "AI Memory" },
  { href: "/app/wealth/net-worth", label: "Net worth detail" },
  { href: "/app/wealth/confidence", label: "Data confidence" },
  { href: "/app/documents", label: "Documents" },
  { href: "/app/notifications", label: "Notifications" },
  { href: "/app/connections", label: "Connections (open banking)" },
  { href: "/app/tax", label: "Tax lite" },
  { href: "/app/crypto", label: "Crypto lite" },
  { href: "/app/lending", label: "Lending awareness" },
  { href: "/app/adviser-collab", label: "Adviser collaboration" },
  { href: "/app/adviser-request", label: "Request an adviser" },
  { href: "/app/support", label: "Support & complaints" },
  { href: "/app/settings", label: "Security & settings" },
  { href: "/app/profile", label: "Profile completeness" },
];

export default async function MorePage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");

  return (
    <main>
      <PageHeader title="More" subtitle={`Signed in as ${user.name}`} />
      <Panel className="divide-y divide-line p-0">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex min-h-14 items-center px-4 font-medium hover:bg-accent-soft/40"
          >
            {l.label}
          </Link>
        ))}
      </Panel>
      <div className="mt-4">
        <SignOutButton />
      </div>
    </main>
  );
}
