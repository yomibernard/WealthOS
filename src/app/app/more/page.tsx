import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader, Panel } from "@/components/ui";
import { SignOutButton } from "@/components/SignOutButton";
import { getSessionUser } from "@/lib/session";

type MoreLink = { href: string; label: string; note?: string };

const sections: { title: string; blurb: string; links: MoreLink[] }[] = [
  {
    title: "Priorities",
    blurb: "What deserves attention next.",
    links: [
      { href: "/app/actions", label: "Recommendations" },
      { href: "/app/health", label: "Wealth Health" },
      { href: "/app/wealthguard", label: "WealthGuard" },
      { href: "/app/plan/funding", label: "Goal funding" },
    ],
  },
  {
    title: "My Wealth",
    blurb: "The pieces of your financial life.",
    links: [
      { href: "/app/wealth/net-worth", label: "Net worth detail" },
      { href: "/app/wealth/confidence", label: "Data confidence" },
      { href: "/app/property", label: "Property" },
      { href: "/app/pension", label: "Pension" },
      { href: "/app/business", label: "Business" },
      { href: "/app/insurance", label: "Insurance" },
      { href: "/app/cashflow", label: "Cash flow" },
      { href: "/app/household", label: "Household" },
      { href: "/app/estate", label: "Estate readiness" },
      { href: "/app/life-events", label: "Life events" },
      { href: "/app/tax", label: "Tax awareness", note: "Illustrative" },
      { href: "/app/crypto", label: "Crypto inventory", note: "No trading" },
      { href: "/app/lending", label: "Lending awareness", note: "No loan offers" },
    ],
  },
  {
    title: "Cadence",
    blurb: "Reviews you can return to.",
    links: [
      { href: "/app/reports", label: "Monthly wealth report" },
      { href: "/app/digest", label: "Weekly wealth digest" },
      { href: "/app/products", label: "Product intelligence" },
      { href: "/app/executions", label: "Partner executions", note: "Demo rail" },
    ],
  },
    {
      title: "Trust & Security",
      blurb: "Control what WealthOS can see and do.",
      links: [
        { href: "/app/trust", label: "Trust Centre" },
        { href: "/app/security", label: "Security & biometrics" },
        { href: "/app/consent", label: "Consent Centre" },
        { href: "/app/privacy", label: "Privacy Centre" },
        { href: "/app/connections", label: "Connections", note: "Demo open banking" },
        { href: "/app/documents", label: "Documents" },
        { href: "/app/memory", label: "AI Memory" },
        { href: "/app/settings", label: "Settings" },
      ],
    },
  {
    title: "Communication",
    blurb: "Messages, people, and support.",
    links: [
      { href: "/app/inbox", label: "Wealth Inbox" },
      { href: "/app/notifications", label: "Notifications" },
      { href: "/app/adviser-collab", label: "Adviser collaboration" },
      { href: "/app/adviser-request", label: "Request an adviser" },
      { href: "/app/support", label: "Support & complaints" },
    ],
  },
  {
    title: "Settings",
    blurb: "You and your preferences.",
    links: [{ href: "/app/profile", label: "Profile" }],
  },
];

export default async function MorePage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");

  return (
    <main>
      <PageHeader
        title="More"
        subtitle={`${user.name} · everything else, organised · search with ⌘K`}
      />

      {sections.map((section) => (
        <section key={section.title} className="more-section">
          <h2 className="font-display text-xl font-semibold tracking-tight">{section.title}</h2>
          <p className="muted mt-1 text-sm leading-relaxed">{section.blurb}</p>
          <Panel className="mt-3 overflow-hidden p-0">
            {section.links.map((l) => (
              <Link key={l.href} href={l.href} className="more-link justify-between gap-3">
                <span>{l.label}</span>
                {l.note ? <span className="muted text-xs font-medium">{l.note}</span> : null}
              </Link>
            ))}
          </Panel>
        </section>
      ))}

      <div className="mt-6">
        <SignOutButton />
      </div>
    </main>
  );
}
