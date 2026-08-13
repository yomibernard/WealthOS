import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { SignOutButton } from "@/components/SignOutButton";
import { loadAdviserPortfolioCareRadar } from "@/services/adviser-portfolio";

export default async function AdviserHomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  if (user.role !== "ADVISER" && user.role !== "ADMIN") redirect("/app");

  const radar = await loadAdviserPortfolioCareRadar({
    adviserId: user.id,
    role: user.role,
  });

  return (
    <main className="page-wide">
      <PageHeader
        title="Adviser portal"
        subtitle={`Welcome, ${user.name}. Care first — then insights and nudges.`}
      />

      <Panel className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">Care radar</p>
          <Badge tone={radar.withCareCount > 0 ? "warn" : "default"}>
            {radar.withCareCount} with care
          </Badge>
          {radar.totalComplaints > 0 ? (
            <Badge tone="danger">{radar.totalComplaints} complaint(s)</Badge>
          ) : null}
          {radar.totalPrivacy > 0 ? (
            <Badge tone="warn">{radar.totalPrivacy} privacy</Badge>
          ) : null}
        </div>
        <p className="muted mt-1 text-sm">{radar.summary}</p>
      </Panel>

      <div className="grid gap-3 md:grid-cols-2">
        {radar.customers.map((c) => (
          <Link key={c.id} href={`/adviser/customers/${c.id}`}>
            <Panel className="h-full transition hover:border-accent">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display text-xl">{c.name}</p>
                  <p className="muted text-sm">{c.email}</p>
                </div>
                <Badge
                  tone={
                    c.careTone === "danger"
                      ? "danger"
                      : c.careTone === "warn"
                        ? "warn"
                        : "default"
                  }
                >
                  {c.careLabel}
                </Badge>
              </div>
              <p className="mt-2 text-sm">Profile {c.profileCompleteness}% complete</p>
              {c.careCount > 0 ? (
                <p className="muted mt-1 text-xs">
                  {c.openEscalations} case(s) · {c.openPrivacy} privacy · open Care desk on 360
                </p>
              ) : null}
            </Panel>
          </Link>
        ))}
      </div>

      {radar.customers.length === 0 ? (
        <Panel className="mt-3">
          <p className="muted text-sm">No customers in your book yet.</p>
        </Panel>
      ) : null}

      <div className="mt-6 max-w-xs">
        <SignOutButton />
      </div>
    </main>
  );
}
