import { prisma } from "@/lib/db";
import {
  AUDIT_CATEGORIES,
  buildAuditExportPackage,
  categoriseAuditEvent,
  filterAuditRows,
  parseAndRedactPayload,
  type AuditCategory,
  type AuditExportRow,
} from "@/engines/audit-export";

export async function listAuditEvents(input: {
  category?: AuditCategory | "all";
  eventType?: string;
  q?: string;
  take?: number;
}) {
  const take = Math.min(Math.max(input.take ?? 100, 1), 500);
  const rows = await prisma.auditEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(take * 3, 800), // oversample then filter in-memory for category
  });

  const mapped: AuditExportRow[] = rows.map((e) => ({
    id: e.id,
    eventType: e.eventType,
    category: categoriseAuditEvent(e.eventType),
    entityType: e.entityType,
    entityId: e.entityId,
    userId: e.userId,
    createdAt: e.createdAt.toISOString(),
    payload: parseAndRedactPayload(e.payloadJson),
  }));

  const filtered = filterAuditRows(mapped, {
    category: input.category ?? "all",
    eventType: input.eventType,
    q: input.q,
  }).slice(0, take);

  const distinctTypes = [...new Set(mapped.map((r) => r.eventType))].sort();

  return {
    events: filtered,
    categories: AUDIT_CATEGORIES,
    eventTypes: distinctTypes,
    returned: filtered.length,
  };
}

export async function exportAuditPackage(input: {
  category?: AuditCategory | "all";
  eventType?: string;
  q?: string;
  take?: number;
  adminId: string;
}) {
  const list = await listAuditEvents({
    category: input.category,
    eventType: input.eventType,
    q: input.q,
    take: input.take ?? 500,
  });

  const pack = buildAuditExportPackage({
    exportedAt: new Date().toISOString(),
    category: input.category ?? "all",
    eventType: input.eventType,
    rows: list.events,
  });

  await prisma.auditEvent.create({
    data: {
      userId: input.adminId,
      eventType: "AUDIT_EXPORT_DOWNLOADED",
      entityType: "AuditExport",
      payloadJson: JSON.stringify({
        count: pack.counts.total,
        category: pack.filter.category,
        eventType: pack.filter.eventType,
      }),
    },
  });

  return pack;
}
