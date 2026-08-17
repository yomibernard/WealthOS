import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { loadAdviserPortfolioCareRadar } from "@/services/adviser-portfolio";
import { loadAdviserNotificationPulse } from "@/services/notifications";
import { loadAdviserNextStepsPulse } from "@/services/adviser-next-steps";
import {
  filterPortfolioCareRadar,
  parsePortfolioCareFilter,
  type PortfolioCareFilter,
} from "@/engines/adviser-portfolio";

const FILTER_CHIPS: { id: PortfolioCareFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "care", label: "Needs care" },
  { id: "ops_reminded", label: "Ops reminded" },
  { id: "unacked", label: "Unacked" },
  { id: "awaiting", label: "Awaiting receipt" },
  { id: "complaints", label: "Complaints" },
  { id: "privacy", label: "Privacy" },
  { id: "support", label: "Support" },
];

export default async function AdviserHomePage({
  searchParams,
}: {
  searchParams: Promise<{ care?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  if (user.role !== "ADVISER" && user.role !== "ADMIN") redirect("/app");

  const params = await searchParams;
  const filter = parsePortfolioCareFilter(params.care);
  const full = await loadAdviserPortfolioCareRadar({
    adviserId: user.id,
    role: user.role,
  });
  const radar = filterPortfolioCareRadar(full, filter);
  const [notifyPulse, nextSteps] = await Promise.all([
    loadAdviserNotificationPulse(user.id),
    loadAdviserNextStepsPulse({ adviserId: user.id, role: user.role }),
  ]);

  const priorityRows = [
    full.totalComplaints > 0
      ? {
          href: "/adviser?care=complaints",
          label: `${full.totalComplaints} complaint case(s)`,
          tone: "danger" as const,
          why: "Highest severity — review before product talk",
        }
      : null,
    full.opsRemindedCount > 0
      ? {
          href: "/adviser?care=ops_reminded",
          label: `${full.opsRemindedCount} ops-reminded`,
          tone: "warn" as const,
          why: "Operations asked for an adviser response",
        }
      : null,
    full.unackedCareCount > 0
      ? {
          href: "/adviser?care=unacked",
          label: `${full.unackedCareCount} unacked care`,
          tone: "warn" as const,
          why: "Open support/privacy without a care acknowledgment",
        }
      : null,
    full.totalPrivacy > 0
      ? {
          href: "/adviser?care=privacy",
          label: `${full.totalPrivacy} privacy`,
          tone: "warn" as const,
          why: "Privacy requests need human attention",
        }
      : null,
    full.awaitingReceiptCount > 0
      ? {
          href: "/adviser?care=awaiting",
          label: `${full.awaitingReceiptCount} awaiting receipt`,
          tone: "default" as const,
          why: "Customer has not marked your care update as seen",
        }
      : null,
    notifyPulse.unreadCount > 0
      ? {
          href: notifyPulse.primaryHref,
          label:
            notifyPulse.unreadCount === 1
              ? notifyPulse.headline ?? "1 unread notification"
              : `${notifyPulse.unreadCount} unread notifications`,
          tone: "default" as const,
          why: "Shares, receipts, or ops handoffs in your inbox",
        }
      : null,
  ].filter(Boolean) as {
    href: string;
    label: string;
    tone: "danger" | "warn" | "default";
    why: string;
  }[];

  return (
    <main className="page-wide">
      <PageHeader
        title="Morning brief"
        subtitle="Urgent care first — then your book. Badges are prioritised, not piled on."
      />

      <section className="hero-metric space-y-4">
        <div>
          <p className="eyebrow">Needs your attention</p>
          <p className="muted mt-1 text-sm leading-relaxed">{nextSteps.summary}</p>
        </div>
        {nextSteps.items[0] ? (
          <div>
            <Link
              href={nextSteps.items[0].href}
              className="font-display text-2xl font-semibold text-accent hover:underline"
            >
              {nextSteps.items[0].title}
            </Link>
            <p className="muted mt-2 text-sm leading-relaxed">{nextSteps.items[0].detail}</p>
          </div>
        ) : null}
        {nextSteps.items.length > 1 ? (
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {nextSteps.items.slice(1, 4).map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="font-semibold text-accent hover:underline">
                  {item.title}
                </Link>
              </li>
            ))}
          </ol>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Link href={nextSteps.primaryHref} className="btn btn-primary">
            {nextSteps.items[0]?.kind === "do_nothing" ? "Open Care radar" : "Take the next step"}
          </Link>
          <Link href="/adviser/ai" className="btn btn-soft">
            Ask WealthAI for my book
          </Link>
        </div>
      </section>

      <section className="action-card mt-4">
        <p className="eyebrow">Priority queue</p>
        <p className="muted mt-1 text-sm">
          Showing the highest-severity items only — not every badge at once.
        </p>
        {priorityRows.length ? (
          <ul className="mt-3 space-y-2">
            {priorityRows.slice(0, 4).map((row) => (
              <li key={row.href + row.label}>
                <Link
                  href={row.href}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-[var(--radius-sm)] border border-line bg-white px-3 py-3 hover:border-accent"
                >
                  <div>
                    <p className="font-semibold">{row.label}</p>
                    <p className="muted text-sm">{row.why}</p>
                  </div>
                  <Badge tone={row.tone}>Open</Badge>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-accent">No urgent care signals this morning.</p>
        )}
        <p className="muted mt-3 text-xs">
          Book load: {full.withCareCount} with care · {full.customerCount} customers
        </p>
      </section>

      <section className="mt-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">Care radar</h2>
            <p className="muted text-sm">{radar.summary}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Care filters">
          {FILTER_CHIPS.map((chip) => {
            const active = filter === chip.id;
            const href = chip.id === "all" ? "/adviser" : `/adviser?care=${chip.id}`;
            return (
              <Link
                key={chip.id}
                href={href}
                className={
                  active
                    ? "rounded-full border border-accent bg-accent-soft px-3 py-1.5 text-sm font-semibold"
                    : "muted rounded-full border border-line px-3 py-1.5 text-sm hover:border-accent"
                }
                aria-current={active ? "true" : undefined}
              >
                {chip.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {radar.customers.map((c) => (
            <Link key={c.id} href={`/adviser/customers/${c.id}`}>
              <article className="action-card h-full transition hover:border-accent">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-xl">{c.name}</p>
                    <p className="muted text-sm">{c.email}</p>
                  </div>
                  <Badge
                    tone={
                      c.careTone === "danger"
                        ? "danger"
                        : c.careTone === "warn"
                          ? "warn"
                          : "default"
                    }
                  >
                    {c.opsReminded ? "Ops reminded" : c.careLabel}
                  </Badge>
                </div>
                <p className="mt-2 text-sm">Profile {c.profileCompleteness}% complete</p>
                {c.careCount > 0 || c.awaitingReceipt ? (
                  <p className="muted mt-1 text-xs">
                    {c.openEscalations} case(s) · {c.openPrivacy} privacy · {c.ackCue}
                  </p>
                ) : null}
              </article>
            </Link>
          ))}
        </div>

        {radar.customers.length === 0 ? (
          <p className="muted mt-3 text-sm">
            {full.customerCount === 0
              ? "No customers in your book yet."
              : "No customers match this care filter."}
          </p>
        ) : null}
      </section>
    </main>
  );
}
