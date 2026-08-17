"use client";

import { useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { WealthMap } from "@/components/charts/WealthMap";
import { AssetCoverEditor } from "@/components/wealth/AssetCoverEditor";
import { EmptyState } from "@/components/ui";
import { formatCurrency, provenanceLabel } from "@/lib/format";
import type { WealthMapSegment } from "@/engines/wealth-visuals";

type AssetRow = {
  id: string;
  name: string;
  provider: string | null;
  assetType: string;
  ownershipPercent: number;
  value: number;
  currency: string;
  source: string;
  verificationStatus: string;
  lastValuationDate: string;
  category: string;
  coverStorageKey: string | null;
};

type LiabilityRow = {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
};

export function WealthOverviewClient({
  segments,
  totalAssetsNgn,
  assets,
  liabilities,
}: {
  segments: WealthMapSegment[];
  totalAssetsNgn: number;
  assets: AssetRow[];
  liabilities: LiabilityRow[];
}) {
  const [view, setView] = useState<"visual" | "list">("visual");

  return (
    <div className="mt-5">
      <div className="wealth-view-toggle" role="tablist" aria-label="Wealth view">
        <button
          type="button"
          role="tab"
          aria-selected={view === "visual"}
          className={clsx("wealth-view-btn", view === "visual" && "is-active")}
          onClick={() => setView("visual")}
        >
          Visual
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "list"}
          className={clsx("wealth-view-btn", view === "list" && "is-active")}
          onClick={() => setView("list")}
        >
          List
        </button>
      </div>

      {view === "visual" ? (
        <div className="mt-4">
          <WealthMap segments={segments} totalAssetsNgn={totalAssetsNgn} />
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          <section>
            <h2 className="font-display text-xl">Assets</h2>
            <div className="mt-3 space-y-3">
              {assets.length ? (
                assets.map((a) => (
                  <article key={a.id} className="asset-tile">
                    {a.coverStorageKey ? (
                      <div className="mb-3 overflow-hidden rounded-[var(--radius-sm)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/media?key=${encodeURIComponent(a.coverStorageKey)}`}
                          alt=""
                          className="h-32 w-full object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{a.name}</p>
                        <p className="muted text-sm">
                          {a.provider ?? a.assetType} · {a.ownershipPercent}% ownership
                        </p>
                      </div>
                      <p className="font-semibold">
                        {formatCurrency(a.value, a.currency, true)}
                      </p>
                    </div>
                    <p className="muted mt-2 text-sm">
                      {provenanceLabel(
                        a.source,
                        a.verificationStatus,
                        new Date(a.lastValuationDate),
                      )}
                    </p>
                    {a.category === "PROPERTY" ? (
                      <AssetCoverEditor
                        assetId={a.id}
                        initialSrc={
                          a.coverStorageKey
                            ? `/api/media?key=${encodeURIComponent(a.coverStorageKey)}`
                            : null
                        }
                      />
                    ) : null}
                  </article>
                ))
              ) : (
                <EmptyState
                  title="No assets added yet"
                  body="Add what you own so WealthOS can build your Wealth Map and estimated net worth."
                  action={
                    <Link href="/app/wealth/add" className="btn btn-accent">
                      Add to my wealth
                    </Link>
                  }
                />
              )}
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl">Liabilities</h2>
            <div className="mt-3 space-y-3">
              {liabilities.length ? (
                liabilities.map((l) => (
                  <article key={l.id} className="asset-tile">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-semibold">{l.name}</p>
                        <p className="muted text-sm">{l.type}</p>
                      </div>
                      <p className="font-semibold">
                        {formatCurrency(l.balance, l.currency, true)}
                      </p>
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState
                  title="No liabilities recorded"
                  body="If you have loans or credit, add them so net worth and debt health stay honest."
                  action={
                    <Link href="/app/lending" className="btn btn-ghost">
                      Review lending awareness
                    </Link>
                  }
                />
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
