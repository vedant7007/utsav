"use client";

import { formatDate } from "@/lib/planner/format";
import { buildIcs } from "@/lib/planner/ics";
import type { PlanIdeas } from "@/lib/planner/schema";
import type { MilestonePhase, TimelinePlan } from "@/lib/planner/timeline";

const PHASES: { id: MilestonePhase; label: string; tone: string }[] = [
  { id: "early", label: "Early planning", tone: "bg-mint" },
  { id: "build-up", label: "Build-up", tone: "bg-sun" },
  { id: "final-week", label: "Final week", tone: "bg-blush" },
  { id: "event-day", label: "Event day", tone: "bg-marigold" },
  { id: "after", label: "After the event", tone: "bg-paper" },
];

interface TimelinePanelProps {
  title: string;
  timeline: TimelinePlan;
  runSheet: PlanIdeas["runSheet"];
}

/** Dated milestones grouped by phase, the event-day run sheet, and an .ics export. */
export function TimelinePanel({ title, timeline, runSheet }: TimelinePanelProps) {
  function downloadCalendar() {
    const blob = new Blob([buildIcs(title, timeline.milestones)], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const slug = title
      .replace(/[^\w-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
    link.href = url;
    link.download = `${slug || "utsav"}-timeline.ics`;
    // Some browsers only honour downloads from links in the document, and need the URL
    // to stay valid until the download has started.
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }

  return (
    <section aria-labelledby="timeline-heading" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="timeline-heading" className="display text-3xl">
          Planning timeline
        </h2>
        <button type="button" className="btn btn-sun no-print" onClick={downloadCalendar}>
          Add to calendar (.ics)
        </button>
      </div>

      {timeline.compressed && (
        <p role="note" className="sticker-sm bg-blush p-4">
          <strong>Short runway:</strong> some tasks would normally start earlier. They are marked
          &ldquo;Do soon&rdquo; and scheduled first, so tackle them this week.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          {PHASES.map((phase) => {
            const items = timeline.milestones.filter((milestone) => milestone.phase === phase.id);
            if (items.length === 0) return null;
            return (
              <div key={phase.id} className="sticker overflow-hidden">
                <h3
                  className={`border-b-2 border-ink px-5 py-2.5 text-lg font-extrabold ${phase.tone}`}
                >
                  {phase.label}
                </h3>
                <ol className="space-y-3 p-5">
                  {items.map((milestone) => (
                    <li key={milestone.id} className="grid grid-cols-[7.5rem_1fr] gap-3">
                      <time dateTime={milestone.date} className="font-bold tabular-nums text-muted">
                        {formatDate(milestone.date)}
                      </time>
                      <p className="font-medium">
                        {milestone.title}
                        {milestone.rushed && (
                          <span className="ml-2 inline-block rounded-full border border-ink bg-alert-soft px-2 py-0.5 text-xs font-bold text-alert">
                            Do soon
                          </span>
                        )}
                        {milestone.source === "ai" && (
                          <span className="ml-2 inline-block rounded-full border border-ink bg-mint px-2 py-0.5 text-xs font-bold">
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
        </div>

        <aside
          aria-labelledby="runsheet-heading"
          className="sticker h-fit bg-sun p-5 lg:sticky lg:top-4"
        >
          <h3 id="runsheet-heading" className="display text-2xl">
            Event-day run sheet
          </h3>
          <p className="text-sm text-muted">Share this with your family and vendors.</p>
          <ol className="mt-4 space-y-2">
            {runSheet.map((entry, index) => (
              <li
                key={`${entry.time}-${index}`}
                className="flex gap-3 rounded-xl border-2 border-ink bg-paper p-2.5"
              >
                <span className="w-20 shrink-0 font-extrabold tabular-nums">{entry.time}</span>
                <span>{entry.activity}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  );
}
