import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { getFeatureFlags } from "@/lib/feature-flags";

export default async function AdminFlagsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/auth/sign-in");
  const flags = getFeatureFlags();

  return (
    <main className="page-wide">
      <PageHeader
        title="Feature flags"
        subtitle="Environment-driven rollouts. Change via FF_* env vars and redeploy — not hard-coded per screen."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {Object.entries(flags).map(([key, on]) => (
          <Panel key={key}>
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{key}</p>
              <Badge tone={on ? "default" : "warn"}>{on ? "on" : "off"}</Badge>
            </div>
          </Panel>
        ))}
      </div>
    </main>
  );
}
