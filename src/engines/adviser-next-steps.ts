/**
 * Adviser book next-steps — ranked deep links for Care radar + notifications.
 */

export type AdviserNextStepKind =
  | "complaints"
  | "privacy"
  | "unacked"
  | "ops_reminded"
  | "awaiting"
  | "support"
  | "notifications"
  | "do_nothing";

export type AdviserNextStepPriority = "critical" | "important" | "advisory";

export type AdviserNextStep = {
  id: string;
  kind: AdviserNextStepKind;
  priority: AdviserNextStepPriority;
  title: string;
  detail: string;
  href: string;
};

export type AdviserNextStepsPulse = {
  items: AdviserNextStep[];
  count: number;
  headline: string | null;
  primaryHref: string;
  summary: string;
};

export type AdviserNextStepsCustomer = {
  id: string;
  name: string;
  openComplaints: number;
  openPrivacy: number;
  openSupport: number;
  needsFirstAck: boolean;
  awaitingReceipt: boolean;
  opsReminded: boolean;
  sortScore: number;
};

export type AdviserNextStepsInput = {
  totalComplaints?: number;
  totalPrivacy?: number;
  totalSupport?: number;
  unackedCareCount?: number;
  awaitingReceiptCount?: number;
  opsRemindedCount?: number;
  customers?: AdviserNextStepsCustomer[];
  notifyUnreadCount?: number;
  notifyHeadline?: string | null;
  notifyHref?: string | null;
};

const MAX_STEPS = 3;

function pickTop(
  customers: AdviserNextStepsCustomer[],
  pred: (c: AdviserNextStepsCustomer) => boolean,
): AdviserNextStepsCustomer | null {
  const matches = customers.filter(pred).sort((a, b) => b.sortScore - a.sortScore);
  return matches[0] ?? null;
}

