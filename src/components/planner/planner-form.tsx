"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Field } from "@/components/ui/field";
import { CURRENCIES, LIMITS } from "@/lib/planner/constants";
import {
  EMPTY_FORM,
  type FormState,
  orderedErrors,
  toFormState,
  togglePriority,
  validateForm,
} from "@/lib/planner/form-state";
import { sampleBriefs } from "@/lib/planner/samples";
import type { EventBrief, EventBriefInput } from "@/lib/planner/schema";
import { ErrorSummary } from "./error-summary";
import { EventTypePicker } from "./event-type-picker";
import { PriorityPicker } from "./priority-picker";
import { SamplePicker } from "./sample-picker";

interface PlannerFormProps {
  today: string;
  initial?: EventBriefInput | null;
  busy: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (brief: EventBrief) => void;
}

/** Collects and validates the event brief. Errors are summarised at the top and linked to fields. */
export function PlannerForm({
  today,
  initial,
  busy,
  serverErrors = {},
  onSubmit,
}: PlannerFormProps) {
  const [form, setForm] = useState<FormState>(initial ? toFormState(initial) : EMPTY_FORM);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [failedSubmits, setFailedSubmits] = useState(0);
  const summaryRef = useRef<HTMLDivElement>(null);
  const samples = useMemo(() => sampleBriefs(today), [today]);
  const errors: Record<string, string | undefined> = { ...serverErrors, ...clientErrors };

  // After a failed submit, move focus to the summary so screen reader users hear what to fix.
  useEffect(() => {
    if (failedSubmits > 0) summaryRef.current?.focus();
  }, [failedSubmits]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateForm(form, today);
    setClientErrors(result.ok ? {} : result.errors);
    if (result.ok) onSubmit(result.brief);
    else setFailedSubmits((count) => count + 1);
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="brief-heading"
      aria-busy={busy}
      className="sticker p-5 sm:p-9"
    >
      <h2 id="brief-heading" className="display text-4xl sm:text-5xl">
        Tell Utsav about your celebration
      </h2>
      <p className="mt-2 text-muted">
        Fields marked with an asterisk are required. Everything else makes the plan more personal.
      </p>

      <SamplePicker
        samples={samples}
        onPick={(sample) => {
          setForm(toFormState(sample.brief));
          setClientErrors({});
        }}
      />
      <ErrorSummary
        ref={summaryRef}
        entries={orderedErrors({ ...serverErrors, ...clientErrors })}
      />
      <EventTypePicker value={form.eventType} onChange={(type) => update("eventType", type)} />

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
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
      </div>

      <PriorityPicker
        value={form.priorities}
        error={errors.priorities}
        onToggle={(priority) => update("priorities", togglePriority(form.priorities, priority))}
      />

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

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="btn btn-primary text-lg"
          disabled={busy}
          aria-describedby="submit-status"
        >
          {busy ? "Planning your celebration..." : "Create my plan"}
        </button>
        <p id="submit-status" className="text-sm text-muted" aria-live="polite">
          {busy ? "Building budget, timeline, vendors and ideas. This takes a few seconds." : ""}
        </p>
      </div>
    </form>
  );
}
