"use client";

import { useState } from "react";
import { type BudgetPlan, buildBudget } from "@/lib/planner/budget";
import type { EventBrief } from "@/lib/planner/schema";

/**
 * What-if scenario state for the budget tab. The saved plan is never modified; the scenario
 * is recomputed with the same deterministic engine whenever the host drags a slider.
 * @param brief - the saved brief.
 * @param budget - the saved budget.
 */
export function useWhatIf(brief: EventBrief, budget: BudgetPlan) {
  const [total, setTotal] = useState(budget.total);
  const [guests, setGuests] = useState(brief.guests);
  const active = total !== budget.total || guests !== brief.guests;
  const view = active
    ? buildBudget(brief.eventType, total, guests, budget.currency, brief.priorities)
    : budget;

  function reset(): void {
    setTotal(budget.total);
    setGuests(brief.guests);
  }

  return { total, guests, setTotal, setGuests, active, view, reset };
}
