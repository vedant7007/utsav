"use client";

import { useEffect, useRef, useState } from "react";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { ApiError, requestPlan } from "@/lib/client/api";
import { errorMessage, isAbortError } from "@/lib/errors";
import { localTodayIso } from "@/lib/planner/format";
import {
  EMPTY_PROGRESS,
  type PlanProgress,
  restorePlan,
  restoreProgress,
  type SavedPlan,
} from "@/lib/planner/restore";
import type { EventBrief } from "@/lib/planner/schema";

export const PLAN_STORAGE_KEY = "utsav.plan.v1";
export const PROGRESS_STORAGE_KEY = "utsav.progress.v1";

const restoreSavedPlan = (value: unknown) => restorePlan(value, localTodayIso());

export interface Planner {
  saved: SavedPlan | null;
  progress: PlanProgress;
  hydrated: boolean;
  editing: boolean;
  busy: boolean;
  message: string;
  serverErrors: Record<string, string>;
  setProgress: (next: PlanProgress) => void;
  submit: (brief: EventBrief) => Promise<void>;
  startEditing: () => void;
  stopEditing: () => void;
  reset: () => void;
}

/**
 * All planner state in one place: the saved plan and progress (persisted to local storage),
 * the request lifecycle, and focus management after a new plan renders.
 */
export function usePlanner(): Planner {
  const [saved, setSaved, hydrated] = usePersistentState<SavedPlan | null>(
    PLAN_STORAGE_KEY,
    null,
    restoreSavedPlan,
  );
  const [progress, setProgress] = usePersistentState<PlanProgress>(
    PROGRESS_STORAGE_KEY,
    EMPTY_PROGRESS,
    restoreProgress,
  );
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const controller = useRef<AbortController | null>(null);
  const focusPlanTitle = useRef(false);

  useEffect(() => () => controller.current?.abort(), []);

  // After a new plan renders, move focus to its title so keyboard and screen reader users land
  // on the result. Restoring a saved plan on page load does not steal focus.
  useEffect(() => {
    if (!focusPlanTitle.current || !saved || editing) return;
    focusPlanTitle.current = false;
    document.getElementById("plan-title")?.focus();
    window.scrollTo({ top: 0 });
  }, [saved, editing]);

  async function submit(brief: EventBrief): Promise<void> {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setBusy(true);
    setServerErrors({});
    setMessage("");
    try {
      const result = await requestPlan(brief, current.signal);
      const sameEvent = saved?.plan.brief.eventType === brief.eventType;
      setSaved(result);
      if (!sameEvent) setProgress(EMPTY_PROGRESS);
      focusPlanTitle.current = true;
      setEditing(false);
    } catch (error) {
      if (isAbortError(error)) return;
      if (error instanceof ApiError) setServerErrors(error.fields);
      setMessage(errorMessage(error, "Could not build the plan. Please try again."));
    } finally {
      if (controller.current === current) setBusy(false);
    }
  }

  function reset(): void {
    setSaved(null);
    setProgress(EMPTY_PROGRESS);
    setEditing(false);
  }

  return {
    saved,
    progress,
    hydrated,
    editing,
    busy,
    message,
    serverErrors,
    setProgress,
    submit,
    startEditing: () => setEditing(true),
    stopEditing: () => setEditing(false),
    reset,
  };
}
