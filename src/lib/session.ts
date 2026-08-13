import { cookies } from "next/headers";
import { prisma } from "./db";

export const SESSION_COOKIE = "wealthos_session";

export async function getSessionUser() {
  const jar = await cookies();
  const userId = jar.get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      baseCurrency: true,
      profileCompleteness: true,
      vulnerableFlag: true,
      riskTolerance: true,
      investmentExperience: true,
      liquidityNeeds: true,
      status: true,
      deletedAt: true,
    },
  });
  if (!user || user.deletedAt || user.status === "erased") return null;
  return user;
}

export async function setSession(userId: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
