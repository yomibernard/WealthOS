/**
 * Adviser care acknowledgment — human reassurance, does not close ops cases.
 */

export type CareAckKind = "complaint" | "support" | "escalation" | "privacy";

export type CareAckDraft = {
  title: string;
  noteBody: string;
  notificationBody: string;
  href: string;
  inboxTitle: string;
};

export function buildCareAckDraft(input: {
  kind: CareAckKind;
  customerName: string;
  adviserName: string;
  message: string;
  itemTitle?: string;
}): CareAckDraft {
  const msg = input.message.trim();
  const topic =
    input.kind === "complaint"
      ? "complaint"
      : input.kind === "privacy"
        ? "privacy request"
        : input.kind === "support"
          ? "support case"
          : "escalation";

  const href = input.kind === "privacy" ? "/app/privacy" : "/app/support";

  return {
    title: `Adviser acknowledged your ${topic}`,
    noteBody: [
      `${input.adviserName} acknowledged an open ${topic} for ${input.customerName}.`,
      input.itemTitle ? `Item: ${input.itemTitle}` : null,
      msg,
      "This does not close the ops queue — admin resolution still applies where needed.",
    ]
      .filter(Boolean)
      .join("\n\n"),
    notificationBody: `${input.adviserName}: ${msg}`,
    href,
    inboxTitle: `Care update · ${topic}`,
  };
}
