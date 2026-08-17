"use client";

import { useState, type ReactNode } from "react";
import { clsx } from "clsx";

export type Customer360TabId =
  | "overview"
  | "care"
  | "wealth"
  | "actions"
  | "ai"
  | "timeline";

const TAB_LABELS: { id: Customer360TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "care", label: "Care" },
  { id: "wealth", label: "Wealth" },
  { id: "actions", label: "Actions" },
  { id: "ai", label: "AI history" },
  { id: "timeline", label: "Timeline" },
];

export function Customer360Workspace({
  header,
  overview,
  care,
  wealth,
  actions,
  ai,
  timeline,
  copilot,
  defaultTab = "overview",
}: {
  header: ReactNode;
  overview: ReactNode;
  care: ReactNode;
  wealth: ReactNode;
  actions: ReactNode;
  ai: ReactNode;
  timeline: ReactNode;
  copilot: ReactNode;
  defaultTab?: Customer360TabId;
}) {
  const [tab, setTab] = useState<Customer360TabId>(defaultTab);
  const panel: Record<Customer360TabId, ReactNode> = {
    overview,
    care,
    wealth,
    actions,
    ai,
    timeline,
  };

  return (
    <div className="page-wide">
      {header}
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
        <div>
          <div
            className="flex gap-1 overflow-x-auto pb-2"
            role="tablist"
            aria-label="Customer 360 sections"
          >
            {TAB_LABELS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={clsx(
                  "shrink-0 rounded-full px-3 py-2 text-sm font-semibold",
                  tab === t.id ? "bg-accent text-white" : "border border-line bg-white text-muted",
                )}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div role="tabpanel" className="mt-2">
            {panel[tab]}
          </div>
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow mb-2">Adviser copilot</p>
          {copilot}
        </aside>
      </div>
    </div>
  );
}
