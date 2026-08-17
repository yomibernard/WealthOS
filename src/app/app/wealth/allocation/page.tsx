import { redirect } from "next/navigation";
import { InsightPanel, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { buildHomeDashboard } from "@/services/wealth";
import { buildDonutPaths, buildWealthMapSegments } from "@/engines/wealth-visuals";
import { formatNaira } from "@/lib/format";

const COLORS = ["#0f6e56", "#245b7a", "#9a6b16", "#5b4a7a", "#3d6b5a", "#8b2e2e"];

export default async function AllocationPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const dash = await buildHomeDashboard(user.id);
  if (!dash) redirect("/auth/sign-in");

  const segments = buildWealthMapSegments(
    dash.netWorth.assetBreakdown,
    dash.netWorth.totalLiabilitiesNgn,
  );
  const assets = segments.filter((s) => s.kind === "asset");
  const slices = buildDonutPaths(
    assets.map((s, i) => ({
      id: s.id,
      label: s.label,
      value: s.valueNgn,
      color: COLORS[i % COLORS.length],
    })),
    80,
    80,
    62,
    38,
  );

  const top = dash.netWorth.assetBreakdown[0];
  const highConcentration = top && top.percent >= 40;

  return (
    <main>
      <PageHeader
        title="Allocation"
        subtitle="Concentration and diversification — one visual family, not duplicate charts."
      />

      {top ? (
        <InsightPanel className="mb-4" eyebrow="Interpretation">
          {formatCategory(top.category)} represents about {Math.round(top.percent)}% of your
          estimated wealth
          {highConcentration
            ? " — that concentration is worth watching before adding similar exposure."
            : "."}{" "}
          WealthAI would explain this from the engines; it does not invent balances.
        </InsightPanel>
      ) : null}

      <Panel>
        <p className="eyebrow">Asset-class allocation</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
          <svg
            viewBox="0 0 160 160"
            className="mx-auto h-44 w-44"
            role="img"
            aria-label="Asset allocation donut"
          >
            {slices.map((s) => (
              <path key={s.id} d={s.d} fill={s.color} />
            ))}
            <text
              x="80"
              y="76"
              textAnchor="middle"
              fill="var(--muted)"
              style={{ fontSize: "10px", fontWeight: 600 }}
            >
              Assets
            </text>
            <text
              x="80"
              y="94"
              textAnchor="middle"
              fill="var(--ink)"
              style={{ fontSize: "12px", fontFamily: "var(--font-display)", fontWeight: 650 }}
            >
              {formatNaira(dash.netWorth.totalAssetsNgn, true)}
            </text>
          </svg>
          <ul className="space-y-2.5">
            {assets.map((s, i) => (
              <li key={s.id}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 font-semibold">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: COLORS[i % COLORS.length] }}
                      aria-hidden
                    />
                    {s.label}
                  </span>
                  <span className="tabular-nums">
                    {s.percentOfAssets != null ? `${Math.round(s.percentOfAssets)}%` : "—"} ·{" "}
                    {formatNaira(s.valueNgn, true)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Panel>

      <Panel className="mt-3">
        <p className="eyebrow">Currency allocation</p>
        <ul className="mt-3 space-y-3">
          {dash.netWorth.currencyExposure.map((c) => (
            <li key={c.currency}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-semibold">{c.currency}</span>
                <span>
                  {c.percent.toFixed(1)}% · {formatNaira(c.valueNgn, true)}
                </span>
              </div>
              <div className="wealth-bar-track" aria-hidden>
                <div
                  className="wealth-bar-fill"
                  style={{ width: `${Math.min(100, c.percent)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="mt-3">
        <p className="eyebrow">Liquidity & risk concentration</p>
        <p className="mt-2 text-sm leading-relaxed">
          Largest class share is {top ? `${Math.round(top.percent)}%` : "n/a"}. Liquidity detail
          lives on each holding — cash and high-liquidity lines feed Wealth Health&apos;s liquidity
          dimension, not a second pie chart here.
        </p>
        {segments
          .filter((s) => s.kind === "liability")
          .map((s) => (
            <p key={s.id} className="mt-3 text-sm font-semibold">
              Liabilities {formatNaira(s.valueNgn, true)} — shown separately so debt never looks like
              an asset class.
            </p>
          ))}
      </Panel>
    </main>
  );
}

function formatCategory(raw: string) {
  return raw
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
