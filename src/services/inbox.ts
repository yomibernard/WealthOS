import { prisma } from "@/lib/db";
import { analyseEstate } from "@/engines/estate";
import { getFeatureFlags } from "@/lib/feature-flags";
import { buildCaseInboxDraft } from "@/engines/customer-cases";

type Draft = {
  category: string;
  priority: string;
  title: string;
  body: string;
  href?: string;
  sourceType: string;
  sourceId: string;
};

async function upsertInbox(userId: string, draft: Draft) {
  const existing = await prisma.inboxItem.findUnique({
    where: {
      userId_sourceType_sourceId: {
        userId,
        sourceType: draft.sourceType,
        sourceId: draft.sourceId,
      },
    },
  });
  if (existing?.status === "dismissed" || existing?.status === "acted") return existing;

  if (existing) {
    return prisma.inboxItem.update({
      where: { id: existing.id },
      data: {
        category: draft.category,
        priority: draft.priority,
        title: draft.title,
        body: draft.body,
        href: draft.href,
        status: existing.status === "read" ? "read" : "unread",
      },
    });
  }

  return prisma.inboxItem.create({
    data: {
      userId,
      ...draft,
      status: "unread",
    },
  });
}

export async function createInboxFromDrafts(
  userId: string,
  drafts: Array<Omit<Draft, "sourceType" | "sourceId"> & { sourceType: string; sourceId: string }>,
) {
  const flags = getFeatureFlags();
  if (!flags.wealthInbox) return [];
  const out = [];
  for (const d of drafts) {
    out.push(await upsertInbox(userId, d));
  }
  return out;
}

/** Refresh synthesised inbox items from live Wealth Graph / ops state. */
export async function refreshInbox(userId: string) {
  const flags = getFeatureFlags();
  if (!flags.wealthInbox) return { created: 0, unread: 0 };

  const [recs, connections, assets, estateItems, household, escalations] = await Promise.all([
    prisma.recommendation.findMany({
      where: { userId, status: "PROPOSED" },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    prisma.connection.findMany({ where: { userId } }),
    prisma.asset.findMany({ where: { userId } }),
    prisma.estateItem.findMany({ where: { userId } }),
    prisma.householdMember.findMany({ where: { userId } }),
    prisma.escalation.findMany({
      where: { userId, status: { in: ["open", "in_progress"] } },
      take: 8,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  let created = 0;

  for (const r of recs) {
    await upsertInbox(userId, {
      category: "recommendation",
      priority: "important",
      title: r.title,
      body: r.what || r.why || "Open to review suitability, explanation, and next step.",
      href: `/app/actions/${r.id}`,
      sourceType: "recommendation",
      sourceId: r.id,
    });
    created += 1;
  }

  for (const c of connections) {
    if (c.status === "healthy") continue;
    await upsertInbox(userId, {
      category: "connection",
      priority: c.status === "error" || c.status === "disconnected" ? "important" : "advisory",
      title: `${c.providerName} needs attention`,
      body: c.lastError || `Connection status: ${c.status}`,
      href: "/app/connections",
      sourceType: "connection",
      sourceId: c.id,
    });
    created += 1;
  }

  const stale = assets.filter((a) => {
    const months =
      (Date.now() - new Date(a.lastValuationDate).getTime()) / (30 * 24 * 60 * 60 * 1000);
    return months >= 6 || a.verificationStatus === "STALE";
  });
  if (stale.length) {
    await upsertInbox(userId, {
      category: "data_quality",
      priority: "advisory",
      title: `${stale.length} stale valuation(s)`,
      body: "Refresh estimated assets so net worth and recommendations stay trustworthy.",
      href: "/app/wealth/confidence",
      sourceType: "data_quality",
      sourceId: "stale-assets",
    });
    created += 1;
  }

  for (const e of escalations) {
    const draft = buildCaseInboxDraft({
      id: e.id,
      reason: e.reason,
      status: e.status,
    });
    await upsertInbox(userId, draft);
    created += 1;
  }

  if (flags.estateLite) {
    const estate = analyseEstate(estateItems, {
      dependantCount: household.filter((h) => h.dependant).length,
      hasLifeCover: assets.some((a) => a.category === "INSURANCE"),
      hasProperty: assets.some((a) => a.category === "PROPERTY"),
      hasBusiness: assets.some((a) => a.category === "BUSINESS"),
      hasPension: assets.some((a) => a.category === "PENSION"),
    });
    if (estate.grade === "thin" || estate.missingKinds.includes("will")) {
      await upsertInbox(userId, {
        category: "estate",
        priority: "important",
        title: "Estate readiness needs attention",
        body: estate.narrative,
        href: "/app/estate",
        sourceType: "estate",
        sourceId: "readiness",
      });
      created += 1;
    }
  }

  const unread = await prisma.inboxItem.count({
    where: { userId, status: "unread" },
  });

  return { created, unread };
}

export async function listInbox(userId: string, includeDismissed = false) {
  return prisma.inboxItem.findMany({
    where: {
      userId,
      ...(includeDismissed ? {} : { status: { not: "dismissed" } }),
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function updateInboxItem(
  userId: string,
  id: string,
  status: "read" | "dismissed" | "acted" | "unread",
) {
  const item = await prisma.inboxItem.findFirst({ where: { id, userId } });
  if (!item) throw new Error("Inbox item not found.");
  return prisma.inboxItem.update({
    where: { id },
    data: { status },
  });
}
