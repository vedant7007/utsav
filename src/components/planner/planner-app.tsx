"use client";

import { useEffect, useRef, useState } from "react";
import { PlanWorkspace, type PlanProgress } from "@/components/plan/plan-workspace";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { type AiStatus, ApiError, requestPlan } from "@/lib/client/api";
import { todayIso } from "@/lib/planner/format";
import type { EventPlan } from "@/lib/planner/plan";
import { type EventBrief, eventBriefSchema } from "@/lib/planner/schema";
import { PlannerForm } from "./planner-form";

interface SavedPlan {
  plan: EventPlan;
  ai: AiStatus;
}

const EMPTY_PROGRESS: PlanProgress = { done: [], actuals: {} };

/** Accepts a stored plan only if its brief still validates; otherwise storage is ignored. */
function validateSaved(value: unknown): SavedPlan | null {
  const candidate = value as SavedPlan | null;
  if (!candidate?.plan?.budget?.lines || !candidate.plan.timeline?.milestones) return null;
  return eventBriefSchema.safeParse(candidate.plan.brief).success ? candidate : null;
}

function validateProgress(value: unknown): PlanProgress | null {
  const candidate = value as PlanProgress | null;
  if (!candidate || !Array.isArray(candidate.done) || typeof candidate.actuals !== "object") return null;
  return {
    done: candidate.done.filter((id): id is string => typeof id === "string"),
    actuals: Object.fromEntries(
      Object.entries(candidate.actuals ?? {}).filter(([, amount]) => typeof amount === "number" && amount > 0),
    ),
  };
}

/** Top-level planner: the brief form, then the plan workspace. State survives page reloads. */
export function PlannerApp({ today: serverToday }: { today: string }) {
  const [saved, setSaved, hydrated] = usePersistentState<SavedPlan | null>("utsav.plan.v1", null, validateSaved);
  const [progress, setProgress] = usePersistentState<PlanProgress>("utsav.progress.v1", EMPTY_PROGRESS, validateProgress);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const controller = useRef<AbortController | null>(null);
  const focusPlanTitle = useRef(false);
  const today = hydrated ? todayIso() : serverToday;

  useEffect(() => () => controller.current?.abort(), []);

  // After a new plan renders, move focus to its title so keyboard and screen reader users land
  // on the result. Restoring a saved plan on page load does not steal focus.
  useEffect(() => {
    if (focusPlanTitle.current && saved && !editing) {
      focusPlanTitle.current = false;
      document.getElementById("plan-title")?.focus();
    }
  }, [saved, editing]);

  async function handleSubmit(brief: EventBrief) {
    controller.current?.abort();
    controller.current = new AbortController();
    setBusy(true);
    setServerErrors({});
    setMessage("");
    try {
      const result = await requestPlan(brief, controller.current.signal);
      const sameEvent = saved?.plan.brief.eventType === brief.eventType;
      setSaved(result);
      if (!sameEvent) setProgress(EMPTY_PROGRESS);
      focusPlanTitle.current = true;
      setEditing(false);
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      if (error instanceof ApiError) setServerErrors(error.fields);
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setSaved(null);
    setProgress(EMPTY_PROGRESS);
    setEditing(false);
  }

  if (saved && !editing) {
    return (
      <PlanWorkspace
        plan={saved.plan}
        aiStatus={saved.ai}
        progress={progress}
        onProgressChange={setProgress}
        onEdit={() => setEditing(true)}
        onReset={reset}
      />
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <p role="alert" className="rounded-xl border-2 border-alert bg-alert-soft p-4 font-semibold text-alert">
          {message}
        </p>
      )}
      <PlannerForm
        key={saved ? "edit" : "new"}
        today={today}
        initial={editing ? saved?.plan.brief : null}
        busy={busy}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
      />
      {editing && (
        <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
          Back to my plan
        </button>
      )}
    </div>
  );
}
