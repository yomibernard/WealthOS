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
      "Home → Inbox → Fix data quality if shown",
      "Property intelligence + Plan → Goal funding pulse",
      "Actions (explain before accept; do-nothing is valid)",
      "WealthGuard on a ‘guaranteed’ WhatsApp-style offer",
    ],
  },
  {
    title: "Act 3 — Cadence tools",
    mins: "4 min",
    steps: [
      "Monthly reports — generate (+ second run for MoM)",
      "Weekly digest — generate; show watch sections",
      "Profile checklist — Continue next gap",
      "Notifications — channel prefs gate Informational digests/reports",
    ],
  },
  {
    title: "Act 4 — Boundaries",
    mins: "3 min",
    steps: [
      "Crypto lite — inventory only; trading deferred",
      "Lending awareness — debt pressure; no loan offers",
      "Tax lite + Estate lite disclaimers",
    ],
  },
  {
    title: "Act 5 — Trust & adviser loop",
    mins: "5 min",
    steps: [
      "Consent Centre — pause AI, show gate, restore",
      "Adviser care radar (unacked cues) → 360 care desk + history/ack + insights",
      "Customer Home care-update pulse → Support/Privacy mark as seen",
      "Adviser notified + ops recent receipts · ?care=awaiting",
      "WealthAI: ask where to see adviser care update",
      "Adviser sends nudge → customer Inbox deep link",
      "Admin ops — care handoff + escalation/privacy care-ack cues",
      "Support case → resolve → Home / Inbox / Notifications link",
      "Optional: Privacy request → admin queue → deep-link back",
    ],
  },
];

const quickLinks = [
  { href: "/app/reports", label: "Monthly reports" },
  { href: "/app/digest", label: "Weekly digest" },
  { href: "/app/profile", label: "Profile" },
  { href: "/app/plan/funding", label: "Funding pulse" },
  { href: "/app/wealth/confidence", label: "Data confidence" },
  { href: "/app/adviser-collab", label: "Adviser collab" },
  { href: "/adviser", label: "Adviser portal" },
  { href: "/app/ai", label: "WealthAI" },
  { href: "/app/support", label: "Support" },
  { href: "/app/privacy", label: "Privacy" },
  { href: "/app/notifications", label: "Notifications" },
  { href: "/app/inbox", label: "Inbox" },
  { href: "/admin/ops", label: "Admin ops board" },
  { href: "/admin/escalations", label: "Escalations" },
  { href: "/admin/privacy", label: "Privacy queue" },
  { href: "/admin/flags", label: "Flag profiles" },
  { href: "/admin/audit", label: "Audit export" },
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
          checklist (~20–25 min).
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

      <section className="mt-6" aria-labelledby="jump">
        <h2 id="jump" className="font-display text-xl">
          Jump links (after sign-in)
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {quickLinks.map((l) => (
            <Link key={l.href} href={l.href} className="btn btn-ghost">
              {l.label}
            </Link>
          ))}
        </div>
      </section>

      <Panel className="mt-5">
        <p className="eyebrow">Closing lines</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>Engines are deterministic; AI explains and does not invent balances</li>
          <li>Partner execution is demo-only — funds do not move</li>
          <li>Cadence + adviser collaboration never auto-buy products</li>
          <li>Launch freeze, CI, and Vercel Postgres build path exist for pilots</li>
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
