import { redirect } from "next/navigation";
import { PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { buildHomeDashboard } from "@/services/wealth";
import { formatNaira } from "@/lib/format";

export default async function AllocationPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const dash = await buildHomeDashboard(user.id);
  if (!dash) redirect("/auth/sign-in");

  return (
    <main>
      <PageHeader
        title="Asset allocation"
        subtitle="Class and currency exposure across your Wealth Graph."
      />
      <Panel>
        <p className="eyebrow">By asset class</p>
        <ul className="mt-3 space-y-3">
          {dash.netWorth.assetBreakdown.map((b) => (
            <li key={b.category}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{b.category}</span>
                <span>
                  {b.percent.toFixed(1)}% · {formatNaira(b.valueNgn, true)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-line">
                <div
                  className="h-2 rounded-full bg-accent"
                  style={{ width: `${Math.min(100, b.percent)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel className="mt-3">
        <p className="eyebrow">By currency</p>
        <ul className="mt-3 space-y-2">
          {dash.netWorth.currencyExposure.map((c) => (
            <li key={c.currency} className="flex justify-between text-sm">
              <span>{c.currency}</span>
              <span>
                {c.percent.toFixed(1)}% · {formatNaira(c.valueNgn, true)}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </main>
  );
}
