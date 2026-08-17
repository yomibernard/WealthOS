import { redirect } from "next/navigation";
import Link from "next/link";
import { InsightPanel, PageHeader, Panel } from "@/components/ui";
import { SecurityBiometricsPanel } from "@/components/security/SecurityBiometricsPanel";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function SecurityPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");

  const passkeyCount = await prisma.webAuthnCredential.count({ where: { userId: user.id } });

  return (
    <main>
      <PageHeader
        title="Security & biometrics"
        subtitle="Passkeys, Face ID, Touch ID and Windows Hello — biometric data stays on your device."
      />

      <section className="hero-metric">
        <p className="eyebrow">Device-held security</p>
        <h2 className="font-display mt-1 text-3xl font-semibold tracking-tight">
          {passkeyCount > 0 ? "Biometrics enabled" : "Add a passkey when ready"}
        </h2>
        <p className="muted mt-2 max-w-2xl text-sm leading-relaxed">
          WealthOS never stores fingerprints or face templates. We only receive confirmation that
          authentication succeeded. Passkeys are optional — never forced.
        </p>
      </section>

      <InsightPanel className="mt-4" eyebrow="What stays on device">
        Face ID, Touch ID, and Windows Hello biometrics remain local. Password sign-in stays available
        alongside passkeys.
      </InsightPanel>

      <div className="mt-4">
        <SecurityBiometricsPanel />
      </div>

      <Panel className="mt-4 space-y-3 text-sm">
        <p className="font-semibold">Also protect</p>
        <ul className="muted list-disc space-y-1 pl-5">
          <li>Sensitive partner executions still use the existing step-up demo control.</li>
          <li>
            Session cookie is HTTP-only · SameSite=Lax · 14-day max age. Use Sign out on More when
            finished on a shared device.
          </li>
          <li>
            Review{" "}
            <Link href="/app/consent" className="font-semibold text-accent">
              Consent
            </Link>{" "}
            and{" "}
            <Link href="/app/privacy" className="font-semibold text-accent">
              Privacy
            </Link>{" "}
            for data control — separate from device unlock.
          </li>
        </ul>
        <Link href="/app/trust" className="inline-flex text-sm font-semibold text-accent">
          Open Trust Centre
        </Link>
      </Panel>
    </main>
  );
}
