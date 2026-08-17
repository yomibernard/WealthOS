import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export type ShowcaseAsset = {
  id: string;
  name: string;
  category: string;
  assetType: string;
  value: number;
  currency: string;
  country: string;
  coverUrl: string | null;
  href: string;
};

function locationLabel(country: string) {
  if (country === "NG" || country === "NGA") return "Nigeria";
  if (country === "GB" || country === "UK") return "United Kingdom";
  if (country === "US" || country === "USA") return "United States";
  return country;
}

export function DashboardAssetsSection({ assets }: { assets: ShowcaseAsset[] }) {
  return (
    <section className="dash-section">
      <div className="flex items-end justify-between gap-2">
        <h2 className="dash-section-title">Your assets</h2>
        <Link href="/app/wealth" className="dash-card-link">
          Wealth map
        </Link>
      </div>
      {assets.length === 0 ? (
        <article className="dash-card mt-3">
          <p className="muted text-sm">
            Add property or other holdings so your Wealth Map feels personal and tangible.
          </p>
          <Link href="/app/wealth/add" className="btn btn-soft mt-3 inline-flex">
            Add to my wealth
          </Link>
        </article>
      ) : (
        <div className="dash-assets-grid mt-3">
          {assets.map((a) => (
            <article key={a.id} className="dash-asset-card">
              <div className="dash-asset-media">
                {a.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.coverUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="dash-asset-fallback" aria-hidden>
                    <span>{a.category.replaceAll("_", " ")}</span>
                  </div>
                )}
                <span className="dash-asset-badge">{a.category.replaceAll("_", " ")}</span>
                <Link
                  href={a.href}
                  className="dash-asset-more"
                  aria-label={`Open ${a.name}`}
                >
                  <MoreHorizontal size={16} />
                </Link>
              </div>
              <div className="p-3">
                <h3 className="font-semibold leading-snug">{a.name}</h3>
                <p className="muted mt-1 text-sm">{locationLabel(a.country)}</p>
                <p className="mt-2 font-display text-lg font-semibold tracking-tight">
                  {formatCurrency(a.value, a.currency, true)}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
