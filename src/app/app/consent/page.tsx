import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { ConsentControls } from "@/components/ConsentControls";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function ConsentPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const consents = await prisma.consent.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main>
      <PageHeader
        title="Consent Centre"
        subtitle="Pause, reconnect or revoke. Changes affect future personalised analysis immediately."
      />
      <div className="space-y-3">
        {consents.map((c) => (
          <Panel key={c.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{c.serviceName}</p>
                <p className="muted mt-1 text-sm">Data: {c.dataUsed}</p>
                <p className="muted text-sm">Purpose: {c.purpose}</p>
                {c.lastAccessAt ? (
                  <p className="muted text-sm">
                    Last access {c.lastAccessAt.toLocaleString("en-GB")}
                  </p>
                ) : null}
              </div>
              <Badge tone={c.status === "ACTIVE" ? "default" : "warn"}>{c.status}</Badge>
            </div>
            <ConsentControls consentId={c.id} status={c.status} />
          </Panel>
        ))}
      </div>
    </main>
  );
}
