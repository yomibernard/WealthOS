import Link from "next/link";
import { Badge, PageHeader, Panel } from "@/components/ui";

const acts = [
  {
    title: "Act 1 — First value",
    mins: "3 min",
    steps: [
      "Open the landing page — brand and promise first",
      "Run Wealth Check conversational fact-find",
      "Show net worth, health, and next actions — no product push",
    ],
  },
  {
    title: "Act 2 — Persona A (Yomi)",
    mins: "5 min",
    steps: [
      "Home → Inbox → Wealth confidence",
      "Property intelligence (equity / LTV / concentration)",
      "Plan goals + Actions (explain before accept; do-nothing is valid)",
      "WealthGuard on a ‘guaranteed’ WhatsApp-style offer",
    ],
  },
  {
    title: "Act 3 — Boundaries",
    mins: "3 min",
    steps: [
      "Crypto lite — inventory only; trading deferred",
      "Lending awareness — debt pressure; no loan offers",
      "Tax lite + Estate lite disclaimers",
    ],
  },
  {
    title: "Act 4 — Trust & ops",
    mins: "4 min",
    steps: [
      "Consent Centre — pause AI, show gate, restore",
      "Connections sync (consent-gated demo bank)",
      "Adviser shares a plan note → customer Adviser collaboration",
      "Admin flags / monitoring / maker-checker (checker approves)",
    ],
  },
];

const accounts = [
  { email: "yomi@demo.wealthos.ng", role: "Executive" },
  { email: "amaka@demo.wealthos.ng", role: "Entrepreneur" },
  { email: "chioma@demo.wealthos.ng", role: "Diaspora" },
  { email: "adviser@demo.wealthos.ng", role: "Adviser" },
  { email: "admin@demo.wealthos.ng", role: "Admin maker" },
  { email: "checker@demo.wealthos.ng", role: "Admin checker" },
];

export default function DemoScriptPage() {
  return (
    <main className="page py-10">
      <PageHeader
        title="Demo script"
        subtitle="Know what you have. Know where you are going. Know what to do next."
        action={
          <Link href="/auth/sign-in" className="btn btn-accent">
            Start demo sign-in
          </Link>
        }
      />

      <Panel>
        <p className="eyebrow">Password for all accounts</p>
        <p className="font-display mt-1 text-2xl">WealthOSdemo1!</p>
        <p className="muted mt-2 text-sm">
          Full prose script lives in <code>DEMO_SCRIPT.md</code>. This page is the presenter
          checklist.
        </p>
      </Panel>

      <section className="mt-5" aria-labelledby="accounts">
        <h2 id="accounts" className="font-display text-xl">
          Cast
        </h2>
        <ul className="mt-3 space-y-2">
          {accounts.map((a) => (
            <li key={a.email}>
              <Panel className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{a.email}</span>
                <Badge>{a.role}</Badge>
              </Panel>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 space-y-3" aria-labelledby="acts">
        <h2 id="acts" className="font-display text-xl">
          Runtime
        </h2>
        {acts.map((act) => (
          <Panel key={act.title}>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{act.title}</p>
              <Badge>{act.mins}</Badge>
            </div>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
              {act.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </Panel>
        ))}
      </section>

      <Panel className="mt-5">
        <p className="eyebrow">Closing lines</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>Engines are deterministic; AI explains and does not invent balances</li>
          <li>Partner execution is demo-only — funds do not move</li>
          <li>Launch freeze and Postgres cutover docs exist for production</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/wealth-check" className="btn btn-soft">
            Wealth Check
          </Link>
          <Link href="/api/health" className="btn btn-ghost">
            Health JSON
          </Link>
        </div>
      </Panel>
    </main>
  );
}
