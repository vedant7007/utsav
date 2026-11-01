"use client";

import type { JSX } from "react";
import { downloadText } from "@/lib/client/download";
import { slugify } from "@/lib/planner/format";
import { buildIcs } from "@/lib/planner/ics";
import type { PlanIdeas } from "@/lib/planner/schema";
import type { MilestonePhase, TimelinePlan } from "@/lib/planner/timeline";
import { PhaseCard } from "./timeline/phase-card";
import { RunSheet } from "./timeline/run-sheet";

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
export function TimelinePanel({ title, timeline, runSheet }: TimelinePanelProps): JSX.Element {
  const phases = PHASES.map((phase) => ({
    ...phase,
    milestones: timeline.milestones.filter((milestone) => milestone.phase === phase.id),
  })).filter((phase) => phase.milestones.length > 0);

  function downloadCalendar(): void {
    downloadText(
      `${slugify(title)}-timeline.ics`,
      buildIcs(title, timeline.milestones),
      "text/calendar;charset=utf-8",
    );
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
          {phases.map((phase) => (
            <PhaseCard
              key={phase.id}
              label={phase.label}
              tone={phase.tone}
              milestones={phase.milestones}
            />
          ))}
        </div>
        <RunSheet entries={runSheet} />
      </div>
    </section>
  );
}
