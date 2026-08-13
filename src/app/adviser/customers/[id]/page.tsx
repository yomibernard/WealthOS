import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { buildHomeDashboard } from "@/services/wealth";
import { getAdviserInsightsPack } from "@/services/adviser-insights";
import { formatNaira } from "@/lib/format";
import { AdviserCopilot } from "@/components/AdviserCopilot";
import { AdviserNotesPanel } from "@/components/AdviserNotesPanel";
import { CustomerTimeline } from "@/components/CustomerTimeline";
import { getFeatureFlags } from "@/lib/feature-flags";
import Link from "next/link";

export default async function AdviserCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  if (user.role !== "ADVISER" && user.role !== "ADMIN") redirect("/app");

  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      goals: true,
      recommendations: { where: { status: "PROPOSED" }, take: 5 },
      conversations: { include: { messages: { take: 6, orderBy: { createdAt: "desc" } } }, take: 3 },
      documents: true,
      consents: true,
      escalations: { where: { status: "open" } },
    },
  });
  if (!customer) redirect("/adviser");

  if (user.role === "ADVISER") {
    const link = await prisma.adviserCustomer.findFirst({
      where: { adviserId: user.id, customerId: customer.id },
    });
    if (!link) redirect("/adviser");
  }

  const dash = await buildHomeDashboard(customer.id);
  const insights = await getAdviserInsightsPack(customer.id);
  const flags = getFeatureFlags();

  return (
    <main className="page-wide">
      <PageHeader
        title={customer.name}
        subtitle="Customer 360 for review conversations"
        action={
          <Link href="/adviser" className="btn btn-soft">
            All customers
          </Link>
        }
      />
      <div className="grid gap-3 lg:grid-cols-3">
        <Panel>
          <p className="eyebrow">Net worth</p>
          <p className="font-display text-3xl">
            {formatNaira(dash?.netWorth.netWorthNgn ?? 0, true)}
          </p>
          <Badge>Confidence {Math.round((dash?.netWorth.confidence ?? 0) * 100)}%</Badge>
        </Panel>
        <Panel>
          <p className="eyebrow">Wealth Health</p>
          <p className="font-display text-3xl">{dash?.health.overall ?? "—"}</p>
        </Panel>
        <Panel>
          <p className="eyebrow">Open escalations</p>
          <p className="font-display text-3xl">{customer.escalations.length}</p>
        </Panel>
      </div>

      {insights ? (
        <Panel className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="eyebrow">Insights pack</p>
            <Badge>{insights.talkingPoints.length} talking points</Badge>
          </div>
          <p className="text-sm leading-relaxed">{insights.briefing}</p>
          <ul className="space-y-3">
            {insights.talkingPoints.map((tp) => (
              <li key={tp.id} className="rounded-xl border border-line p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{tp.title}</p>
                  <Badge
                    tone={
                      tp.priority === "critical"
                        ? "danger"
                        : tp.priority === "important"
                          ? "warn"
                          : "default"
                    }
                  >
                    {tp.priority}
                  </Badge>
                </div>
                <p className="muted mt-1 text-sm">{tp.detail}</p>
                <p className="mt-2 text-sm">
                  <span className="font-medium">Ask: </span>
                  {tp.suggestedQuestion}
                </p>
              </li>
            ))}
          </ul>
          <div className="border-t border-line pt-3">
            <p className="eyebrow">Guardrails</p>
            <ul className="muted mt-2 list-disc space-y-1 pl-5 text-sm">
              {insights.doNotSay.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </Panel>
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <Panel>
          <p className="eyebrow">Goals</p>
          <ul className="mt-2 space-y-1 text-sm">
            {customer.goals.map((g) => (
              <li key={g.id}>
                {g.name} · target {formatNaira(g.targetAmount, true)}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <p className="eyebrow">Outstanding actions</p>
          <ul className="mt-2 space-y-1 text-sm">
            {customer.recommendations.map((r) => (
              <li key={r.id}>{r.title}</li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <p className="eyebrow">Consent state</p>
          <ul className="mt-2 space-y-1 text-sm">
            {customer.consents.map((c) => (
              <li key={c.id}>
                {c.serviceName}: {c.status}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <p className="eyebrow">Recent AI conversations</p>
          <ul className="mt-2 space-y-2 text-sm">
            {customer.conversations.map((c) => (
              <li key={c.id}>
                <strong>{c.title}</strong>
                <div className="muted">
                  {c.messages[0]?.content?.slice(0, 120) ?? "No messages"}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <AdviserCopilot
        customerName={customer.name}
        netWorth={dash?.netWorth.netWorthNgn ?? 0}
        health={dash?.health.overall ?? 0}
        attention={dash?.attention ?? []}
        goals={customer.goals.map((g) => g.name)}
      />

      {flags.adviserCollab ? (
        <>
          <AdviserNotesPanel customerId={customer.id} />
          <CustomerTimeline customerId={customer.id} />
        </>
      ) : null}
    </main>
  );
}
