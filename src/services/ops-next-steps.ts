import { buildOpsNextStepsPulse } from "@/engines/ops-next-steps";
import { loadOpsDailyBoard } from "@/services/ops-daily";

export async function loadOpsNextStepsPulse() {
  const board = await loadOpsDailyBoard();
  const flagRisk = board.queues.find((q) => q.id === "flag_risk")?.count ?? 0;
  return buildOpsNextStepsPulse({
    openComplaints: board.counts.openComplaints,
    openEscalations: board.counts.openEscalations,
    openPrivacy: board.counts.openPrivacy,
    pendingChangeRequests: board.counts.pendingChangeRequests,
    launchBlocked: !board.launch.ok,
    launchBlockers: board.launch.blockers,
    riskyFlagsOn: flagRisk,
    unackedCareCustomers: board.counts.unackedCareCustomers,
    awaitingReceiptCount: board.counts.awaitingReceiptCount,
  });
}
