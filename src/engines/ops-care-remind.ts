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
