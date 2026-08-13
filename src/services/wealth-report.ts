import { prisma } from "@/lib/db";
import { buildHomeDashboard } from "@/services/wealth";
import { formatNaira } from "@/lib/format";
import { createInboxFromDrafts } from "@/services/inbox";
import { buildReportInsights, type ReportInsights } from "@/engines/report-insights";
import { createUserNotification } from "@/services/notifications";
import { canDeliver } from "@/lib/notification-prefs";

export type MonthlyReportSection = {
  id: string;
  title: string;
  body: string;
};

export type MonthlyReportView = {
  generatedAt: string;
  netWorthNgn: number;
  confidence: number;
  healthScore: number;
  attention: string[];
  topActions: { id: string; title: string; why: string }[];
  sections: MonthlyReportSection[];
  disclaimer: string;
  notificationId?: string;
  snapshotId?: string;
};

export type SnapshotHistoryItem = {
  id: string;
  createdAt: string;
  netWorthNgn: number;
  confidence: number;
  healthScore: number | null;
  deltaNgn: number | null;
  attention: string[];
};

function buildSections(dash: NonNullable<Awaited<ReturnType<typeof buildHomeDashboard>>>): MonthlyReportSection[] {
  const sections: MonthlyReportSection[] = [
    {
      id: "position",
      title: "Where you stand",
      body: `Estimated net worth ${formatNaira(dash.netWorth.netWorthNgn, true)} with ${Math.round(dash.netWorth.confidence * 100)}% data confidence. Wealth Health sits at ${dash.health.overall}/100.`,
    },
    {
      id: "attention",
      title: "What needs attention",
      body: dash.attention.length
        ? dash.attention.slice(0, 5).join(" ")
        : "No urgent priorities this cycle — a valid outcome when buffers and goals are on track.",
    },
  ];

  if (dash.actions?.length) {
    sections.push({
      id: "next",
      title: "Suggested next best steps",
      body: dash.actions
        .slice(0, 3)
        .map((a, i) => `${i + 1}. ${a.title}: ${a.why}`)
        .join(" "),
    });
  }

  sections.push({
    id: "do_nothing",
    title: "Doing nothing is allowed",
    body: "If your emergency buffer, debt service, and goals are stable, WealthOS may recommend waiting. Suitability and consent still govern any material move.",
  });

  return sections;
}

export async function generateMonthlyWealthReport(userId: string) {
  const dash = await buildHomeDashboard(userId);
  if (!dash) throw new Error("Customer wealth context unavailable");

  const prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
  if (!canDeliver(prefs, "informational")) {
    return { skipped: true as const, reason: "Informational notifications disabled" };
  }

  const sections = buildSections(dash);
  const topActions = (dash.actions ?? []).slice(0, 3).map((a) => ({
    id: a.actionType,
    title: a.title,
    why: a.why,
  }));
  const disclaimer =
    "This is an informational wealth summary — not a solicitation to buy products, and not regulated investment advice.";

  const body = [
    sections.map((s) => `${s.title}: ${s.body}`).join(" "),
    disclaimer,
  ].join(" ");

  const report: MonthlyReportView = {
    generatedAt: new Date().toISOString(),
    netWorthNgn: dash.netWorth.netWorthNgn,
    confidence: dash.netWorth.confidence,
    healthScore: dash.health.overall,
    attention: dash.attention.slice(0, 5),
    topActions,
    sections,
    disclaimer,
  };

  const notify = await createUserNotification({
    userId,
    category: "informational",
    title: "Monthly wealth report",
    body,
  });

  const snapshot = await prisma.wealthSnapshot.create({
    data: {
      userId,
      netWorthNgn: dash.netWorth.netWorthNgn,
      confidence: dash.netWorth.confidence,
      healthScore: dash.health.overall,
      payloadJson: JSON.stringify({
        type: "monthly_report",
        attention: dash.attention,
        topActions,
        sections,
        disclaimer,
        notificationId: notify.created ? notify.notification.id : null,
      }),
    },
  });

  await prisma.auditEvent.create({
    data: {
      userId,
      eventType: "MONTHLY_WEALTH_REPORT",
      entityType: "WealthSnapshot",
      entityId: snapshot.id,
      payloadJson: JSON.stringify({
        netWorthNgn: dash.netWorth.netWorthNgn,
        health: dash.health.overall,
        notificationId: notify.created ? notify.notification.id : null,
      }),
    },
  });

  await createInboxFromDrafts(userId, [
    {
      category: "informational",
      priority: "low",
      title: "Monthly wealth report ready",
      body: `Estimated net worth ${formatNaira(dash.netWorth.netWorthNgn, true)}. Open the report for attention items and next steps.`,
      href: `/app/reports/${snapshot.id}`,
      sourceType: "monthly_report",
      sourceId: snapshot.id,
    },
  ]);

  return {
    skipped: false as const,
    notificationId: notify.created ? notify.notification.id : null,
    snapshotId: snapshot.id,
    body,
    report: {
      ...report,
      notificationId: notify.created ? notify.notification.id : undefined,
      snapshotId: snapshot.id,
    },
  };
}

