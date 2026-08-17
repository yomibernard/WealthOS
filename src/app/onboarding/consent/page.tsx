import Link from "next/link";
import { Panel } from "@/components/ui";

export default function ConsentIntroPage() {
  return (
    <main className="page py-8">
      <p className="eyebrow">Consent before personalisation</p>
      <h1 className="font-display mt-2 text-3xl">How WealthOS uses your information</h1>
      <p className="muted mt-2 max-w-xl text-sm leading-relaxed">
        Short and clear — full legal detail lives in the Consent Centre when you want it.
      </p>

      <div className="mt-6 grid gap-3">
        <Panel className="space-y-2">
          <p className="eyebrow">What WealthOS needs</p>
          <p>
            The financial details you choose to share — income, assets, liabilities, goals, and
            optional connected services — so engines can estimate net worth and diagnose health.
          </p>
        </Panel>
        <Panel className="space-y-2">
          <p className="eyebrow">Why</p>
          <p>
            To explain your picture with governed calculations, surface what deserves attention, and
            (with consent) let WealthAI explain those results — never invent balances or returns.
          </p>
        </Panel>
        <Panel className="space-y-2">
          <p className="eyebrow">What you control</p>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            <li>Pause or revoke permissions anytime in the Consent Centre</li>
            <li>Connected services only when you approve them</li>
            <li>Manual entries stay under your control; nothing material executes without clear approval</li>
          </ul>
        </Panel>
      </div>

      <div className="mt-6 space-y-3">
        <Link href="/onboarding/fact-find" className="btn btn-accent w-full">
          I understand, continue
        </Link>
        <Link href="/app/consent" className="btn btn-ghost w-full">
          Review details
        </Link>
      </div>
    </main>
  );
}
