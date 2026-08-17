import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { SecurityBiometricsPanel } from "@/components/security/SecurityBiometricsPanel";
import { getSessionUser } from "@/lib/session";

export default async function SecurityPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");

  return (
    <main>
      <PageHeader
        title="Security & biometrics"
        subtitle="Passkeys, Face ID, Touch ID and Windows Hello — device-held only."
      />
      <SecurityBiometricsPanel />
      <section className="supporting-panel mt-4 space-y-2 text-sm">
        <p className="font-semibold">Also protect</p>
        <ul className="muted list-disc space-y-1 pl-5">
          <li>Password sign-in remains available alongside passkeys.</li>
          <li>Sensitive partner executions still use the existing step-up demo control.</li>
          <li>
            Session cookie is HTTP-only · SameSite=Lax · 14-day max age. Use Sign out on More when
            finished on a shared device.
          </li>
        </ul>
        <Link href="/app/trust" className="inline-flex text-sm font-semibold text-accent">
          Open Trust Centre
        </Link>
      </section>
    </main>
  );
}