export function historyFromSnapshots(
  rows: {
    id: string;
    createdAt: Date;
    netWorthNgn: number;
    confidence: number;
    healthScore: number | null;
    payloadJson: string;
  }[],
): SnapshotHistoryItem[] {
  return rows.map((row, idx) => {
    const older = rows[idx + 1];
    let attention: string[] = [];
    try {
      const payload = JSON.parse(row.payloadJson || "{}") as { attention?: string[] };
      attention = payload.attention ?? [];
    } catch {
      attention = [];
    }
    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      netWorthNgn: row.netWorthNgn,
      confidence: row.confidence,
      healthScore: row.healthScore,
      deltaNgn: older ? row.netWorthNgn - older.netWorthNgn : null,
      attention,
    };
  });
}

export async function listMonthlyReportHistory(
  userId: string,
  limit = 12,
): Promise<{
  latest: MonthlyReportView | null;
  history: SnapshotHistoryItem[];
  insights: ReportInsights;
}> {
  const rows = await prisma.wealthSnapshot.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 36),
  });

  const history = historyFromSnapshots(rows);
  const insights = buildReportInsights(
    rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      netWorthNgn: r.netWorthNgn,
      healthScore: r.healthScore,
      confidence: r.confidence,
    })),
  );

  let latest: MonthlyReportView | null = null;
  const first = rows[0];
  if (first) {
    try {
      const payload = JSON.parse(first.payloadJson || "{}") as {
        type?: string;
        attention?: string[];
        topActions?: MonthlyReportView["topActions"];
        sections?: MonthlyReportSection[];
        disclaimer?: string;
        notificationId?: string;
      };
      latest = {
        generatedAt: first.createdAt.toISOString(),
        netWorthNgn: first.netWorthNgn,
        confidence: first.confidence,
        healthScore: first.healthScore ?? 0,
        attention: payload.attention ?? [],
        topActions: payload.topActions ?? [],
        sections:
          payload.sections ??
          ([
            {
              id: "position",
              title: "Where you stand",
              body: `Estimated net worth ${formatNaira(first.netWorthNgn, true)}.`,
            },
          ] satisfies MonthlyReportSection[]),
        disclaimer:
          payload.disclaimer ??
          "This is an informational wealth summary — not a solicitation to buy products.",
        notificationId: payload.notificationId,
        snapshotId: first.id,
      };
    } catch {
      latest = null;
    }
  }

  return { latest, history, insights };
}

export async function getMonthlyReportSnapshot(
  userId: string,
  snapshotId: string,
): Promise<MonthlyReportView | null> {
  const row = await prisma.wealthSnapshot.findFirst({
    where: { id: snapshotId, userId },
  });
  if (!row) return null;
  try {
    const payload = JSON.parse(row.payloadJson || "{}") as {
      attention?: string[];
      topActions?: MonthlyReportView["topActions"];
      sections?: MonthlyReportSection[];
      disclaimer?: string;
      notificationId?: string;
    };
    return {
      generatedAt: row.createdAt.toISOString(),
      netWorthNgn: row.netWorthNgn,
      confidence: row.confidence,
      healthScore: row.healthScore ?? 0,
      attention: payload.attention ?? [],
      topActions: payload.topActions ?? [],
      sections: payload.sections ?? [],
      disclaimer:
        payload.disclaimer ??
        "This is an informational wealth summary — not a solicitation to buy products.",
      notificationId: payload.notificationId,
      snapshotId: row.id,
    };
  } catch {
    return null;
  }
}
