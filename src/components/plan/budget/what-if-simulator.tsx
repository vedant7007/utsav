import type { BudgetPlan, WhatIfRanges } from "@/lib/planner/budget";
import { Stat } from "./stat";

interface WhatIfSimulatorProps {
  total: number;
  guests: number;
  ranges: WhatIfRanges;
  view: BudgetPlan;
  active: boolean;
  spent: number;
  money: (amount: number) => string;
  onTotalChange: (total: number) => void;
  onGuestsChange: (guests: number) => void;
  onReset: () => void;
}

/** Two sliders and live headline figures for testing a different budget or guest list. */
export function WhatIfSimulator(props: WhatIfSimulatorProps) {
  const { total, guests, ranges, view, active, spent, money } = props;

  return (
    <div className="sticker p-6">
      <h2 id="budget-heading" className="display text-3xl">
        What if?
      </h2>
      <p id="whatif-hint" className="mt-1 text-muted">
        Drag to test a different budget or guest list. Your saved plan stays as it is.
      </p>
      <div className="mt-5 space-y-5">
        <div>
          <label htmlFor="whatif-budget" className="field-label">
            Total budget: <span className="tabular-nums">{money(total)}</span>
          </label>
          <input
            id="whatif-budget"
            type="range"
            min={ranges.budgetMin}
            max={ranges.budgetMax}
            step={ranges.step}
            value={total}
            aria-describedby="whatif-hint"
            aria-valuetext={money(total)}
            onChange={(event) => props.onTotalChange(Number(event.target.value))}
          />
        </div>
        <div>
          <label htmlFor="whatif-guests" className="field-label">
            Guests: <span className="tabular-nums">{guests}</span>
          </label>
          <input
            id="whatif-guests"
            type="range"
            min={ranges.guestsMin}
            max={ranges.guestsMax}
            step={1}
            value={guests}
            aria-describedby="whatif-hint"
            aria-valuetext={`${guests} guests`}
            onChange={(event) => props.onGuestsChange(Number(event.target.value))}
          />
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-3">
        <Stat label="Budget" value={money(view.total)} tone="bg-sun" />
        <Stat
          label="Per guest"
          value={money(view.perGuest)}
          tone={view.tight ? "bg-alert-soft" : "bg-mint"}
        />
        <Stat label="Spent" value={money(spent)} tone="bg-blush" />
      </dl>
      <div aria-live="polite" className="mt-4 space-y-3">
        {view.tight && (
          <p className="rounded-2xl border-2 border-ink bg-sun p-3">
            <strong>Tight budget:</strong> {money(view.perGuest)} per guest is lean for this kind of
            event. See the saving tips in Ideas, or trim the guest list.
          </p>
        )}
        {active && (
          <p className="flex flex-wrap items-center gap-3 font-semibold">
            Showing a what-if scenario.
            <button
              type="button"
              className="btn btn-ghost min-h-11 py-1.5 text-sm"
              onClick={props.onReset}
            >
              Back to my plan
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
