import { type BudgetPlan, buildBudget } from "./budget";
import { buildChecklist, type VendorGroup } from "./checklist";
import { LIMITS } from "./constants";
import { curatedIdeas, withDefaults } from "./ideas";
import type { AiIdeas, EventBrief, PlanIdeas } from "./schema";
import { buildTimeline, daysBetween, type TimelinePlan } from "./timeline";

/** Where the ideas in a plan came from. Shown to the user for transparency. */
export type IdeasSource = "gemini" | "curated";

export interface EventPlan {
  brief: EventBrief;
  budget: BudgetPlan;
  timeline: TimelinePlan;
  checklist: VendorGroup[];
  ideas: PlanIdeas;
  ideasSource: IdeasSource;
  generatedAt: string;
}

/**
 * Checks that the event is today or later and within the planning horizon.
 * @param date - event date, YYYY-MM-DD.
 * @param today - today's date, YYYY-MM-DD.
 * @returns an error message, or null when the date is acceptable.
 */
export function validateEventDate(date: string, today: string): string | null {
  const days = daysBetween(today, date);
  if (days < 0) return "Choose a date that is today or later";
  if (days > LIMITS.maxPlanningDays) return "Utsav plans up to two years ahead";
  return null;
}

/**
 * Assembles a complete plan. Every number and date is computed deterministically here;
 * the AI only contributes ideas and a few extra tasks, which keeps the plan correct even
 * when the model is wrong or offline.
 * @param brief - validated event brief.
 * @param today - today's date, YYYY-MM-DD.
 * @param ai - optional ideas from Gemini.
 */
export function buildPlan(brief: EventBrief, today: string, ai?: AiIdeas | null): EventPlan {
  const ideas = ai ? withDefaults(ai, brief) : curatedIdeas(brief);
  return {
    brief,
    budget: buildBudget(
      brief.eventType,
      brief.budget,
      brief.guests,
      brief.currency,
      brief.priorities,
    ),
    timeline: buildTimeline(brief.eventType, brief.date, brief.guests, today, ideas.extraTasks),
    checklist: buildChecklist(brief.eventType, brief.guests, brief.notes),
    ideas,
    ideasSource: ai ? "gemini" : "curated",
    generatedAt: new Date().toISOString(),
  };
}
