import { prisma } from "@/lib/db";
import { buildCustomerCasesPulse } from "@/engines/customer-cases";

export async function loadCustomerCasesPulse(userId: string) {
  const rows = await prisma.escalation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
  return buildCustomerCasesPulse(rows);
}
