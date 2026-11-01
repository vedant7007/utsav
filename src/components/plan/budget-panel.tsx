"use client";

import { useState, type JSX } from "react";
import { Rangoli } from "@/components/brand/rangoli";
import { useWhatIf } from "@/hooks/use-what-if";
import { type BudgetPlan, summariseSpend, whatIfRanges } from "@/lib/planner/budget";
import { formatMoney, formatPercent } from "@/lib/planner/format";
import type { EventBrief } from "@/lib/planner/schema";
import { SpendTable } from "./budget/spend-table";
import { WhatIfSimulator } from "./budget/what-if-simulator";

interface BudgetPanelProps {
  brief: EventBrief;
  budget: BudgetPlan;
  actuals: Record<string, number>;
  onActualChange: (lineId: string, amount: number) => void;
}

/**
 * Budget split with a what-if simulator (drag budget or guest count and watch every line and
 * the per-guest figure update), a rangoli chart linked to the table, and a spend tracker.
 */
export function BudgetPanel({
  brief,
  budget,
  actuals,
  onActualChange,
}: BudgetPanelProps): JSX.Element {
  const whatIf = useWhatIf(brief, budget);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { view } = whatIf;
  // Spending is always compared with the saved plan, not with a what-if scenario.
  const summary = summariseSpend(budget.lines, actuals);
  const money = (amount: number) => formatMoney(amount, budget.currency);
  const petals = view.lines.map(({ id, label, share }) => ({ id, label, share }));
  const chartLabel = `Budget rangoli: ${view.lines
    .map((line) => `${line.label} ${formatPercent(line.share)}`)
    .join(", ")}`;

  return (
    <section aria-labelledby="budget-heading" className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <div className="sticker flex flex-col items-center p-5 text-ink">
          <Rangoli
            petals={petals}
            activeId={activeId}
            size={280}
            label={chartLabel}
            className="h-auto w-full max-w-[280px]"
          />
          <p className="mt-2 text-center text-sm text-muted">Point at a row to find its petal.</p>
        </div>
        <WhatIfSimulator
          total={whatIf.total}
          guests={whatIf.guests}
          ranges={whatIfRanges(budget.total, brief.guests)}
          view={view}
          active={whatIf.active}
          spent={summary.actualTotal}
          money={money}
          onTotalChange={whatIf.setTotal}
          onGuestsChange={whatIf.setGuests}
          onReset={whatIf.reset}
        />
      </div>

      {summary.overCount > 0 && (
        <p
          role="status"
          className="rounded-2xl border-2 border-alert bg-alert-soft p-4 font-bold text-alert"
        >
          {summary.overCount} {summary.overCount === 1 ? "category is" : "categories are"} over
          budget. Move money from the contingency buffer or another line.
        </p>
      )}

      <SpendTable
        rows={summary.rows}
        lines={view.lines}
        total={view.total}
        actualTotal={summary.actualTotal}
        actuals={actuals}
        activeId={activeId}
        money={money}
        onActiveChange={setActiveId}
        onActualChange={onActualChange}
      />
    </section>
  );
}
