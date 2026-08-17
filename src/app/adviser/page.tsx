import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, EmptyState, InsightPanel, PageHeader } from "@/components/ui";
import { UserAvatar } from "@/components/profile/ProfileAvatar";
import { getSessionUser } from "@/lib/session";
import { formatNaira } from "@/lib/format";
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

function formatContact(iso: string | null | undefined): string {
  if (!iso) return "No recent contact";
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "No recent contact";
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
  if (days <= 0) return "Contacted today";
  if (days === 1) return "Contacted yesterday";
  if (days < 7) return `Contacted ${days}d ago`;
  return `Contacted ${then.toLocaleDateString("en-GB")}`;
}

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

  const briefTiles = [
    {
      href: "/adviser?care=care",
      label: "Needing care",
      value: full.withCareCount,
      tone: full.withCareCount > 0 ? ("warn" as const) : ("default" as const),
    },
    {
      href: "/adviser?care=ops_reminded",
      label: "Ops reminders",
      value: full.opsRemindedCount,
      tone: full.opsRemindedCount > 0 ? ("warn" as const) : ("default" as const),
    },
    {
      href: "/adviser?care=unacked",
      label: "Outstanding responses",
      value: full.unackedCareCount,
      tone: full.unackedCareCount > 0 ? ("warn" as const) : ("default" as const),
    },
    {
      href: "/adviser?care=privacy",
      label: "Privacy",
      value: full.totalPrivacy,
      tone: full.totalPrivacy > 0 ? ("warn" as const) : ("default" as const),
    },
    {
      href: "/adviser?care=complaints",
      label: "Complaints",
      value: full.totalComplaints,
      tone: full.totalComplaints > 0 ? ("danger" as const) : ("default" as const),
    },
    {
      href: "/adviser?care=awaiting",
      label: "Awaiting receipt",
      value: full.awaitingReceiptCount,
      tone: "default" as const,
    },
  ];

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
        subtitle="Care first — then your book. Severity-ordered, not badge-stacked."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/adviser/notifications" className="btn btn-ghost">
              Notifications
              {notifyPulse.unreadCount > 0 ? ` · ${notifyPulse.unreadCount}` : ""}
            </Link>
            <Link href="/adviser/ai" className="btn btn-soft">
              Ask WealthAI
            </Link>
          </div>
        }
      />

      <InsightPanel eyebrow="How to use this desk">
        Work complaints and ops-reminded customers before product conversations. Care acknowledgments
        never close admin queues — mark seen only tells you the customer read your update.
      </InsightPanel>

      <section className="hero-metric mt-4 space-y-4">
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

      <section className="mt-4">
        <p className="eyebrow">Book pulse</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {briefTiles.map((tile) => (
            <Link
              key={tile.label}
              href={tile.href}
              className="rounded-xl border border-line bg-white px-3 py-3 transition hover:border-accent"
            >
              <p className="muted text-xs">{tile.label}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="font-display text-2xl">{tile.value}</p>
                <Badge tone={tile.tone}>{tile.value > 0 ? "Open" : "Clear"}</Badge>
              </div>
            </Link>
          ))}
        </div>
        <p className="muted mt-2 text-xs">
          Upcoming reviews — use clear-book customers in the radar below for routine check-ins.
        </p>
      </section>

      <section className="action-card mt-4">
        <p className="eyebrow">Priority queue</p>
        <p className="muted mt-1 text-sm">
          Highest-severity items only — not every badge at once.
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

      <section className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">Customer book</h2>
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
                <div className="flex gap-3">
                  <UserAvatar name={c.name} src={c.avatarSrc} className="h-12 w-12 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-display text-xl leading-tight">{c.name}</p>
                        <p className="muted truncate text-sm">{c.email}</p>
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
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <div>
                    <p className="muted text-xs">Health</p>
                    <p className="font-semibold">
                      {c.healthScore != null ? Math.round(c.healthScore) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="muted text-xs">Net worth</p>
                    <p className="font-semibold">
                      {c.netWorthNgn != null ? formatNaira(c.netWorthNgn, true) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="muted text-xs">Risk</p>
                    <p className="font-semibold">{c.riskTolerance ?? "unset"}</p>
                  </div>
                  <div>
                    <p className="muted text-xs">Profile</p>
                    <p className="font-semibold">{c.profileCompleteness}%</p>
                  </div>
                </div>

                <p className="mt-3 text-sm">
                  <span className="font-semibold">Next:</span> {c.nextAction}
                </p>
                <p className="muted mt-1 text-xs">
                  {formatContact(c.lastContactAt)}
                  {c.careCount > 0 || c.awaitingReceipt ? ` · ${c.ackCue}` : ""}
                  {c.primaryGoal ? ` · Goal: ${c.primaryGoal}` : ""}
                </p>
              </article>
            </Link>
          ))}
        </div>

        {radar.customers.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title={full.customerCount === 0 ? "No customers in your book yet" : "No matches"}
              body={
                full.customerCount === 0
                  ? "Linked customers will appear here with care status and next actions."
                  : "No customers match this care filter. Clear the filter to see the full book."
              }
            />
          </div>
        ) : null}
      </section>
    </main>
  );
}
