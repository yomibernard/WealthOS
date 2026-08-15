/**
 * Ops care remind — admin nudges linked adviser for unacked care.
 * Never closes escalation / privacy / support queues.
 */

export type OpsCareRemindDraft = {
  title: string;
  body: string;
  href: string;
};

export function buildOpsCareRemindDraft(input: {
  customerId: string;
  customerName: string;
  adminName: string;
}): OpsCareRemindDraft {
  const href = `/adviser/customers/${input.customerId}`;
  return {
    title: `Ops reminder: ${input.customerName} still needs a care acknowledgment`,
    body: [
      `${input.adminName} asked you to acknowledge open care for ${input.customerName}.`,
      "Open Care desk before product talk. Ops queues stay open until formally resolved.",
      `Path: ${href}`,
    ].join(" "),
    href,
  };
}

export function isOpsCareRemindTitle(title: string): boolean {
  return /Ops reminder:.*still needs a care acknowledgment/i.test(title);
}

/** Offer per-row Remind only on open/in_progress rows without a care ack. */
export function shouldOfferOpsCareRemind(input: {
  status: string;
  hasCareAck?: boolean;
}): boolean {
  const open = input.status === "open" || input.status === "in_progress";
  return open && input.hasCareAck === false;
}

/** Relative cue for adviser Care radar / Care desk after an ops remind. */
export function formatOpsRemindCue(
  lastOpsRemindAt: string | null | undefined,
  now = new Date(),
): string | null {
  if (!lastOpsRemindAt) return null;
  const then = new Date(lastOpsRemindAt);
  if (Number.isNaN(then.getTime())) return null;
  const days = Math.floor((now.getTime() - then.getTime()) / 86_400_000);
  if (days <= 0) return "Ops reminded today";
  if (days === 1) return "Ops reminded yesterday";
  if (days < 7) return `Ops reminded ${days}d ago`;
  return `Ops reminded ${then.toLocaleDateString("en-GB")}`;
}

export function buildOpsRemindCareDeskBanner(input: {
  lastOpsRemindAt: string;
  adminName?: string | null;
  needsFirstAck: boolean;
  now?: Date;
}): string | null {
  if (!input.needsFirstAck) return null;
  const cue = formatOpsRemindCue(input.lastOpsRemindAt, input.now ?? new Date());
  if (!cue) return null;
  const who = input.adminName?.trim() ? ` (${input.adminName.trim()})` : "";
  return `${cue}${who} — still needs a care acknowledgment. Ops queues stay open until formally resolved.`;
}
