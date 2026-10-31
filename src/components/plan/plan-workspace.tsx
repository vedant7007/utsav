"use client";

import { useState } from "react";
import { Rangoli } from "@/components/brand/rangoli";
import { Tabs } from "@/components/ui/tabs";
import type { AiStatus } from "@/lib/client/api";
import { checklistProgress } from "@/lib/planner/checklist";
import { EVENT_LABELS } from "@/lib/planner/constants";
import { formatDate, formatMoney, todayIso } from "@/lib/planner/format";
import type { EventPlan } from "@/lib/planner/plan";
import { AssistantChat } from "./assistant-chat";
import { BudgetPanel } from "./budget-panel";
import { IdeasPanel } from "./ideas-panel";
import { TimelinePanel } from "./timeline-panel";
import { VendorPanel } from "./vendor-panel";

export interface PlanProgress {
  done: string[];
  actuals: Record<string, number>;
}

interface PlanWorkspaceProps {
  plan: EventPlan;
  aiStatus: AiStatus;
  progress: PlanProgress;
  onProgressChange: (next: PlanProgress) => void;
  onEdit: () => void;
  onReset: () => void;
}

const AI_NOTICES: Partial<Record<AiStatus, string>> = {
  offline: "Running in offline mode: numbers and dates are complete, ideas are curated.",
  error: "Gemini was unavailable, so ideas are curated. Numbers and dates are unaffected.",
  invalid: "Gemini's answer did not pass validation, so curated ideas are shown instead.",
  local: "You appear to be offline. This plan was built in your browser.",
};

/** The generated plan: a festive header with the budget rangoli, then tabbed planning areas. */
export function PlanWorkspace({
  plan,
  aiStatus,
  progress,
  onProgressChange,
  onEdit,
  onReset,
}: PlanWorkspaceProps) {
  const [tab, setTab] = useState("overview");
  const { brief, budget, timeline, checklist, ideas } = plan;
  const tasks = checklistProgress(checklist, new Set(progress.done));
  const today = todayIso();
  const nextUp = timeline.milestones.find((milestone) => milestone.date >= today);
  const notice = AI_NOTICES[aiStatus];
  const petals = budget.lines.map((line) => ({
    id: line.id,
    label: line.label,
    share: line.share,
  }));
  const countdown = timeline.daysUntil === 0 ? "Today" : `${timeline.daysUntil} days`;

  function toggleTask(taskId: string) {
    const done = progress.done.includes(taskId)
      ? progress.done.filter((id) => id !== taskId)
      : [...progress.done, taskId];
    onProgressChange({ ...progress, done });
  }

  function setActual(lineId: string, amount: number) {
    const actuals = { ...progress.actuals };
    if (Number.isFinite(amount) && amount > 0) actuals[lineId] = Math.round(amount);
    else delete actuals[lineId];
    onProgressChange({ ...progress, actuals });
  }

  const overview = (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="sticker p-6">
        <h2 className="display text-3xl">Your plan at a glance</h2>
        <p className="mt-3 text-lg">{ideas.summary}</p>
        <p className="mt-4 rounded-2xl bg-sun p-4">
          <span className="font-bold">Theme concept: </span>
          {ideas.themeConcept}
        </p>
        <div
          className="mt-5 flex h-10 overflow-hidden rounded-full border-2 border-ink"
          aria-hidden="true"
        >
          {ideas.palette.map((swatch) => (
            <span
              key={swatch.hex + swatch.name}
              className="flex-1"
              style={{ backgroundColor: swatch.hex }}
            />
          ))}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-4">
        <Fact
          term="Countdown"
          value={timeline.daysUntil === 0 ? "Today!" : `${timeline.daysUntil} days to go`}
          tone="bg-blush"
        />
        <Fact term="Budget" value={formatMoney(budget.total, budget.currency)} tone="bg-sun" />
        <Fact
          term="Vendor tasks"
          value={`${tasks.completed} of ${tasks.total} done`}
          tone="bg-mint"
        />
        <Fact
          term="Next milestone"
          value={nextUp ? `${nextUp.title} (${formatDate(nextUp.date)})` : "All set"}
          tone="bg-paper"
        />
      </dl>
    </div>
  );

  return (
    <article aria-labelledby="plan-title">
      <div className="night-band on-night">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 pb-12 pt-6 md:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="inline-block rounded-full bg-marigold px-3 py-1 font-bold text-ink">
              {EVENT_LABELS[brief.eventType]}
            </p>
            <h1
              id="plan-title"
              tabIndex={-1}
              className="display mt-4 text-5xl focus:outline-none sm:text-7xl"
            >
              {brief.title}
            </h1>
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Event details">
              <Detail>
                <time dateTime={brief.date}>{formatDate(brief.date)}</time>
              </Detail>
              {brief.city && <Detail>{brief.city}</Detail>}
              <Detail>{brief.guests} guests</Detail>
              <Detail>{countdown} to go</Detail>
            </ul>
            <div className="no-print mt-7 flex flex-wrap gap-3">
              <button type="button" className="btn btn-sun" onClick={onEdit}>
                Edit details
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
                Print or save PDF
              </button>
              <button type="button" className="btn btn-ghost" onClick={onReset}>
                Start a new plan
              </button>
            </div>
          </div>
          <figure className="mx-auto text-marigold">
            <Rangoli
              key={plan.generatedAt}
              petals={petals}
              size={340}
              label={`Budget rangoli for ${brief.title}: ${budget.lines.length} categories, largest is ${
                [...budget.lines].sort((a, b) => b.amount - a.amount)[0]?.label ?? "none"
              }.`}
              className="h-auto w-64 sm:w-80"
            />
            <figcaption className="mt-1 text-center text-sm text-white/80">
              Your budget as a rangoli: bigger petal, bigger share.
            </figcaption>
          </figure>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 px-5 py-10">
        {notice && (
          <p role="status" className="sticker-sm bg-sun p-4 font-semibold">
            {notice}
          </p>
        )}
        <Tabs
          label="Plan sections"
          active={tab}
          onChange={setTab}
          items={[
            { id: "overview", label: "Overview", content: overview },
            {
              id: "budget",
              label: "Budget",
              content: (
                <BudgetPanel
                  brief={brief}
                  budget={budget}
                  actuals={progress.actuals}
                  onActualChange={setActual}
                />
              ),
            },
            {
              id: "timeline",
              label: "Timeline",
              content: (
                <TimelinePanel title={brief.title} timeline={timeline} runSheet={ideas.runSheet} />
              ),
            },
            {
              id: "vendors",
              label: "Vendors",
              content: (
                <VendorPanel checklist={checklist} done={progress.done} onToggle={toggleTask} />
              ),
            },
            {
              id: "ideas",
              label: "Ideas",
              content: <IdeasPanel ideas={ideas} source={plan.ideasSource} />,
            },
            { id: "assistant", label: "Ask Utsav", content: <AssistantChat brief={brief} /> },
          ]}
        />
      </div>
    </article>
  );
}

function Detail({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-full border-2 border-white/70 px-3 py-1 font-semibold">{children}</li>
  );
}

function Fact({ term, value, tone }: { term: string; value: string; tone: string }) {
  return (
    <div className={`sticker-sm p-4 ${tone}`}>
      <dt className="text-sm font-bold text-muted">{term}</dt>
      <dd className="mt-1 text-lg font-bold leading-snug">{value}</dd>
    </div>
  );
}
