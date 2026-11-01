import type { JSX } from "react";
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
export function WhatIfSimulator(props: WhatIfSimulatorProps): JSX.Element {
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
        <RangeField
          id="whatif-budget"
          label="Total budget"
          value={total}
          min={ranges.budgetMin}
          max={ranges.budgetMax}
          step={ranges.step}
          format={money}
          onChange={props.onTotalChange}
        />
        <RangeField
          id="whatif-guests"
          label="Guests"
          value={guests}
          min={ranges.guestsMin}
          max={ranges.guestsMax}
          step={1}
          format={String}
          announce={(count) => `${String(count)} guests`}
          onChange={props.onGuestsChange}
        />
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

interface RangeFieldProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Human-readable value shown in the label. */
  format: (value: number) => string;
  /** What screen readers announce; defaults to the formatted value. */
  announce?: (value: number) => string;
  onChange: (value: number) => void;
}

/** A labelled slider that announces its formatted value. */
function RangeField({
  id,
  label,
  value,
  format,
  announce = format,
  onChange,
  ...range
}: RangeFieldProps): JSX.Element {
  const text = format(value);
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}: <span className="tabular-nums">{text}</span>
      </label>
      <input
        id={id}
        type="range"
        {...range}
        value={value}
        aria-describedby="whatif-hint"
        aria-valuetext={announce(value)}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
