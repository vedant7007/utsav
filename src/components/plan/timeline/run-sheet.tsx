import type { JSX } from "react";
import type { PlanIdeas } from "@/lib/planner/schema";

/** The event-day schedule, hour by hour, to share with family and vendors. */
export function RunSheet({ entries }: { entries: PlanIdeas["runSheet"] }): JSX.Element {
  return (
    <aside
      aria-labelledby="runsheet-heading"
      className="sticker h-fit bg-sun p-5 lg:sticky lg:top-4"
    >
      <h3 id="runsheet-heading" className="display text-2xl">
        Event-day run sheet
      </h3>
      <p className="text-sm text-muted">Share this with your family and vendors.</p>
      <ol className="mt-4 space-y-2">
        {entries.map((entry, index) => (
          <li
            key={`${entry.time}-${String(index)}`}
            className="flex gap-3 rounded-xl border-2 border-ink bg-paper p-2.5"
          >
            <span className="w-20 shrink-0 font-extrabold tabular-nums">{entry.time}</span>
            <span>{entry.activity}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
