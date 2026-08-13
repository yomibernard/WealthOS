import { redirect } from "next/navigation";
import { PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");

  return (
    <main>
      <PageHeader title="Security & settings" subtitle="MVP controls for a calm, trustworthy session." />
      <Panel className="space-y-3 text-sm">
        <p>
          <strong>Signed in as:</strong> {user.email}
        </p>
        <p>
          <strong>Session:</strong> HTTP-only cookie · 14-day max age · SameSite=Lax
        </p>
        <p>
          <strong>MFA / step-up:</strong> Required before Phase 2 material execution (not enabled in
          MVP self-service demo).
        </p>
        <p>
          <strong>Encryption:</strong> TLS in transit in production; database encryption at rest via
          hosting controls.
        </p>
        <p className="muted">
          AI models never hold transaction credentials. Conversation, recommendation, consent and
          execution paths remain separated.
        </p>
      </Panel>
    </main>
  );
}
