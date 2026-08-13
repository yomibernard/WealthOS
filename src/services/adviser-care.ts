import { prisma } from "@/lib/db";
import { buildAdviserCareDesk } from "@/engines/adviser-care";

export async function loadAdviserCareDesk(customerId: string) {
  const [escalations, privacyRequests] = await Promise.all([
    prisma.escalation.findMany({
      where: { userId: customerId, status: { in: ["open", "in_progress"] } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.privacyRequest.findMany({
      where: { userId: customerId, status: { in: ["open", "in_progress"] } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  return buildAdviserCareDesk({ escalations, privacyRequests });
}
