"use client";

import { useEffect, useState } from "react";
import { Badge, Panel } from "@/components/ui";

type Event = {
  id: string;
  at: string;
  kind: string;
  title: string;
  detail: string;
};

export function CustomerTimeline({ customerId }: { customerId: string }) {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    void fetch(`/api/adviser/timeline?customerId=${customerId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setEvents);
  }, [customerId]);

  return (
    <Panel className="mt-4">
      <p className="eyebrow">Collaboration timeline</p>
      <ol className="mt-3 space-y-3">
        {events.length === 0 ? (
          <li className="muted text-sm">No timeline events yet.</li>
        ) : (
          events.map((e) => (
            <li key={e.id} className="border-l-2 border-accent-soft pl-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{e.kind.replaceAll("_", " ")}</Badge>
                <span className="muted text-xs">
                  {new Date(e.at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p className="mt-1 font-medium">{e.title}</p>
              <p className="muted text-sm">{e.detail}</p>
            </li>
          ))
        )}
      </ol>
    </Panel>
  );
}
