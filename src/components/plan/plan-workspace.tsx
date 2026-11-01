"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import { checklistProgress } from "@/lib/planner/checklist";
import { countdownLabel, localTodayIso } from "@/lib/planner/format";
import type { EventPlan } from "@/lib/planner/plan";
import { type AiStatus, type PlanProgress, setActual, toggleTask } from "@/lib/planner/restore";
import { daysBetween } from "@/lib/planner/timeline";
import { AssistantChat } from "./assistant-chat";
import { BudgetPanel } from "./budget-panel";
import { IdeasPanel } from "./ideas-panel";
import { PlanHeader } from "./plan-header";
import { PlanOverview } from "./plan-overview";
import { TimelinePanel } from "./timeline-panel";
import { VendorPanel } from "./vendor-panel";

interface PlanWorkspaceProps {
  plan: EventPlan;
  aiStatus: AiStatus;
  progress: PlanProgress;
  onProgressChange: (next: PlanProgress) => void;
  onEdit: () => void;
  onReset: () => void;
}

export const AI_NOTICES: Partial<Record<AiStatus, string>> = {
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
  const today = localTodayIso();
  // Counted at render time so a saved plan never shows a stale countdown.
  const countdown = countdownLabel(daysBetween(today, brief.date));
  const tasks = checklistProgress(checklist, new Set(progress.done));
  const notice = AI_NOTICES[aiStatus];

  const items = [
    {
      id: "overview",
      label: "Overview",
      content: <PlanOverview plan={plan} countdown={countdown} today={today} tasks={tasks} />,
    },
    {
      id: "budget",
      label: "Budget",
      content: (
        <BudgetPanel
          brief={brief}
          budget={budget}
          actuals={progress.actuals}
          onActualChange={(lineId, amount) => onProgressChange(setActual(progress, lineId, amount))}
        />
      ),
    },
    {
      id: "timeline",
      label: "Timeline",
      content: <TimelinePanel title={brief.title} timeline={timeline} runSheet={ideas.runSheet} />,
    },
    {
      id: "vendors",
      label: "Vendors",
      content: (
        <VendorPanel
          checklist={checklist}
          done={progress.done}
          onToggle={(taskId) => onProgressChange(toggleTask(progress, taskId))}
        />
      ),
    },
    {
      id: "ideas",
      label: "Ideas",
      content: <IdeasPanel ideas={ideas} source={plan.ideasSource} />,
    },
    { id: "assistant", label: "Ask Utsav", content: <AssistantChat brief={brief} /> },
  ];

  return (
    <article aria-labelledby="plan-title">
      <PlanHeader plan={plan} countdown={countdown} onEdit={onEdit} onReset={onReset} />
      <div className="mx-auto max-w-6xl space-y-6 px-5 py-10">
        {notice && (
          <p role="status" className="sticker-sm bg-sun p-4 font-semibold">
            {notice}
          </p>
        )}
        <Tabs label="Plan sections" active={tab} onChange={setTab} items={items} />
      </div>
    </article>
  );
}
