import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function TrustCentrePage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");

  const [passkeyCount, consents] = await Promise.all([
    prisma.webAuthnCredential.count({ where: { userId: user.id } }),
    prisma.consent.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
  ]);

  const sections = [
    {
      title: "Security",
      body: "Passkeys and biometrics confirm it is you. Templates never leave your device.",
      href: "/app/security",
      meta: passkeyCount ? `${passkeyCount} passkey(s) registered` : "Passkeys optional",
    },
    {
      title: "Consent",
      body: "Pause or revoke personalised WealthAI and connection consents anytime.",
      href: "/app/consent",
      meta: `${consents.filter((c) => c.status === "ACTIVE").length} active`,
    },
    {
      title: "Privacy",
      body: "Export or request erasure. Care receipts and support paths stay auditable.",
      href: "/app/privacy",
      meta: "NDPR-aware controls",
    },
    {
      title: "Connections",
      body: "Demo open-banking sync is consent-gated — not a live bank login.",
      href: "/app/connections",
      meta: "Demo rail",
    },
    {
      title: "AI & memory",
      body: "See what WealthAI may remember. Engines calculate; AI explains.",
      href: "/app/memory",
      meta: "Editable memories",
    },
    {
      title: "Documents",
      body: "Private document references and media for your account only.",
      href: "/app/documents",
      meta: "Encrypted-at-rest demo store",
    },
    {
      title: "Execution boundaries",
      body: "Partner execution never moves real funds in this build (fundsMoved: false).",
      href: "/app/executions",
      meta: "Simulated rail",
    },
    {
      title: "Support",
      body: "Complaints and support cases close only via formal ops resolution.",
      href: "/app/support",
      meta: "Human care loop",
    },
  ];

  return (
    <main>
      <PageHeader
        title="Trust Centre"
        subtitle="What WealthOS can do, what it cannot, and how you stay in control."
      />

      <section className="hero-metric space-y-3">
        <p className="eyebrow">Clear boundaries</p>
        <ul className="space-y-2 text-sm leading-relaxed text-ink-soft">
          <li>
            <strong>WealthAI can</strong> explain engine outputs, surface next steps, and escalate
            to a human.
          </li>
          <li>
            <strong>WealthAI cannot</strong> invent balances, returns, fees, licence status, or
            bypass consent.
          </li>
          <li>
            <strong>WealthGuard</strong> never auto-labels scam, safe, or guaranteed.
          </li>
          <li>
            <strong>Demo / simulated</strong> open banking and partner execution are labelled in
            product — not live regulated rails.
          </li>
        </ul>
      </section>

      <div className="mt-4 space-y-3">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="block">
            <article className="action-card transition hover:border-accent">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{s.title}</h2>
                  <p className="muted mt-1 text-sm leading-relaxed">{s.body}</p>
                </div>
                <span className="muted shrink-0 text-xs font-semibold">{s.meta}</span>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </main>
  );
}
