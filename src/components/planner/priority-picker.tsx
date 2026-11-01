import { FieldError } from "@/components/ui/field";
import { LIMITS, PRIORITY_LABELS, PRIORITY_OPTIONS, type Priority } from "@/lib/planner/constants";
import { describedBy } from "@/lib/planner/form-state";

interface PriorityPickerProps {
  value: Priority[];
  error?: string;
  onToggle: (priority: Priority) => void;
}

/** Checkbox chips for up to three budget priorities. */
export function PriorityPicker({ value, error, onToggle }: PriorityPickerProps) {
  const full = value.length >= LIMITS.prioritiesMax;
  return (
    <fieldset className="mt-5" aria-describedby={describedBy("priorities", true, Boolean(error))}>
      <legend className="field-label">What matters most? (up to {LIMITS.prioritiesMax})</legend>
      <p id="priorities-hint" className="field-hint mb-2">
        Priorities get a bigger share of the budget.
      </p>
      <div className="flex flex-wrap gap-2">
        {PRIORITY_OPTIONS.map((priority) => {
          const checked = value.includes(priority);
          const disabled = !checked && full;
          return (
            <label
              key={priority}
              className={`chip ${checked ? "bg-mint" : ""} ${disabled ? "opacity-60" : "cursor-pointer hover:bg-sun"}`}
            >
              <input
                id={priority === PRIORITY_OPTIONS[0] ? "field-priorities" : undefined}
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => onToggle(priority)}
                className="h-4 w-4 accent-[#006567]"
              />
              {PRIORITY_LABELS[priority]}
            </label>
          );
        })}
      </div>
      <FieldError name="priorities" error={error} />
    </fieldset>
  );
}
