"use client";

import { useEffect, useRef, useState } from "react";
import { Hero } from "@/components/landing/hero";
import { PlanWorkspace, type PlanProgress } from "@/components/plan/plan-workspace";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { type AiStatus, ApiError, requestPlan } from "@/lib/client/api";
import { localTodayIso } from "@/lib/planner/format";
import { buildPlan, type EventPlan } from "@/lib/planner/plan";
import { aiIdeasSchema, type EventBrief, eventBriefSchema } from "@/lib/planner/schema";
import { PlannerForm } from "./planner-form";

interface SavedPlan {
  plan: EventPlan;
  ai: AiStatus;
}

const EMPTY_PROGRESS: PlanProgress = { done: [], actuals: {} };

/** Accepts a stored plan only if its brief still validates; otherwise storage is ignored. */
const AI_STATUSES: readonly AiStatus[] = ["ok", "cached", "offline", "invalid", "error", "local"];

/**
 * Restores a stored plan without trusting it: the brief and the ideas are re-validated with
 * the same schemas the server uses, and every number and date is recomputed from the brief
 * for today. Tampered or outdated storage can therefore never crash the page or show a
 * stale countdown.
 */
export function restoreSaved(value: unknown, today: string = localTodayIso()): SavedPlan | null {
  const candidate = value as {
    plan?: { brief?: unknown; ideas?: unknown; ideasSource?: unknown };
    ai?: unknown;
  } | null;
  const brief = eventBriefSchema.safeParse(candidate?.plan?.brief);
  if (!brief.success) return null;
  const ideas = aiIdeasSchema.safeParse(candidate?.plan?.ideas);
  const fromGemini = candidate?.plan?.ideasSource === "gemini" && ideas.success;
  const plan = buildPlan(brief.data, today, fromGemini ? ideas.data : null);
  const ai = AI_STATUSES.find((status) => status === candidate?.ai) ?? "offline";
  return { plan, ai };
}

function validateSaved(value: unknown): SavedPlan | null {
  return restoreSaved(value);
}

function validateProgress(value: unknown): PlanProgress | null {
  const candidate = value as PlanProgress | null;
  if (!candidate || !Array.isArray(candidate.done) || typeof candidate.actuals !== "object")
    return null;
  return {
    done: candidate.done.filter((id): id is string => typeof id === "string"),
    actuals: Object.fromEntries(
      Object.entries(candidate.actuals ?? {}).filter(
        ([, amount]) => typeof amount === "number" && amount > 0,
      ),
    ),
  };
}

/** Top-level planner: the brief form, then the plan workspace. State survives page reloads. */
export function PlannerApp({ today: serverToday }: { today: string }) {
  const [saved, setSaved, hydrated] = usePersistentState<SavedPlan | null>(
    "utsav.plan.v1",
    null,
    validateSaved,
  );
  const [progress, setProgress] = usePersistentState<PlanProgress>(
    "utsav.progress.v1",
    EMPTY_PROGRESS,
    validateProgress,
  );
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const controller = useRef<AbortController | null>(null);
  const focusPlanTitle = useRef(false);
  const today = hydrated ? localTodayIso() : serverToday;

  useEffect(() => () => controller.current?.abort(), []);

  // After a new plan renders, move focus to its title so keyboard and screen reader users land
  // on the result. Restoring a saved plan on page load does not steal focus.
  useEffect(() => {
    if (focusPlanTitle.current && saved && !editing) {
      focusPlanTitle.current = false;
      document.getElementById("plan-title")?.focus();
      window.scrollTo({ top: 0 });
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
    <>
      <Hero />
      <div id="planner" className="mx-auto max-w-5xl scroll-mt-4 space-y-4 px-5 py-12">
        {message && (
          <p
            role="alert"
            className="rounded-2xl border-2 border-alert bg-alert-soft p-4 font-bold text-alert"
          >
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
    </>
  );
}
