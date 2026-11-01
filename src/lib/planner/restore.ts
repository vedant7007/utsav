import { z } from "zod";
import { buildPlan, type EventPlan } from "./plan";
import { aiIdeasSchema, eventBriefSchema } from "./schema";

/** Where a plan's ideas came from, as reported by the API (plus "local" for browser fallback). */
export const AI_STATUSES = ["ok", "cached", "offline", "invalid", "error", "local"] as const;
export type AiStatus = (typeof AI_STATUSES)[number];

export interface SavedPlan {
  plan: EventPlan;
  ai: AiStatus;
}

/** The host's progress on a plan: completed checklist tasks and actual spend per budget line. */
export interface PlanProgress {
  done: string[];
  actuals: Record<string, number>;
}

export const EMPTY_PROGRESS: PlanProgress = { done: [], actuals: {} };

const savedShape = z.object({
  plan: z.object({
    brief: z.unknown(),
    ideas: z.unknown().optional(),
    ideasSource: z.unknown().optional(),
  }),
  ai: z.unknown().optional(),
});

const progressShape = z.object({
  done: z.array(z.unknown()),
  actuals: z.record(z.string(), z.unknown()),
});

function isAiStatus(value: unknown): value is AiStatus {
  return AI_STATUSES.some((status) => status === value);
}

/**
 * Rebuilds a plan from untrusted JSON (an API response or local storage). Only the brief and
 * the ideas are taken from the input, each re-validated with the server's schemas; every
 * number and date is recomputed for `today`. Tampered or outdated data can therefore never
 * crash the page or show a stale countdown.
 * @param value - untrusted JSON.
 * @param today - today's date, YYYY-MM-DD.
 * @returns the rebuilt plan, or null when the brief is missing or invalid.
 */
export function restorePlan(value: unknown, today: string): SavedPlan | null {
  const shape = savedShape.safeParse(value);
  if (!shape.success) return null;
  const { plan, ai } = shape.data;
  const brief = eventBriefSchema.safeParse(plan.brief);
  if (!brief.success) return null;
  const ideas = aiIdeasSchema.safeParse(plan.ideas);
  const fromGemini = plan.ideasSource === "gemini" && ideas.success;
  return {
    plan: buildPlan(brief.data, today, fromGemini ? ideas.data : null),
    ai: isAiStatus(ai) ? ai : "offline",
  };
}

/**
 * Restores saved progress, dropping anything malformed.
 * @param value - untrusted JSON from local storage.
 */
export function restoreProgress(value: unknown): PlanProgress | null {
  const shape = progressShape.safeParse(value);
  if (!shape.success) return null;
  return {
    done: shape.data.done.filter((id): id is string => typeof id === "string"),
    actuals: Object.fromEntries(
      Object.entries(shape.data.actuals).filter(
        (entry): entry is [string, number] =>
          typeof entry[1] === "number" && Number.isFinite(entry[1]) && entry[1] > 0,
      ),
    ),
  };
}

/**
 * Marks a checklist task done, or undoes it.
 * @param progress - current progress.
 * @param taskId - checklist task id.
 */
export function toggleTask(progress: PlanProgress, taskId: string): PlanProgress {
  const done = progress.done.includes(taskId)
    ? progress.done.filter((id) => id !== taskId)
    : [...progress.done, taskId];
  return { ...progress, done };
}

/**
 * Records actual spend for a budget line. Zero, negative or invalid amounts clear the entry.
 * @param progress - current progress.
 * @param lineId - budget line id.
 * @param amount - amount spent, in whole currency units.
 */
export function setActual(progress: PlanProgress, lineId: string, amount: number): PlanProgress {
  const actuals = Object.fromEntries(
    Object.entries(progress.actuals).filter(([id]) => id !== lineId),
  );
  if (Number.isFinite(amount) && amount > 0) actuals[lineId] = Math.round(amount);
  return { ...progress, actuals };
}
