import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { ensureRecommendations } from "@/services/wealth";
import { formatNaira } from "@/lib/format";

export default async function ActionsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const actions = await ensureRecommendations(user.id);

  return (
    <main>
      <PageHeader
        title="Next best actions"
        subtitle="Maximum three priorities on Home. Full list here — including the option to do nothing."
      />
      <div className="space-y-3">
        {actions.map((a) => (
          <Link key={a.id} href={`/app/actions/${a.id}`}>
            <Panel>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{a.actionType.replaceAll("_", " ")}</Badge>
                <Badge tone={a.confidence < 0.6 ? "warn" : "default"}>
                  Confidence {Math.round(a.confidence * 100)}%
                </Badge>
              </div>
              <p className="font-display mt-2 text-xl">{a.title}</p>
              <p className="muted mt-2 text-sm">{a.what}</p>
              {a.amount != null ? (
                <p className="mt-2 text-sm font-semibold">
                  Amount {formatNaira(a.amount, true)}
                </p>
              ) : null}
            </Panel>
          </Link>
        ))}
      </div>
    </main>
  );
}
