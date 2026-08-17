"use client";

import { useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { Badge, EmptyState } from "@/components/ui";
import { formatNaira, formatPercent } from "@/lib/format";

export type PropertyCard = {
  id: string;
  name: string;
  assetType: string;
  ownedValueNgn: number;
  ownershipPercent: number;
  grossYield: number | null;
  monthsSinceValuation: number;
  stale: boolean;
  confidence: number;
  verificationStatus: string;
  coverSrc: string | null;
  regionHint: string | null;
};

export function PropertyPortfolio({ holdings }: { holdings: PropertyCard[] }) {
  const [view, setView] = useState<"visual" | "list">("visual");

  if (!holdings.length) {
    return (
      <EmptyState
        title="No property yet"
        body="Add what you own so WealthOS can estimate equity, yield and concentration — not a formal appraisal."
        action={
          <Link href="/app/wealth/add" className="btn btn-accent">
            Add a property
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <div className="wealth-view-toggle" role="tablist" aria-label="Property view">
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
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {holdings.map((h) => (
            <article key={h.id} className="asset-tile overflow-hidden p-0">
              <div className="dash-asset-media bg-[color-mix(in_srgb,var(--accent-soft)_50%,white)]">
                {h.coverSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={h.coverSrc} alt="" className="h-40 w-full object-cover" />
                ) : (
                  <div className="dash-asset-fallback flex h-40 items-end p-4">
                    <p className="font-display text-2xl text-accent/80">{h.assetType}</p>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>{h.ownershipPercent}% ownership</Badge>
                  <Badge tone={h.stale ? "warn" : "default"}>
                    {h.stale ? "Needs refresh" : h.verificationStatus}
                  </Badge>
                </div>
                <p className="mt-2 font-semibold">{h.name}</p>
                <p className="muted text-sm">
                  {h.regionHint ?? "Location kept general"} · confidence{" "}
                  {formatPercent(h.confidence * 100, 0)}
                </p>
                <p className="font-display mt-2 text-2xl">{formatNaira(h.ownedValueNgn, true)}</p>
                <p className="muted mt-1 text-sm">
                  Gross yield{" "}
                  {h.grossYield == null ? "—" : formatPercent(h.grossYield * 100, 1)} · last
                  valuation ~{h.monthsSinceValuation} mo
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {holdings.map((h) => (
            <article key={h.id} className="asset-tile">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{h.name}</p>
                  <p className="muted text-sm">
                    {h.assetType}
                    {h.regionHint ? ` · ${h.regionHint}` : ""} · {h.ownershipPercent}% ownership
                  </p>
                </div>
                <p className="font-display text-xl">{formatNaira(h.ownedValueNgn, true)}</p>
              </div>
              <p className="muted mt-2 text-sm">
                Yield {h.grossYield == null ? "—" : formatPercent(h.grossYield * 100, 1)} ·
                confidence {formatPercent(h.confidence * 100, 0)} · valuation ~{" "}
                {h.monthsSinceValuation} mo
                {h.stale ? " · stale" : ""}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
