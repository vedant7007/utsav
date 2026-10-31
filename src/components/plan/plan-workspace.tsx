"use client";

import { useState } from "react";
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

/** The generated plan: a header summary and tabbed sections for each planning area. */
export function PlanWorkspace({ plan, aiStatus, progress, onProgressChange, onEdit, onReset }: PlanWorkspaceProps) {
  const [tab, setTab] = useState("overview");
  const { brief, budget, timeline, checklist, ideas } = plan;
  const tasks = checklistProgress(checklist, new Set(progress.done));
  const today = todayIso();
  const nextUp = timeline.milestones.find((milestone) => milestone.date >= today);
  const notice = AI_NOTICES[aiStatus];

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
    <div className="space-y-5">
      <div className="card p-5">
        <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-maroon">Your plan at a glance</h3>
        <p className="mt-2 text-lg">{ideas.summary}</p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Fact term="Countdown" value={timeline.daysUntil === 0 ? "Today!" : `${timeline.daysUntil} days to go`} />
        <Fact term="Budget" value={formatMoney(budget.total, budget.currency)} />
        <Fact term="Vendor tasks" value={`${tasks.completed} of ${tasks.total} done`} />
        <Fact term="Next milestone" value={nextUp ? `${nextUp.title} (${formatDate(nextUp.date)})` : "All set"} />
      </dl>
    </div>
  );

  return (
    <article aria-labelledby="plan-title" className="space-y-6">
      <div className="card flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-leaf">{EVENT_LABELS[brief.eventType]}</p>
          <h2 id="plan-title" tabIndex={-1} className="font-[family-name:var(--font-display)] text-3xl font-bold text-maroon focus:outline-none">
            {brief.title}
          </h2>
          <p className="mt-1 text-muted">
            <time dateTime={brief.date}>{formatDate(brief.date)}</time>
            {brief.city ? ` · ${brief.city}` : ""} · {brief.guests} guests
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost" onClick={onEdit}>
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

      {notice && (
        <p role="status" className="rounded-xl border-l-4 border-marigold bg-marigold-soft p-4">
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
            content: <BudgetPanel budget={budget} actuals={progress.actuals} onActualChange={setActual} />,
          },
          { id: "timeline", label: "Timeline", content: <TimelinePanel title={brief.title} timeline={timeline} /> },
          {
            id: "vendors",
            label: "Vendors",
            content: <VendorPanel checklist={checklist} done={progress.done} onToggle={toggleTask} />,
          },
          { id: "ideas", label: "Ideas", content: <IdeasPanel ideas={ideas} source={plan.ideasSource} /> },
          { id: "assistant", label: "Ask Utsav", content: <AssistantChat brief={brief} /> },
        ]}
      />
    </article>
  );
}

function Fact({ term, value }: { term: string; value: string }) {
  return (
    <div className="card p-4">
      <dt className="text-sm font-semibold text-muted">{term}</dt>
      <dd className="mt-1 font-bold">{value}</dd>
    </div>
  );
}
