"use client";

import type { JSX } from "react";
import { Hero } from "@/components/landing/hero";
import { PlanWorkspace } from "@/components/plan/plan-workspace";
import { usePlanner } from "@/hooks/use-planner";
import { localTodayIso } from "@/lib/planner/format";
import { PlannerForm } from "./planner-form";

/** Top-level planner: the brief form, then the plan workspace. State survives page reloads. */
export function PlannerApp({ today: serverToday }: { today: string }): JSX.Element {
  const planner = usePlanner();
  const { saved, editing } = planner;
  const today = planner.hydrated ? localTodayIso() : serverToday;

  if (saved && !editing) {
    return (
      <PlanWorkspace
        plan={saved.plan}
        aiStatus={saved.ai}
        progress={planner.progress}
        onProgressChange={planner.setProgress}
        onEdit={planner.startEditing}
        onReset={planner.reset}
      />
    );
  }

  return (
    <>
      <Hero />
      <div id="planner" className="mx-auto max-w-5xl scroll-mt-4 space-y-4 px-5 py-12">
        {planner.message && (
          <p
            role="alert"
            className="rounded-2xl border-2 border-alert bg-alert-soft p-4 font-bold text-alert"
          >
            {planner.message}
          </p>
        )}
        <PlannerForm
          key={saved ? "edit" : "new"}
          today={today}
          initial={editing ? saved?.plan.brief : null}
          busy={planner.busy}
          serverErrors={planner.serverErrors}
          onSubmit={(brief) => void planner.submit(brief)}
        />
        {editing && (
          <button type="button" className="btn btn-ghost" onClick={planner.stopEditing}>
            Back to my plan
          </button>
        )}
      </div>
    </>
  );
}
