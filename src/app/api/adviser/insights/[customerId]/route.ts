import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getAdviserInsightsPack } from "@/services/adviser-insights";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ customerId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (user.role !== "ADVISER" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Adviser access required." }, { status: 403 });
  }

  const { customerId } = await params;
  const customer = await prisma.user.findUnique({ where: { id: customerId } });
  if (!customer || customer.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  }

  if (user.role === "ADVISER") {
    const link = await prisma.adviserCustomer.findFirst({
      where: { adviserId: user.id, customerId },
    });
    if (!link) {
      return NextResponse.json({ error: "Customer not assigned to you." }, { status: 403 });
    }
  }

  const pack = await getAdviserInsightsPack(customerId);
  if (!pack) return NextResponse.json({ error: "Insights unavailable." }, { status: 404 });
  return NextResponse.json(pack);
}