export function buildAdviserNextStepsPulse(
  input: AdviserNextStepsInput,
): AdviserNextStepsPulse {
  const customers = input.customers ?? [];
  const candidates: AdviserNextStep[] = [];

  const complaints = input.totalComplaints ?? 0;
  if (complaints > 0) {
    const top = pickTop(customers, (c) => c.openComplaints > 0);
    candidates.push({
      id: "complaints",
      kind: "complaints",
      priority: "critical",
      title: top
        ? `Open Care desk for ${top.name} (${top.openComplaints} complaint${top.openComplaints === 1 ? "" : "s"})`
        : `${complaints} complaint${complaints === 1 ? "" : "s"} in your book`,
      detail: "Resolve care needs before product discussion — ops still owns formal queues.",
      href: top ? `/adviser/customers/${top.id}` : "/adviser?care=complaints",
    });
  }

  const privacy = input.totalPrivacy ?? 0;
  if (privacy > 0) {
    const top = pickTop(customers, (c) => c.openPrivacy > 0);
    candidates.push({
      id: "privacy",
      kind: "privacy",
      priority: "important",
      title: top
        ? `Review privacy load for ${top.name}`
        : `${privacy} open privacy request${privacy === 1 ? "" : "s"} in your book`,
      detail: "Acknowledge the customer; admin privacy queue remains authoritative.",
      href: top ? `/adviser/customers/${top.id}` : "/adviser?care=privacy",
    });
  }

  const unacked = input.unackedCareCount ?? 0;
  const opsRemindedCount = input.opsRemindedCount ?? 0;
  if (unacked > 0) {
    const top =
      opsRemindedCount > 0
        ? pickTop(customers, (c) => c.opsReminded)
        : pickTop(customers, (c) => c.needsFirstAck);
    const reminded = opsRemindedCount > 0;
    candidates.push({
      id: reminded ? "ops_reminded" : "unacked",
      kind: reminded ? "ops_reminded" : "unacked",
      priority: "important",
      title: top
        ? reminded
          ? `Ops reminded you about ${top.name} — send a care ack`
          : `Send a care acknowledgment to ${top.name}`
        : reminded
          ? `${opsRemindedCount} ops-reminded customer${opsRemindedCount === 1 ? "" : "s"} still need a care ack`
          : `${unacked} customer${unacked === 1 ? "" : "s"} still need a care ack`,
      detail: reminded
        ? "Ops nudged you — open Care desk before product talk. Queues stay open until formally resolved."
        : "Reassure in Inbox — does not close the ops queue.",
      href: top
        ? `/adviser/customers/${top.id}`
        : reminded
          ? "/adviser?care=ops_reminded"
          : "/adviser?care=unacked",
    });
  }

  const awaiting = input.awaitingReceiptCount ?? 0;
  if (awaiting > 0) {
    candidates.push({
      id: "awaiting",
      kind: "awaiting",
      priority: "advisory",
      title: `${awaiting} care update${awaiting === 1 ? "" : "s"} awaiting customer receipt`,
      detail: "Filter Awaiting receipt, or check notifications when they mark as seen.",
      href: "/adviser?care=awaiting",
    });
  }

  const support = input.totalSupport ?? 0;
  if (support > 0 && complaints === 0) {
    const top = pickTop(customers, (c) => c.openSupport > 0);
    candidates.push({
      id: "support",
      kind: "support",
      priority: "advisory",
      title: top
        ? `Follow up support for ${top.name}`
        : `${support} open support case${support === 1 ? "" : "s"} in your book`,
      detail: "Open the Care desk; keep product talk after care is covered.",
      href: top ? `/adviser/customers/${top.id}` : "/adviser?care=support",
    });
  }

  const unread = input.notifyUnreadCount ?? 0;
  if (unread > 0) {
    candidates.push({
      id: "notifications",
      kind: "notifications",
      priority: "important",
      title:
        unread === 1 && input.notifyHeadline
          ? input.notifyHeadline
          : `${unread} unread adviser notification${unread === 1 ? "" : "s"}`,
      detail: "Triage care receipts and shares in the adviser notification centre.",
      href: input.notifyHref || "/adviser/notifications?read=unread",
    });
  }

  const items = candidates.slice(0, MAX_STEPS);

  if (!items.length) {
    const clear: AdviserNextStep = {
      id: "do_nothing",
      kind: "do_nothing",
      priority: "advisory",
      title: "Book looks quiet — no urgent care next step",
      detail: "Scan Care radar or notifications when something new lands.",
      href: "/adviser",
    };
    return {
      items: [clear],
      count: 1,
      headline: clear.title,
      primaryHref: clear.href,
      summary: "Nothing critical in the book; care-first still applies when load returns.",
    };
  }

  return {
    items,
    count: items.length,
    headline: items[0]!.title,
    primaryHref: items[0]!.href,
    summary: `${items.length} next step${items.length === 1 ? "" : "s"} for your book.`,
  };
}

export function formatAdviserNextStepsAiContent(
  pulse: AdviserNextStepsPulse | null | undefined,
): string {
  if (!pulse?.items.length) {
    return "I do not see a ranked book next-steps pulse yet. Open Care radar on /adviser — doing nothing can still be valid when the book is quiet.";
  }
  const lines = pulse.items.map(
    (s, i) => `${i + 1}. ${s.title} — ${s.detail} Path: ${s.href}`,
  );
  const reminded = pulse.items.filter((s) => s.kind === "ops_reminded");
  const remindedNote =
    reminded.length > 0
      ? `Ops reminded ${reminded.length} unacked customer(s) — open /adviser?care=ops_reminded, acknowledge care, and leave admin queues open.`
      : null;
  return [
    "Here is what to do next for your book from the live Care radar pulse (complaints and privacy first):",
    ...lines,
    ...(remindedNote ? [remindedNote] : []),
    "Ops queues stay authoritative for complaints and privacy; care acks and receipts never close admin queues.",
  ].join("\n");
}

export function wantsAdviserBookNextSteps(message: string): boolean {
  const m = message.toLowerCase();
  return /what should i do|next (step|best)|priority|care radar|my book|book next|needs (my|your) attention|ops remind|ops nudged|ops_reminded/.test(
    m,
  );
}
