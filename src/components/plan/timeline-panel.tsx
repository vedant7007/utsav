"use client";

import { formatDate } from "@/lib/planner/format";
import { buildIcs } from "@/lib/planner/ics";
import type { MilestonePhase, TimelinePlan } from "@/lib/planner/timeline";

const PHASE_LABELS: Record<MilestonePhase, string> = {
  early: "Early planning",
  "build-up": "Build-up",
  "final-week": "Final week",
  "event-day": "Event day",
  after: "After the event",
};
const PHASES: MilestonePhase[] = ["early", "build-up", "final-week", "event-day", "after"];

interface TimelinePanelProps {
  title: string;
  timeline: TimelinePlan;
}

/** Dated milestones grouped by phase, with an .ics export for any calendar app. */
export function TimelinePanel({ title, timeline }: TimelinePanelProps) {
  function downloadCalendar() {
    const blob = new Blob([buildIcs(title, timeline.milestones)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.replace(/[^\w-]+/g, "-").toLowerCase() || "utsav"}-timeline.ics`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section aria-labelledby="timeline-heading" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="timeline-heading" className="font-[family-name:var(--font-display)] text-xl font-bold text-maroon">
          Planning timeline
        </h3>
        <button type="button" className="btn btn-ghost no-print" onClick={downloadCalendar}>
          Add to calendar (.ics)
        </button>
      </div>

      {timeline.compressed && (
        <p role="note" className="rounded-xl border-l-4 border-marigold bg-marigold-soft p-4">
          <strong>Short runway:</strong> some tasks would normally start earlier. They are marked
          &ldquo;Do soon&rdquo; and scheduled first, so tackle them this week.
        </p>
      )}

      {PHASES.map((phase) => {
        const items = timeline.milestones.filter((milestone) => milestone.phase === phase);
        if (items.length === 0) return null;
        return (
          <div key={phase} className="card p-4">
            <h4 className="font-bold text-ink">{PHASE_LABELS[phase]}</h4>
            <ol className="mt-3 space-y-3 border-l-2 border-marigold pl-4">
              {items.map((milestone) => (
                <li key={milestone.id} className="relative">
                  <span aria-hidden="true" className="absolute -left-[23px] top-1.5 h-3 w-3 rounded-full bg-maroon" />
                  <p className="text-sm font-semibold text-muted">
                    <time dateTime={milestone.date}>{formatDate(milestone.date)}</time>
                  </p>
                  <p className="font-medium">
                    {milestone.title}
                    {milestone.rushed && (
                      <span className="ml-2 rounded-full bg-alert-soft px-2 py-0.5 text-xs font-bold text-alert">
                        Do soon
                      </span>
                    )}
                    {milestone.source === "ai" && (
                      <span className="ml-2 rounded-full bg-leaf-soft px-2 py-0.5 text-xs font-bold text-leaf">
                        AI suggestion
                      </span>
                    )}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        );
      })}
    </section>
  );
}
