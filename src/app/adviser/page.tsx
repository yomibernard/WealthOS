import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { SignOutButton } from "@/components/SignOutButton";

export default async function AdviserHomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  if (user.role !== "ADVISER" && user.role !== "ADMIN") redirect("/app");

  const links = await prisma.adviserCustomer.findMany({
    where: { adviserId: user.role === "ADVISER" ? user.id : undefined },
    include: { customer: true },
  });

  const customers =
    user.role === "ADMIN"
      ? await prisma.user.findMany({ where: { role: "CUSTOMER" } })
      : links.map((l) => l.customer);

  return (
    <main className="page-wide">
      <PageHeader title="Adviser portal" subtitle={`Welcome, ${user.name}`} />
      <div className="grid gap-3 md:grid-cols-2">
        {customers.map((c) => (
          <Link key={c.id} href={`/adviser/customers/${c.id}`}>
            <Panel>
              <p className="font-display text-xl">{c.name}</p>
              <p className="muted text-sm">{c.email}</p>
              <p className="mt-2 text-sm">Profile {c.profileCompleteness}% complete</p>
            </Panel>
          </Link>
        ))}
      </div>
      <div className="mt-6 max-w-xs">
        <SignOutButton />
      </div>
    </main>
  );
}
