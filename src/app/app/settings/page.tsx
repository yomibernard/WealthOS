import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const passkeys = await prisma.webAuthnCredential.count({ where: { userId: user.id } });

  const groups = [
    {
      title: "Profile",
      links: [
        { href: "/app/profile", label: "Personal information & photo" },
        { href: "/onboarding/fact-find", label: "Preferences & fact-find" },
      ],
    },
    {
      title: "Security",
      links: [
        {
          href: "/app/security",
          label: "Biometrics & passkeys",
          note: passkeys ? `${passkeys} registered` : "Optional",
        },
        { href: "/app/trust", label: "Trust Centre" },
      ],
    },
    {
      title: "Privacy",
      links: [
        { href: "/app/consent", label: "Consent" },
        { href: "/app/privacy", label: "Data export & deletion" },
        { href: "/app/connections", label: "Connections", note: "Demo" },
      ],
    },
    {
      title: "AI & memory",
      links: [{ href: "/app/memory", label: "What WealthAI remembers" }],
    },
    {
      title: "Communication",
      links: [
        { href: "/app/notifications", label: "Notifications" },
        { href: "/app/adviser-collab", label: "Adviser communications" },
      ],
    },
  ];

  return (
    <main>
      <PageHeader
        title="Settings"
        subtitle={`${user.email} · organise profile, security, privacy and AI.`}
      />

      <section className="insight-panel text-sm leading-relaxed">
        <p>
          Session: HTTP-only cookie · 14-day max age · SameSite=Lax. Biometric templates never leave
          your device.
        </p>
      </section>

      {groups.map((g) => (
        <section key={g.title} className="more-section mt-5">
          <h2 className="font-display text-xl font-semibold tracking-tight">{g.title}</h2>
          <div className="action-card mt-3 overflow-hidden p-0">
            {g.links.map((l) => (
              <Link key={l.href} href={l.href} className="more-link justify-between gap-3">
                <span>{l.label}</span>
                {"note" in l && l.note ? (
                  <span className="muted text-xs font-medium">{l.note}</span>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
