import type { JSX } from "react";
import { Field } from "@/components/ui/field";
import { CURRENCIES, LIMITS } from "@/lib/planner/constants";
import type { FormState } from "@/lib/planner/form-state";

/** Sets one form value. */
export type UpdateField = <K extends keyof FormState>(key: K, value: FormState[K]) => void;

interface BriefFieldsProps {
  form: FormState;
  errors: Partial<Record<string, string>>;
  today: string;
  update: UpdateField;
}

/** The core event details: name, date, guests, budget, currency, city and theme. */
export function BriefFields(props: BriefFieldsProps): JSX.Element {
  return (
    <div className="mt-5 grid gap-5 sm:grid-cols-2">
      <RequiredFields {...props} />
      <OptionalFields {...props} />
    </div>
  );
}

/** Required details: name, date, guest count and total budget. */
function RequiredFields({ form, errors, today, update }: BriefFieldsProps): JSX.Element {
  return (
    <>
      <Field name="title" label="Event name *" error={errors.title} className="sm:col-span-2">
        {(control) => (
          <input
            {...control}
            className="field-input"
            value={form.title}
            maxLength={LIMITS.nameMax}
            onChange={(event) => update("title", event.target.value)}
            aria-required="true"
            autoComplete="off"
          />
        )}
      </Field>

      <Field name="date" label="Event date *" error={errors.date}>
        {(control) => (
          <input
            {...control}
            type="date"
            className="field-input"
            value={form.date}
            min={today}
            onChange={(event) => update("date", event.target.value)}
            aria-required="true"
          />
        )}
      </Field>

      <Field name="guests" label="Expected guests *" error={errors.guests}>
        {(control) => (
          <input
            {...control}
            type="number"
            inputMode="numeric"
            min={LIMITS.guestsMin}
            max={LIMITS.guestsMax}
            className="field-input"
            value={form.guests}
            onChange={(event) => update("guests", event.target.value)}
            aria-required="true"
          />
        )}
      </Field>

      <Field
        name="budget"
        label="Total budget *"
        hint="Whole amount for everything, for example 500000."
        error={errors.budget}
      >
        {(control) => (
          <input
            {...control}
            type="number"
            inputMode="numeric"
            min={LIMITS.budgetMin}
            className="field-input"
            value={form.budget}
            onChange={(event) => update("budget", event.target.value)}
            aria-required="true"
          />
        )}
      </Field>
    </>
  );
}

/** Optional details that personalise the plan: currency, city and theme. */
function OptionalFields({ form, errors, update }: BriefFieldsProps): JSX.Element {
  return (
    <>
      <Field name="currency" label="Currency" error={errors.currency}>
        {(control) => (
          <select
            {...control}
            className="field-input"
            value={form.currency}
            onChange={(event) => update("currency", event.target.value)}
          >
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field name="city" label="City" error={errors.city}>
        {(control) => (
          <input
            {...control}
            className="field-input"
            value={form.city}
            maxLength={LIMITS.cityMax}
            onChange={(event) => update("city", event.target.value)}
            autoComplete="address-level2"
          />
        )}
      </Field>

      <Field
        name="theme"
        label="Theme or vibe"
        hint="For example: boho garden, retro Bollywood, minimal white."
        error={errors.theme}
      >
        {(control) => (
          <input
            {...control}
            className="field-input"
            value={form.theme}
            maxLength={LIMITS.themeMax}
            onChange={(event) => update("theme", event.target.value)}
          />
        )}
      </Field>
    </>
  );
}

/** Free-text notes with a live character count. */
export function NotesField({ form, errors, update }: Omit<BriefFieldsProps, "today">): JSX.Element {
  return (
    <Field
      name="notes"
      label="Anything else? Dietary needs, accessibility, traditions"
      hint={`${form.notes.length}/${LIMITS.notesMax} characters`}
      error={errors.notes}
      className="mt-5"
    >
      {(control) => (
        <textarea
          {...control}
          className="field-input min-h-24"
          value={form.notes}
          maxLength={LIMITS.notesMax}
          onChange={(event) => update("notes", event.target.value)}
        />
      )}
    </Field>
  );
}
