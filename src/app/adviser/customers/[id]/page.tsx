import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { buildHomeDashboard } from "@/services/wealth";
import { getAdviserInsightsPack } from "@/services/adviser-insights";
import { loadAdviserCareDesk } from "@/services/adviser-care";
import { loadCareAckHistory } from "@/services/adviser-care-ack";
import { loadLastOpsCareRemind } from "@/services/ops-care-remind";
import { buildOpsRemindCareDeskBanner } from "@/engines/ops-care-remind";
import { formatNaira } from "@/lib/format";
import { AdviserCopilot } from "@/components/AdviserCopilot";
import { AdviserNotesPanel } from "@/components/AdviserNotesPanel";
import { AdviserNudgePanel } from "@/components/AdviserNudgePanel";
import { AdviserCareAck } from "@/components/AdviserCareAck";
import { CustomerTimeline } from "@/components/CustomerTimeline";
import { Customer360Workspace } from "@/components/adviser/Customer360Workspace";
import { getFeatureFlags } from "@/lib/feature-flags";
import Link from "next/link";

export default async function AdviserCustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  if (user.role !== "ADVISER" && user.role !== "ADMIN") redirect("/app");

  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      goals: true,
      recommendations: { where: { status: "PROPOSED" }, take: 5 },
      conversations: {
        include: { messages: { take: 6, orderBy: { createdAt: "desc" } } },
        take: 3,
      },
      documents: true,
      consents: true,
      escalations: { where: { status: { in: ["open", "in_progress"] } } },
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
  const [insights, care, careHistory, lastOpsRemind] = await Promise.all([
    getAdviserInsightsPack(customer.id),
    loadAdviserCareDesk(customer.id),
    loadCareAckHistory(customer.id),
    loadLastOpsCareRemind(customer.id),
  ]);
  const flags = getFeatureFlags();
  const needsFirstAck = care.openCount > 0 && careHistory.count === 0;
  const opsRemindBanner =
    lastOpsRemind && needsFirstAck
      ? buildOpsRemindCareDeskBanner({
          lastOpsRemindAt: lastOpsRemind.createdAt,
          adminName: lastOpsRemind.adminName,
          needsFirstAck: true,
        })
      : null;

  const defaultTab =
    sp.tab === "care" || care.openCount > 0 || opsRemindBanner
      ? "care"
      : sp.tab === "wealth" ||
          sp.tab === "actions" ||
          sp.tab === "ai" ||
          sp.tab === "timeline"
        ? sp.tab
        : "overview";

  const wealthTier =
    (dash?.netWorth.netWorthNgn ?? 0) >= 100_000_000
      ? "High-net-worth book"
      : (dash?.netWorth.netWorthNgn ?? 0) >= 40_000_000
        ? "Mass affluent"
        : "Emerging wealth";

  return (
    <Customer360Workspace
      defaultTab={defaultTab}
      header={
        <header className="space-y-3">
          <PageHeader
            title={customer.name}
            subtitle={`${wealthTier} · Care before product`}
            action={
              <Link href="/adviser" className="btn btn-soft">
                Morning brief
              </Link>
            }
          />
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge>Health {dash?.health.overall ?? "—"}</Badge>
            <Badge>
              NW {formatNaira(dash?.netWorth.netWorthNgn ?? 0, true)}
            </Badge>
            <Badge tone={care.openCount > 0 ? "warn" : "default"}>
              {care.openCount} open care
            </Badge>
            {customer.goals[0] ? <Badge>Goal: {customer.goals[0].name}</Badge> : null}
            <Badge>
              Risk {customer.riskTolerance ?? "unset"}
            </Badge>
          </div>
        </header>
      }
      overview={
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            <Panel>
              <p className="eyebrow">Care desk</p>
              <p className="font-display text-3xl">{care.openCount}</p>
            </Panel>
          </div>
          {insights ? (
            <Panel className="space-y-3">
              <p className="eyebrow">Meeting brief</p>
              <p className="text-sm leading-relaxed">{insights.briefing}</p>
              <ul className="space-y-2">
                {insights.talkingPoints.slice(0, 3).map((tp) => (
                  <li key={tp.id} className="rounded-xl border border-line p-3 text-sm">
                    <p className="font-semibold">{tp.title}</p>
                    <p className="muted mt-1">{tp.suggestedQuestion}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
      }
      care={
        <Panel className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="eyebrow">Care desk</p>
            <Badge tone={care.openCount > 0 ? "warn" : "default"}>{care.openCount} open</Badge>
          </div>
          <p className="text-sm">{care.summary}</p>
          {opsRemindBanner ? (
            <p className="rounded-xl border border-line bg-accent-soft/50 px-3 py-2 text-sm">
              {opsRemindBanner}
            </p>
          ) : null}
          {care.items.length ? (
            <ul className="space-y-2">
              {care.items.map((item) => (
                <li key={`${item.kind}-${item.id}`} className="rounded-xl border border-line p-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      tone={
                        item.priority === "critical"
                          ? "danger"
                          : item.priority === "important"
                            ? "warn"
                            : "default"
                      }
                    >
                      {item.kind}
                    </Badge>
                    <Badge>{item.status}</Badge>
                  </div>
                  <p className="mt-2 font-semibold">{item.title}</p>
                  <p className="muted mt-1 text-sm">{item.detail}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted text-sm">Nothing in the care queue for this customer.</p>
          )}
          {user.role === "ADMIN" ? (
            <div className="flex flex-wrap gap-2 border-t border-line pt-3 text-sm">
              <Link href="/admin/escalations" className="font-semibold text-accent">
                Admin escalations
              </Link>
              <Link href="/admin/privacy" className="font-semibold text-accent">
                Admin privacy queue
              </Link>
            </div>
          ) : null}
          {careHistory.items.length ? (
            <div className="space-y-2 border-t border-line pt-3">
              <p className="eyebrow">Recent care acknowledgments</p>
              <ul className="space-y-2">
                {careHistory.items.map((h) => (
                  <li key={h.id} className="rounded-xl border border-line px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{h.title}</p>
                      <Badge tone={h.seen ? "default" : "warn"}>
                        {h.seen ? "Seen" : "Unseen"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm">{h.preview}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="muted border-t border-line pt-3 text-sm">{careHistory.summary}</p>
          )}
          {flags.adviserCollab && care.items.length ? (
            <AdviserCareAck customerId={customer.id} items={care.items} />
          ) : null}
        </Panel>
      }
      wealth={
        <div className="space-y-3">
          {insights ? (
            <Panel className="space-y-3">
              <p className="eyebrow">Insights pack</p>
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
            <p className="eyebrow">Consent state</p>
            <ul className="mt-2 space-y-1 text-sm">
              {customer.consents.map((c) => (
                <li key={c.id}>
                  {c.serviceName}: {c.status}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      }
      actions={
        <div className="space-y-3">
          <Panel>
            <p className="eyebrow">Outstanding actions</p>
            <ul className="mt-2 space-y-1 text-sm">
              {customer.recommendations.map((r) => (
                <li key={r.id}>{r.title}</li>
              ))}
            </ul>
          </Panel>
          {flags.adviserCollab ? <AdviserNudgePanel customerId={customer.id} /> : null}
          {flags.adviserCollab ? <AdviserNotesPanel customerId={customer.id} /> : null}
        </div>
      }
      ai={
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
          <p className="muted mt-3 text-xs">
            Documents on file: {customer.documents.length}
          </p>
        </Panel>
      }
      timeline={
        flags.adviserCollab ? (
          <CustomerTimeline customerId={customer.id} />
        ) : (
          <Panel>
            <p className="muted text-sm">Timeline requires adviser collaboration flag.</p>
          </Panel>
        )
      }
      copilot={
        <AdviserCopilot
          customerName={customer.name}
          netWorth={dash?.netWorth.netWorthNgn ?? 0}
          health={dash?.health.overall ?? 0}
          attention={dash?.attention ?? []}
          goals={customer.goals.map((g) => g.name)}
        />
      }
    />
  );
}
