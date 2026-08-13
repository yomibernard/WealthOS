import { prisma } from "@/lib/db";
import { evaluateLaunchGate } from "@/lib/launch-gate";
import { getFeatureFlags } from "@/lib/feature-flags";
import { buildOpsDailyBoard } from "@/engines/ops-daily";
import { classifyEscalationReason } from "@/engines/escalation-ops";
import { riskyFlagsOn } from "@/engines/flag-profiles";
import { getFeatureFlags } from "@/lib/feature-flags";

export async function loadOpsDailyBoard() {
  const [
    openEscalations,
    openEscalationRows,
    openPrivacy,
    pendingChangeRequests,
    recentComplaints,
  ] = await Promise.all([
    prisma.escalation.count({
      where: { status: { in: ["open", "in_progress"] } },
    }),
    prisma.escalation.findMany({
      where: { status: { in: ["open", "in_progress"] } },
      select: { reason: true },
      take: 200,
    }),
    prisma.privacyRequest.count({
      where: { status: { in: ["open", "in_progress"] } },
    }),
    prisma.changeRequest.count({ where: { status: "pending" } }),
    prisma.escalation.findMany({
      where: {
        status: { in: ["open", "in_progress"] },
        reason: { startsWith: "COMPLAINT:" },
      },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const openComplaints = openEscalationRows.filter(
    (e) => classifyEscalationReason(e.reason) === "complaint",
  ).length;

  const launch = evaluateLaunchGate();
  const blockers = launch.checks
    .filter((c) => c.severity === "blocker" && !c.ok)
    .map((c) => c.id);
  const flags = getFeatureFlags();
  const risky = riskyFlagsOn(flags);

  const board = buildOpsDailyBoard({
    openEscalations,
    openComplaints,
    openPrivacy,
    pendingChangeRequests,
    launchBlocked: !launch.ok,
    launchBlockers: blockers,
    riskyFlagsOn: risky.length,
  });

  const flagEntries = Object.entries(flags).map(([key, on]) => ({ key, on }));

  return {
    generatedAt: new Date().toISOString(),
    ...board,
    launch: {
      ok: launch.ok,
      profile: launch.profile,
      blockers,
    },
    topComplaints: recentComplaints.map((c) => ({
      id: c.id,
      reason: c.reason,
      status: c.status,
      customerName: c.user.name,
      customerEmail: c.user.email,
      createdAt: c.createdAt.toISOString(),
    })),
    counts: {
      openEscalations,
      openComplaints,
      openPrivacy,
      pendingChangeRequests,
    },
    flags: flagEntries,
  };
}
