import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { SignOutButton } from "@/components/SignOutButton";
import { loadAdviserPortfolioCareRadar } from "@/services/adviser-portfolio";
import { loadAdviserNotificationPulse } from "@/services/notifications";
import {
  filterPortfolioCareRadar,
  parsePortfolioCareFilter,
  type PortfolioCareFilter,
} from "@/engines/adviser-portfolio";

const FILTER_CHIPS: { id: PortfolioCareFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "care", label: "Needs care" },
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
  const notifyPulse = await loadAdviserNotificationPulse(user.id);

  return (
    <main className="page-wide">
      <PageHeader
        title="Adviser portal"
        subtitle={`Welcome, ${user.name}. Care first — then insights and nudges.`}
      />

      {notifyPulse.headline ? (
        <Link
          href={notifyPulse.primaryHref}
          className="btn btn-soft mb-4 w-full sm:w-auto"
        >
          {notifyPulse.unreadCount === 1
            ? notifyPulse.headline
            : `${notifyPulse.unreadCount} unread notifications`}
        </Link>
      ) : (
        <Link href="/adviser/notifications" className="btn btn-ghost mb-4 w-full sm:w-auto">
          Adviser notifications
        </Link>
      )}

      <Panel className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">Care radar</p>
          <Badge tone={full.withCareCount > 0 ? "warn" : "default"}>
            {full.withCareCount} with care
          </Badge>
          {full.totalComplaints > 0 ? (
            <Badge tone="danger">{full.totalComplaints} complaint(s)</Badge>
          ) : null}
          {full.totalPrivacy > 0 ? (
            <Badge tone="warn">{full.totalPrivacy} privacy</Badge>
          ) : null}
          {full.totalSupport > 0 ? (
            <Badge>{full.totalSupport} support</Badge>
          ) : null}
          {full.unackedCareCount > 0 ? (
            <Badge tone="warn">{full.unackedCareCount} unacked</Badge>
          ) : null}
          {full.awaitingReceiptCount > 0 ? (
            <Badge tone="warn">{full.awaitingReceiptCount} awaiting receipt</Badge>
          ) : null}
        </div>
        <p className="muted mt-1 text-sm">{radar.summary}</p>
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
                    ? "rounded-md border border-accent bg-accent-soft px-3 py-1 text-sm font-medium"
                    : "muted rounded-md border border-line px-3 py-1 text-sm hover:border-accent"
                }
                aria-current={active ? "true" : undefined}
              >
                {chip.label}
              </Link>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-3 md:grid-cols-2">
        {radar.customers.map((c) => (
          <Link key={c.id} href={`/adviser/customers/${c.id}`}>
            <Panel className="h-full transition hover:border-accent">
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
                  {c.careLabel}
                </Badge>
              </div>
              <p className="mt-2 text-sm">Profile {c.profileCompleteness}% complete</p>
              {c.careCount > 0 ? (
                <p className="muted mt-1 text-xs">
                  {c.openEscalations} case(s) · {c.openPrivacy} privacy · {c.ackCue}
                </p>
              ) : null}
            </Panel>
          </Link>
        ))}
      </div>

      {radar.customers.length === 0 ? (
        <Panel className="mt-3">
          <p className="muted text-sm">
            {full.customerCount === 0
              ? "No customers in your book yet."
              : "No customers match this care filter."}
          </p>
        </Panel>
      ) : null}

      <div className="mt-6 max-w-xs">
        <SignOutButton />
      </div>
    </main>
  );
}
