import Link from "next/link";
import { Panel } from "@/components/ui";

export default function ConsentIntroPage() {
  return (
    <main className="page py-8">
      <p className="eyebrow">Consent before personalisation</p>
      <h1 className="font-display mt-2 text-3xl">How WealthOS uses your information</h1>
      <Panel className="mt-6 space-y-3">
        <p>
          We use the financial details you share to estimate net worth, diagnose financial health,
          model goals and generate explainable recommendations.
        </p>
        <p className="muted">
          Nothing material is executed without clear approval. You can pause or revoke permissions
          anytime in the Consent Centre.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>Connected services only when you approve them</li>
          <li>Manual entries remain under your control</li>
          <li>AI explanations use governed engines for calculations</li>
        </ul>
      </Panel>
      <div className="mt-6 space-y-3">
        <Link href="/onboarding/fact-find" className="btn btn-accent w-full">
          I understand — continue
        </Link>
        <Link href="/app/consent" className="btn btn-ghost w-full">
          Review Consent Centre
        </Link>
      </div>
    </main>
  );
}
